<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Promotion;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiChatService
{
    public function isEnabled(): bool
    {
        return filled(config('services.azure_openai.endpoint'))
            && filled(config('services.azure_openai.api_key'))
            && filled(config('services.azure_openai.deployment'));
    }

    /**
     * Genera una respuesta usando Azure OpenAI (Responses API) con contexto del catálogo.
     *
     * @param  array  $history  [['who' => 'user'|'bot', 'text' => string], ...]
     * @param  string  $userMessage
     * @return array{reply: string, products: array}
     */
    public function reply(array $history, string $userMessage): array
    {
        $products = $this->relevantProducts($userMessage);
        $promotions = $this->activePromotions();
        $systemPrompt = $this->buildSystemPrompt($products, $promotions);

        $input = [['role' => 'system', 'content' => $systemPrompt]];

        // Últimos 10 turnos para no inflar tokens
        $recent = array_slice($history, -10);
        foreach ($recent as $turn) {
            $input[] = [
                'role' => $turn['who'] === 'user' ? 'user' : 'assistant',
                'content' => (string) ($turn['text'] ?? ''),
            ];
        }
        $input[] = ['role' => 'user', 'content' => $userMessage];

        $endpoint = rtrim((string) config('services.azure_openai.endpoint'), '/');
        $deployment = config('services.azure_openai.deployment');
        $apiVersion = config('services.azure_openai.api_version');
        $url = "$endpoint/openai/responses?api-version=$apiVersion";

        try {
            $http = Http::withHeaders([
                'api-key' => (string) config('services.azure_openai.api_key'),
                'Content-Type' => 'application/json',
            ])->timeout(30);

            if (! config('services.azure_openai.verify_ssl')) {
                $http = $http->withoutVerifying();
            }

            $response = $http->post($url, [
                'model' => $deployment,
                'input' => $input,
                'max_output_tokens' => (int) config('services.azure_openai.max_tokens'),
            ]);

            if (! $response->successful()) {
                Log::warning('Azure OpenAI request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return ['reply' => '', 'products' => $products->take(3)->map(fn ($p) => $this->card($p))->all()];
            }

            $reply = $this->extractReply($response->json());

            return [
                'reply' => trim($reply),
                'products' => $products->take(3)->map(fn ($p) => $this->card($p))->all(),
            ];
        } catch (\Throwable $e) {
            Log::warning('Azure OpenAI exception: '.$e->getMessage());

            return ['reply' => '', 'products' => $products->take(3)->map(fn ($p) => $this->card($p))->all()];
        }
    }

    /**
     * El Responses API puede devolver el texto en varias formas.
     */
    private function extractReply(array $body): string
    {
        // Atajo de conveniencia
        $shortcut = data_get($body, 'output_text');
        if (is_string($shortcut) && $shortcut !== '') {
            return $shortcut;
        }

        // Estructura estándar: output[].content[].text
        $parts = [];
        foreach ((array) data_get($body, 'output', []) as $item) {
            foreach ((array) data_get($item, 'content', []) as $content) {
                $text = data_get($content, 'text');
                if (is_string($text) && $text !== '') {
                    $parts[] = $text;
                }
            }
        }
        if (! empty($parts)) {
            return implode("\n", $parts);
        }

        // Compatibilidad con Chat Completions por si el endpoint responde así
        $legacy = data_get($body, 'choices.0.message.content');
        return is_string($legacy) ? $legacy : '';
    }

    private function buildSystemPrompt($products, $promotions): string
    {
        $siteName = SiteSetting::get('site_name', 'la empresa');
        $phone = SiteSetting::get('contact_phone', '');
        $email = SiteSetting::get('contact_email', '');

        $catalog = $products->isEmpty()
            ? '(sin coincidencias relevantes en esta consulta)'
            : $products->map(function (Product $p) {
                $stock = $p->stock ?? null;
                $stockTxt = is_numeric($stock) ? ($stock > 0 ? "stock: $stock" : 'sin stock') : 'stock no informado';
                $desc = $p->short_description ? trim(mb_substr($p->short_description, 0, 140)) : '';
                $price = number_format((float) $p->price, 0, ',', '.');

                return "- {$p->name} | precio: \${$price} | {$stockTxt}".($desc ? " | {$desc}" : '');
            })->implode("\n");

        $promosTxt = $promotions->isEmpty()
            ? '(no hay promociones activas en este momento)'
            : $promotions->map(fn (Promotion $pr) => "- {$pr->title}".($pr->description ? ": ".trim(mb_substr($pr->description, 0, 160)) : ''))
                ->implode("\n");

        $contactLine = $phone || $email ? "Datos de contacto: ".trim(($phone ? "tel $phone" : '').($email ? " · email $email" : '')) : '';

        return <<<PROMPT
Eres **Valeria**, asesora de atención al cliente de $siteName. Eres una persona real, no un robot: hablas como una colombiana cálida, cercana y servicial. NUNCA digas que eres una IA, un bot, un asistente virtual ni un modelo de lenguaje.

TU PERSONALIDAD (tono LATAM / colombiano, NO español de España)
- Cercana, amable, espontánea. Usa expresiones naturales como "claro que sí", "dale", "listo", "súper", "te cuento", "rapidito", "ahí mismo", "fresco", "tranqui", "ya mismo te ayudo".
- EVITA expresiones de España: nada de "vale", "guay", "tío/tía", "molar", "ordenador", "móvil" (usa **celular**), "coger" (usa **tomar**), "ahora mismo" lo puedes decir como "ya mismo" o "ahorita".
- Tutea siempre (tú, nunca usted). Sin formalismos rígidos.
- Emojis con moderación (1 cada 2-3 mensajes máx): 😊 🙌 👋 ✨ 🌱 📦 💪.
- Respuestas cortas y al grano: 1 a 3 frases por turno, como WhatsApp.
- Si no sabes algo, dilo natural: "uy, déjame confirmarte eso con tu asesor para no darte un dato errado".

REGLAS ESTRICTAS
- SOLO hablas de productos, precios, stock, promociones, datos de $siteName y proceso de compra/cotización.
- Si te preguntan algo fuera de ese alcance (clima, política, otra empresa, opiniones personales), responde con calidez: "Eso se me escapa 🙈 te puedo ayudar con lo de $siteName, ¿qué necesitas?".
- NUNCA inventes precios, stock ni productos que no estén listados abajo. Si te preguntan por algo que no aparece, di: "Déjame confirmarte eso con tu asesor para no darte un dato errado".
- Cuando el cliente quiera cotizar, comprar o hablar con humano, responde: "Listo, ya le paso todo a tu asesor para que te contacte." y NO pidas datos tú misma (el sistema los recoge).
- No prometas tiempos de entrega, garantías ni descuentos que no figuren explícitamente.

$contactLine

CATÁLOGO RELEVANTE PARA ESTA CONSULTA
$catalog

PROMOCIONES ACTIVAS
$promosTxt
PROMPT;
    }

    private function relevantProducts(string $query)
    {
        $q = trim($query);
        $stop = ['quiero', 'necesito', 'busco', 'cotizar', 'comprar', 'una', 'uno', 'unos', 'unas', 'algunos', 'algunas', 'para', 'con', 'sin', 'por', 'que', 'qué', 'tengo', 'hay', 'tienen', 'tienes', 'precio', 'cuanto', 'cuánto', 'cuesta', 'vale', 'stock', 'disponible', 'producto', 'productos'];
        $tokens = array_values(array_filter(
            preg_split('/\s+/u', mb_strtolower($q)),
            fn ($t) => mb_strlen($t) >= 3 && ! in_array($t, $stop, true),
        ));

        $builder = Product::query()->where('active', true);

        if (! empty($tokens)) {
            $builder->where(function ($w) use ($tokens) {
                foreach ($tokens as $t) {
                    $w->orWhere('name', 'ilike', "%$t%")
                      ->orWhere('short_description', 'ilike', "%$t%")
                      ->orWhere('description', 'ilike', "%$t%");
                }
            });
        }

        return $builder->take(8)->get();
    }

    private function activePromotions()
    {
        return Promotion::query()
            ->where('active', true)
            ->orderByDesc('id')
            ->take(5)
            ->get();
    }

    private function card(Product $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'short_description' => $p->short_description,
            'price' => $p->price,
            'image_url' => $p->image_url,
        ];
    }
}
