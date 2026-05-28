<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Events\NewChatMessage;
use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Seller;
use App\Models\SiteSetting;
use App\Services\AiChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(private AiChatService $ai)
    {
    }

    /**
     * POST /api/public/chat
     * Body: { session_id?: string, message?: string, restart?: bool }
     */
    public function send(Request $request)
    {
        $data = $request->validate([
            'session_id' => ['nullable', 'string', 'max:64'],
            'message' => ['nullable', 'string', 'max:2000'],
            'restart' => ['nullable', 'boolean'],
        ]);

        $sessionId = ($data['session_id'] ?? null) ?: (string) Str::uuid();
        $cacheKey = "chat:$sessionId";

        if (! empty($data['restart'] ?? null)) {
            Cache::forget($cacheKey);
        }

        $state = Cache::get($cacheKey, $this->initialState());
        $conversation = $this->ensureConversation($sessionId);

        $userMessage = trim((string) ($data['message'] ?? ''));

        if ($userMessage !== '') {
            $state['history'][] = ['who' => 'user', 'text' => $userMessage, 'at' => now()->toIso8601String()];
            $this->logMessage($conversation, 'client', $userMessage);
        }

        // Si la conversación está tomada por un humano, el bot NO responde.
        // El mensaje del cliente se guarda y llegará al vendedor por polling.
        if (in_array($conversation->status, ['human', 'closed'], true)) {
            Cache::put($cacheKey, $state, now()->addHours(2));
            $closed = $conversation->status === 'closed';
            return response()->json([
                'session_id' => $sessionId,
                'state' => $closed ? 'closed' : 'human',
                'reply' => '',
                'silent' => true,
                'conversation_status' => $conversation->status,
            ]);
        }

        $response = $this->processTurn($state, $userMessage, $conversation);

        $state['history'][] = ['who' => 'bot', 'text' => $response['reply'], 'at' => now()->toIso8601String()];
        $this->logMessage($conversation, 'bot', $response['reply'], [
            'state' => $state['step'],
            'products' => $response['products'] ?? null,
            'suggestions' => $response['suggestions'] ?? null,
        ]);

        Cache::put($cacheKey, $state, now()->addHours(2));

        if (! empty($response['done'])) {
            $this->finalizeLead($sessionId, $state, $conversation);
        }

        return response()->json(array_merge([
            'session_id' => $sessionId,
            'state' => $state['step'],
        ], $response));
    }

    private function initialState(): array
    {
        return [
            'step' => 'greeting',
            'history' => [],
            'document_type' => null,
            'document_number' => null,
            'client_id' => null,
            'client_in_erp' => false,
            'person_type' => null,
            'lead' => [
                'name' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'city' => null,
                'interest' => null,
                'message' => null,
            ],
            'matched_products' => [],
        ];
    }

    private function ensureConversation(string $sessionId): ChatConversation
    {
        return ChatConversation::firstOrCreate(
            ['session_id' => $sessionId],
            ['status' => 'bot', 'started_at' => now(), 'last_message_at' => now()],
        );
    }

    /**
     * Garantiza una sola conversación abierta por cliente.
     * Si el cliente ya tiene una conversación previa (no cerrada), mueve los mensajes
     * de la conversación actual hacia la existente, actualiza el session_id al actual
     * y muta $conv en sitio para que apunte a la conversación canónica.
     */
    private function mergeIfDuplicateClientConversation(ChatConversation $conv, int $clientId): void
    {
        $existing = ChatConversation::where('client_id', $clientId)
            ->where('id', '!=', $conv->id)
            ->whereIn('status', ['bot', 'human', 'waiting_human'])
            ->orderBy('id')
            ->first();

        if (! $existing) {
            return;
        }

        ChatMessage::where('conversation_id', $conv->id)
            ->update(['conversation_id' => $existing->id]);

        $oldId = $conv->id;
        $newSessionId = $conv->session_id;

        // Borrar primero la duplicada para liberar el UNIQUE de session_id.
        ChatConversation::where('id', $oldId)->delete();

        $existing->update([
            'session_id' => $newSessionId,
            'last_message_at' => now(),
        ]);

        // Mutar $conv en sitio para que el resto del flujo use la canónica.
        $conv->setRawAttributes($existing->fresh()->getAttributes(), true);
        $conv->exists = true;
    }

    private function logMessage(ChatConversation $conv, string $sender, string $body, ?array $meta = null): void
    {
        if (trim($body) === '') {
            return;
        }
        $msg = ChatMessage::create([
            'conversation_id' => $conv->id,
            'sender' => $sender,
            'body' => $body,
            'metadata' => $meta,
            'created_at' => now(),
        ]);
        $conv->update(['last_message_at' => now()]);

        // Solo emitimos al canal los mensajes del bot/system/seller (que el cliente NO originó) o los del cliente
        // para que el vendedor se entere en tiempo real.
        NewChatMessage::dispatchSafe($msg, $conv->session_id);
    }

    private function processTurn(array &$state, string $message, ChatConversation $conv): array
    {
        $lower = mb_strtolower($message);
        $siteName = SiteSetting::get('site_name', 'Grupo Santacruz');

        if ($state['step'] === 'greeting' && $message === '') {
            $state['step'] = 'awaiting_document';
            return [
                'reply' => "¡Hola! 😊 Soy **Valeria**, del equipo de atención al cliente de $siteName. Para ubicarte rápido en nuestro sistema y conectarte con tu asesor, ¿me regalas tu NIT o cédula?\n\nSi es la primera vez que nos contactas, dime *\"soy nuevo\"* y te ayudo a registrarte.",
                'suggestions' => ['Soy cliente nuevo'],
            ];
        }

        if (preg_match('/\b(reiniciar|empezar de nuevo|reset)\b/u', $lower)) {
            $newState = $this->initialState();
            $newState['step'] = 'awaiting_document';
            $newState['history'] = $state['history'];
            $state = $newState;
            return [
                'reply' => 'Listo, arrancamos de cero 🙂 ¿Me compartes tu NIT o cédula?',
                'suggestions' => ['Soy cliente nuevo'],
            ];
        }

        switch ($state['step']) {
            case 'greeting':
            case 'awaiting_document':
                return $this->handleDocument($state, $message, $lower, $conv);

            case 'collecting_person_type':
                $pt = $this->detectPersonType($lower);
                if (! $pt) {
                    return ['reply' => 'No te pillo bien 😅 ¿Eres **persona natural** (con cédula) o **empresa / jurídica** (con NIT)? Solo dime *natural* o *empresa*.'];
                }
                $state['person_type'] = $pt;
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_doc':
                $this->extractLeadFields($state, $message);
                $digits = preg_replace('/\D/', '', $message);
                if (mb_strlen($digits) < 5) {
                    $label = $state['person_type'] === 'juridica' ? 'NIT' : 'número de cédula';
                    return ['reply' => "Mmm, ese {$label} se ve cortico 🤔 ¿Me lo confirmas completo? (mínimo 5 dígitos)"];
                }
                $state['document_number'] = $digits;
                $state['document_type'] = $state['person_type'] === 'juridica' ? 'NIT' : 'CC';
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_name':
                $this->extractLeadFields($state, $message);
                if (empty($state['lead']['name']) || mb_strlen($state['lead']['name']) < 3) {
                    $ask = $state['person_type'] === 'juridica'
                        ? '¿Me regalas la **razón social** completa de la empresa? Para registrarla bien 😊'
                        : '¿Me regalas tu **nombre completo**? Así te dejo bien registrado.';
                    return ['reply' => $ask];
                }
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_phone':
                $this->extractLeadFields($state, $message);
                $digits = preg_replace('/\D/', '', $state['lead']['phone'] ?? '');
                if (mb_strlen($digits) < 7) {
                    return ['reply' => 'Ese número se ve incompleto 🤔 ¿Me lo pasas de nuevo? Mejor si es **WhatsApp** para coordinar rapidito.'];
                }
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_email':
                $this->extractLeadFields($state, $message);
                if (empty($state['lead']['email']) || ! filter_var($state['lead']['email'], FILTER_VALIDATE_EMAIL)) {
                    return ['reply' => 'Hmm, ese correo no me cuadra 😅 ¿Me lo escribes de nuevo? (ej: nombre@empresa.com)'];
                }
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_address':
                $this->extractLeadFields($state, $message);
                if (empty($state['lead']['address'])) {
                    $raw = trim($message);
                    if (mb_strlen($raw) >= 5) {
                        $state['lead']['address'] = $raw;
                    } else {
                        return ['reply' => '¿Me das la dirección completa? (calle/carrera, número y barrio si aplica)'];
                    }
                }
                return $this->advanceRegistration($state, $conv);

            case 'collecting_new_city':
                $this->extractLeadFields($state, $message);
                if (empty($state['lead']['city'])) {
                    $state['lead']['city'] = $this->smartTitleCase(trim($message));
                }
                return $this->advanceRegistration($state, $conv);

            case 'ready_to_chat':
            case 'awaiting_quote_confirm':
                return $this->handleDiscovery($state, $message, $lower, $conv);

            case 'collecting_message':
                if (! in_array($lower, ['listo', 'nada mas', 'nada más', 'no', 'ninguno', ''], true)) {
                    $state['lead']['message'] = trim($message);
                }
                $state['step'] = 'done';
                $sellerName = $conv->fresh()->seller?->name ?? 'un asesor';
                $clientName = $state['lead']['name'] ?? '';
                return [
                    'reply' => "¡Perfecto{$this->commaName($clientName)}! ✅ Le paso todo a **$sellerName** y te contactará muy pronto. ¿Hay algo más en lo que te pueda ayudar mientras tanto?",
                    'suggestions' => ['Ver catálogo', 'Ver promociones', 'No, gracias'],
                    'done' => true,
                ];

            case 'done':
                return $this->handleDiscovery($state, $message, $lower, $conv);
        }

        return ['reply' => '¿Me cuentas un poquito más? No te entendí del todo 🙂'];
    }

    private function commaName(string $name): string
    {
        return $name ? ", $name" : '';
    }

    /**
     * Avanza el flujo de registro pidiendo el siguiente dato que falte.
     * Reutiliza datos ya extraídos (cuando el cliente envía varios en un mismo mensaje).
     */
    private function advanceRegistration(array &$state, ChatConversation $conv): array
    {
        if (empty($state['person_type'])) {
            $state['step'] = 'collecting_person_type';
            return [
                'reply' => $this->pick([
                    '¡Listo! Vamos a registrarte rapidito 😊 Para empezar: ¿eres **persona natural** (con cédula) o representas una **empresa / jurídica** (con NIT)?',
                    '¡Dale, te creo el perfil! Cuéntame primero: ¿es a tu nombre como **persona natural** (cédula) o vas a registrar una **empresa** (NIT)?',
                ]),
                'suggestions' => ['Persona natural', 'Empresa (NIT)'],
            ];
        }
        if (empty($state['document_number'])) {
            $state['step'] = 'collecting_new_doc';
            $ask = $state['person_type'] === 'juridica'
                ? 'Perfecto, ¿cuál es el **NIT** de la empresa? (con dígito de verificación si lo sabes)'
                : 'Perfecto, ¿cuál es tu **número de cédula**?';
            return ['reply' => $ask];
        }
        if (empty($state['lead']['name'])) {
            $state['step'] = 'collecting_new_name';
            $ask = $state['person_type'] === 'juridica'
                ? '¿Cuál es la **razón social** de la empresa?'
                : '¿Cuál es tu **nombre completo**?';
            return ['reply' => $ask];
        }
        $name = $state['lead']['name'];
        if (empty($state['lead']['phone'])) {
            $state['step'] = 'collecting_new_phone';
            return ['reply' => $this->pick([
                "¡Gracias, {$name}! 🙌 ¿A qué **WhatsApp o celular** te podemos contactar?",
                "Súper, {$name}. ¿Me pasas tu **WhatsApp** o celular para que tu asesor te ubique?",
            ])];
        }
        if (empty($state['lead']['email'])) {
            $state['step'] = 'collecting_new_email';
            return ['reply' => $this->pick([
                'Va. ¿Y un **correo** para enviarte las cotizaciones?',
                'Listo. ¿Me regalas tu **correo electrónico**?',
            ])];
        }
        if (empty($state['lead']['address'])) {
            $state['step'] = 'collecting_new_address';
            return ['reply' => '¿Cuál es la **dirección** donde podemos despacharte? (calle/carrera, número y barrio si aplica)'];
        }
        if (empty($state['lead']['city'])) {
            $state['step'] = 'collecting_new_city';
            return ['reply' => 'Y para terminar, ¿en qué **ciudad** estás?'];
        }
        $this->createClientForState($state, $conv);
        $state['step'] = 'ready_to_chat';
        $sellerName = $conv->fresh()->seller?->name ?? 'tu asesor';
        $tipo = $state['person_type'] === 'juridica' ? 'NIT' : 'CC';
        $resumen = "• *Tipo:* ".($state['person_type'] === 'juridica' ? 'Empresa' : 'Persona natural')."\n".
            "• *{$tipo}:* {$state['document_number']}\n".
            "• *Nombre:* {$state['lead']['name']}\n".
            "• *Tel:* {$state['lead']['phone']}\n".
            "• *Email:* {$state['lead']['email']}\n".
            "• *Dirección:* {$state['lead']['address']}\n".
            "• *Ciudad:* {$state['lead']['city']}";
        return [
            'reply' => "¡Quedaste registrado! 🎉\n\n{$resumen}\n\nTe asigné a **{$sellerName}** como tu asesor. Él/ella te confirma el alta formal con cartera (te pueden pedir RUT, cámara de comercio u otros documentos según el caso).\n\nMientras tanto, cuéntame ¿en qué te puedo ayudar hoy?",
            'suggestions' => ['Ver catálogo', 'Cotizar productos', 'Ver promociones'],
        ];
    }

    private function detectPersonType(string $lower): ?string
    {
        if (preg_match('/\b(empresa|juridica|jurídica|nit|raz[oó]n social|compa[ñn][í]a|s\.?a\.?s|sa\.s|persona juridica)\b/u', $lower)) {
            return 'juridica';
        }
        if (preg_match('/\b(natural|persona natural|c[eé]dula|cc|individuo|propio|m[ií] nombre|para m[ií])\b/u', $lower)) {
            return 'natural';
        }
        return null;
    }

    /**
     * Extrae nombre, razón social, NIT, teléfono y email cuando vienen en lenguaje natural.
     * Sólo sobrescribe campos vacíos del state.
     */
    private function extractLeadFields(array &$state, string $message): void
    {
        $msg = trim($message);

        if (empty($state['lead']['email']) && preg_match('/[\w.+-]+@[\w-]+\.[\w.-]+/u', $msg, $em)) {
            if (filter_var($em[0], FILTER_VALIDATE_EMAIL)) {
                $state['lead']['email'] = $em[0];
            }
        }

        if (preg_match('/\bnit[:#\s]*([\d.\-]{5,})/iu', $msg, $nm)) {
            $nit = preg_replace('/\D/', '', $nm[1]);
            if (mb_strlen($nit) >= 5) {
                $state['document_number'] = $state['document_number'] ?? $nit;
            }
        }

        if (empty($state['lead']['phone'])) {
            if (preg_match('/(?:tel[eé]fono|cel(?:ular)?|whats?app|wpp|n[uú]mero|m[oó]vil)\s*(?:es|:|son)?\s*([+\d][\d\s().-]{6,})/iu', $msg, $pm)) {
                $state['lead']['phone'] = trim($pm[1]);
            } else {
                $digitsOnly = preg_replace('/\D/', '', $msg);
                if (mb_strlen($digitsOnly) >= 7 && mb_strlen($digitsOnly) <= 15 && preg_match('/^[+\d][\d\s().-]{6,}$/u', $msg)) {
                    $state['lead']['phone'] = trim($msg);
                }
            }
        }

        if (empty($state['lead']['address']) && preg_match('/(?:direcci[oó]n|vivo en|queda en|ubicad[oa] en|estoy en|domicilio)\s*(?:es|:|en)?\s*([^,.;\n]{5,120})/iu', $msg, $am)) {
            $state['lead']['address'] = trim($am[1]);
        }

        if (empty($state['lead']['name'])) {
            $name = null;
            if (preg_match('/\b(?:mi nombre es|me llamo|me dicen|soy)\s+([^,.;\n]+?)(?=\s+(?:y|pero|con|tel|cel|whats|email|correo|nit|de la empresa|de mi empresa|raz[oó]n)\b|[,.;\n]|$)/iu', $msg, $nm2)) {
                $name = $nm2[1];
            } elseif (preg_match('/(?:raz[oó]n\s+social|empresa|compa[ñn][ií]a)\s+(?:es|:|llamada|se llama|llamad[ao])?\s*([^,.;\n]+?)(?=\s+(?:y|pero|con|tel|cel|whats|email|correo|nit)\b|[,.;\n]|$)/iu', $msg, $rm)) {
                $name = $rm[1];
            } elseif (! preg_match('/\b(nit|tel|cel|whats|email|correo|empresa|raz[oó]n)\b/iu', $msg) && mb_strlen($msg) <= 60) {
                $name = $msg;
            }
            if ($name) {
                $clean = trim(preg_replace('/\s+/u', ' ', $name));
                if (mb_strlen($clean) >= 2 && mb_strlen($clean) <= 80) {
                    $state['lead']['name'] = $this->smartTitleCase($clean);
                }
            }
        }
    }

    /**
     * Title-case respetando siglas en mayúsculas y palabras cortas (de, la, del...).
     */
    private function smartTitleCase(string $text): string
    {
        $minor = ['de','del','la','las','los','y','e','o','u','en','para'];
        $words = preg_split('/\s+/u', $text);
        $out = [];
        foreach ($words as $i => $w) {
            if ($w === '') { continue; }
            if (mb_strtoupper($w) === $w && mb_strlen($w) <= 5 && preg_match('/^[A-ZÑ]+$/u', $w)) {
                $out[] = $w;
                continue;
            }
            $lower = mb_strtolower($w, 'UTF-8');
            if ($i > 0 && in_array($lower, $minor, true)) {
                $out[] = $lower;
            } else {
                $out[] = mb_strtoupper(mb_substr($lower, 0, 1, 'UTF-8'), 'UTF-8').mb_substr($lower, 1, null, 'UTF-8');
            }
        }
        return implode(' ', $out);
    }

    /**
     * Elige una variante al azar para que el bot no suene repetitivo.
     * @param array<int,string> $options
     */
    private function pick(array $options): string
    {
        return $options[array_rand($options)];
    }

    private function handleDocument(array &$state, string $message, string $lower, ChatConversation $conv): array
    {
        // 1) Saludos casuales: responder con calidez y volver a pedir documento de forma suave.
        if (preg_match('/^(hola|holi|holaa+|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|qu[eé] tal|qu[eé] m[áa]s|saludos)[\s!.,]*$/iu', trim($message))) {
            return [
                'reply' => $this->pick([
                    '¡Hola! 👋 ¿Cómo estás? Para atenderte mejor, ¿me compartes tu **NIT** o **cédula**? O si prefieres, escribe *"soy nuevo"* y te registro.',
                    '¡Hola, qué gusto saludarte! 😊 Para conectarte con tu asesor necesito tu **NIT** o **cédula**. ¿Me los compartes?',
                    '¡Hey, hola! ¿Tienes a la mano tu **NIT** o **cédula**? Con eso te ubico en el sistema en un segundo.',
                ]),
                'suggestions' => ['Soy cliente nuevo'],
            ];
        }

        // 2) Cliente declara explícitamente que es nuevo.
        if (preg_match('/\b(soy nuevo|nuevo|no soy|no tengo|primera vez|no estoy registrado|no estoy)\b/u', $lower)) {
            $state['step'] = 'collecting_person_type';
            $conv->update(['client_in_erp' => false]);
            return [
                'reply' => $this->pick([
                    '¡Bienvenido a Santacruz! 🌱 Te creo el perfil rapidito. Para empezar: ¿eres **persona natural** (con cédula) o representas una **empresa** (con NIT)?',
                    '¡Genial que nos contactes! 😊 Para registrarte: cuéntame, ¿es a tu nombre como **persona natural** (cédula) o vamos a registrar una **empresa** (NIT)?',
                ]),
                'suggestions' => ['Persona natural', 'Empresa (NIT)'],
            ];
        }

        $normalized = Client::normalizeDocument($message);
        if (mb_strlen($normalized) < 5) {
            return [
                'reply' => $this->pick([
                    'Mmm, ese número me parece un poquito corto 🤔 ¿Me lo escribes completo? Si no recuerdas o eres nuevo, dime *"soy nuevo"* y seguimos.',
                    'Creo que me faltaron números 😅 ¿Me regalas tu NIT o cédula completo? Si nunca nos has comprado, escribe *"soy nuevo"*.',
                ]),
                'suggestions' => ['Soy cliente nuevo'],
            ];
        }

        $state['document_number'] = $normalized;
        $state['document_type'] = preg_match('/^\d+$/', $normalized) && mb_strlen($normalized) >= 9 ? 'NIT' : 'CC';

        $client = Client::where('document_number', $normalized)->first();

        if ($client) {
            $state['client_id'] = $client->id;
            $state['client_in_erp'] = true;
            $state['lead']['name'] = $client->name;
            $state['lead']['phone'] = $client->phone;
            $state['lead']['email'] = $client->email;
            $state['lead']['city'] = $client->city;

            $seller = $client->seller ?: $this->assignRandomSeller();
            if ($seller && ! $client->seller_id) {
                $client->update(['seller_id' => $seller->id]);
            }

            $conv->update([
                'client_id' => $client->id,
                'seller_id' => $seller?->id,
                'client_in_erp' => true,
            ]);

            $this->mergeIfDuplicateClientConversation($conv, $client->id);

            $state['step'] = 'ready_to_chat';

            $sellerLine = $seller
                ? "Tu asesor es **{$seller->name}**".($seller->phone ? " (📱 {$seller->phone})" : '').'.'
                : 'En un momento te asignamos un asesor.';

            return [
                'reply' => $this->pick([
                    "¡Hola, **{$client->name}**! 👋 Qué gusto tenerte de nuevo por acá.\n\n$sellerLine\n\nCuéntame, ¿en qué te ayudo hoy?",
                    "¡{$client->name}, bienvenido de vuelta! 😊\n\n$sellerLine\n\n¿En qué te puedo ayudar?",
                ]),
                'suggestions' => ['Cotizar productos', 'Ver catálogo', 'Ver promociones', 'Hablar con mi asesor'],
            ];
        }

        $state['client_in_erp'] = false;
        // Ya tenemos el documento; inferimos tipo de persona y arrancamos el alta sin volver a preguntar el número.
        $state['person_type'] = $state['document_type'] === 'NIT' ? 'juridica' : 'natural';
        $state['step'] = 'collecting_new_name';
        $conv->update(['client_in_erp' => false]);
        $tipoTxt = $state['person_type'] === 'juridica' ? 'empresa' : 'persona natural';
        $askName = $state['person_type'] === 'juridica'
            ? '¿Cuál es la **razón social** completa de la empresa?'
            : '¿Cuál es tu **nombre completo**?';
        return [
            'reply' => $this->pick([
                "Al parecer todavía no estás creado como cliente nuestro 🙌 hagamos el alta rápido para que tu asesor lo confirme con cartera. Tomé tu documento como **{$tipoTxt}**.\n\n{$askName}",
                "Ese documento no me figura todavía en el sistema. 😊 Hagamos el registro paso a paso para pasárselo a cartera — lo tomé como **{$tipoTxt}**.\n\n{$askName}",
            ]),
        ];
    }

    private function handleDiscovery(array &$state, string $message, string $lower, ChatConversation $conv): array
    {
        if (preg_match('/\b(asesor|vendedor|humano|persona|llamame|llámame|contactar|llamada|mi vendedor)\b/u', $lower)) {
            return $this->routeToSeller($state, $conv);
        }

        if (preg_match('/\b(promo|promocion|promoción|descuento|oferta)\b/u', $lower)) {
            return [
                'reply' => 'Puedes ver todas nuestras promociones activas aquí 👉 /promociones. ¿Quieres que tu vendedor te arme una cotización?',
                'suggestions' => ['Sí, cotizar', 'Ver catálogo', 'No, gracias'],
            ];
        }

        if (preg_match('/\b(no gracias|nada mas|nada más|adios|adiós|chao|bye)\b/u', $lower)) {
            return ['reply' => '¡Perfecto! Cualquier cosa estoy por aquí. Que tengas un excelente día 🌱'];
        }

        if (preg_match('/\b(catalogo|catálogo|productos|ver todo)\b/u', $lower)) {
            return [
                'reply' => 'Tenemos todo nuestro catálogo aquí 👉 /catalogo. ¿Buscas alguna categoría o producto específico?',
                'suggestions' => ['Cotizar', 'Hablar con mi vendedor'],
            ];
        }

        if ($this->ai->isEnabled() && $message !== '') {
            $aiResult = $this->ai->reply($state['history'], $message);
            if (! empty($aiResult['reply'])) {
                if (preg_match('/voy a tomar tus datos|conectarte con un asesor|toma tus datos/iu', $aiResult['reply'])) {
                    return $this->routeToSeller($state, $conv, $aiResult['reply']);
                }
                return [
                    'reply' => $aiResult['reply'],
                    'products' => $aiResult['products'] ?: null,
                    'suggestions' => ['Cotizar', 'Hablar con mi vendedor', 'Ver catálogo'],
                ];
            }
        }

        return [
            'reply' => 'No estoy seguro de haber entendido. ¿Puedes contarme con qué tipo de producto te puedo ayudar?',
            'suggestions' => ['Ver catálogo', 'Hablar con mi vendedor', 'Ver promociones'],
        ];
    }

    private function routeToSeller(array &$state, ChatConversation $conv, ?string $prefaceReply = null): array
    {
        $conv->refresh();
        $seller = $conv->seller;
        if (! $seller) {
            $seller = $this->assignRandomSeller();
            $conv->update(['seller_id' => $seller?->id]);
        }

        if ($state['client_id'] && $seller) {
            $state['step'] = 'collecting_message';
            $clientLabel = $state['lead']['name'] ?? '';
            $preface = $prefaceReply ? trim($prefaceReply)."\n\n" : '';
            $notInErp = $conv->client_in_erp ? '' : "\n\n_Nota: tu cuenta aún no está formalmente registrada en nuestro ERP — el vendedor te ayudará con el alta._";

            return [
                'reply' => "{$preface}Perfecto{$this->commaName($clientLabel)}. Voy a notificar a **{$seller->name}** ({$seller->phone}) que te contacte.{$notInErp}\n\n¿Quieres dejarle algún detalle adicional sobre lo que necesitas? (escribe \"listo\" si no)",
            ];
        }

        $state['step'] = 'collecting_new_name';
        $conv->update(['client_in_erp' => false]);
        return [
            'reply' => 'Para conectarte con un vendedor necesito unos datos rápido. ¿Cuál es tu nombre o razón social?',
        ];
    }

    private function assignRandomSeller(): ?Seller
    {
        return Seller::where('active', true)->inRandomOrder()->first();
    }

    private function createClientForState(array &$state, ChatConversation $conv): void
    {
        $seller = $this->assignRandomSeller();
        $client = Client::create([
            'document_type' => $state['document_type'] ?? ($state['person_type'] === 'juridica' ? 'NIT' : 'CC'),
            'document_number' => $state['document_number'] ?: ('CHAT-'.Str::upper(Str::random(10))),
            'name' => $state['lead']['name'],
            'phone' => $state['lead']['phone'],
            'email' => $state['lead']['email'],
            'address' => $state['lead']['address'] ?? null,
            'city' => $state['lead']['city'],
            'seller_id' => $seller?->id,
            'source' => 'chat',
            'synced_with_erp' => false,
            'notes' => 'Cliente creado desde el chatbot ('.($state['person_type'] === 'juridica' ? 'jurídica' : 'natural').'). Requiere alta formal en ERP por cartera.',
            'active' => true,
        ]);

        $state['client_id'] = $client->id;
        $conv->update([
            'client_id' => $client->id,
            'seller_id' => $seller?->id,
            'client_in_erp' => false,
        ]);

        $this->mergeIfDuplicateClientConversation($conv, $client->id);
    }

    private function finalizeLead(string $sessionId, array $state, ChatConversation $conv): void
    {
        $lead = $state['lead'];
        if (empty($lead['name'])) {
            return;
        }

        Lead::updateOrCreate(
            ['session_id' => $sessionId],
            [
                'name' => $lead['name'],
                'phone' => $lead['phone'],
                'email' => $lead['email'],
                'interest' => $lead['interest'],
                'message' => $lead['message'],
                'source' => 'chat',
                'status' => 'new',
                'chat_transcript' => $state['history'],
            ],
        );

        $conv->update(['status' => 'waiting_human']);
    }

    /**
     * GET /api/public/chat/{sessionId}/messages?after=ID
     * Devuelve mensajes recientes del vendedor/system para polling del cliente.
     */
    public function messages(string $sessionId, Request $request)
    {
        $conv = ChatConversation::where('session_id', $sessionId)->first();
        if (! $conv) {
            return response()->json(['messages' => [], 'status' => 'unknown']);
        }

        $after = (int) $request->query('after', 0);

        $messages = ChatMessage::where('conversation_id', $conv->id)
            ->whereIn('sender', ['seller', 'system'])
            ->when($after > 0, fn ($q) => $q->where('id', '>', $after))
            ->orderBy('id')
            ->limit(50)
            ->get(['id', 'sender', 'sender_id', 'type', 'body', 'attachment_path', 'attachment_name', 'attachment_mime', 'attachment_size', 'metadata', 'created_at']);

        $sellerTyping = (bool) Cache::get("chat:typing:seller:{$conv->id}", false);

        return response()->json([
            'status' => $conv->status,
            'seller' => $conv->seller ? [
                'id' => $conv->seller->id,
                'name' => $conv->seller->name,
                'phone' => $conv->seller->phone,
                'photo_url' => $conv->seller->photo_url ?? null,
            ] : null,
            'seller_typing' => $sellerTyping,
            'messages' => $messages,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/public/chat/{sessionId}/upload
     * El cliente sube un archivo/imagen/audio a la conversación.
     */
    public function upload(string $sessionId, Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
            'caption' => ['nullable', 'string', 'max:500'],
        ]);

        $conv = $this->ensureConversation($sessionId);
        if ($conv->status === 'closed') {
            return response()->json(['error' => 'closed'], 409);
        }

        $file = $request->file('file');
        [$type, $path, $name, $mime, $size] = \App\Http\Controllers\Api\Admin\ChatController::storeAttachment($file, $conv->id);

        $msg = ChatMessage::create([
            'conversation_id' => $conv->id,
            'sender' => 'client',
            'type' => $type,
            'body' => (string) $request->input('caption', ''),
            'attachment_path' => $path,
            'attachment_name' => $name,
            'attachment_mime' => $mime,
            'attachment_size' => $size,
            'created_at' => now(),
        ]);
        $conv->update(['last_message_at' => now()]);
        NewChatMessage::dispatchSafe($msg, $conv->session_id);

        return response()->json([
            'session_id' => $sessionId,
            'message' => $msg,
            'silent' => true,
        ]);
    }
}

