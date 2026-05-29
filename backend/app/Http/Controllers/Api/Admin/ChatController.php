<?php

namespace App\Http\Controllers\Api\Admin;

use App\Events\NewChatMessage;
use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * GET /api/admin/chats
     * Lista conversaciones con último mensaje, paginadas.
     */
    public function index(Request $request)
    {
        $status = $request->query('status'); // bot|waiting_human|human|closed
        $sellerId = $request->query('seller_id');
        $q = $request->query('q');

        $query = ChatConversation::with(['client:id,document_number,name,phone,email,city', 'seller:id,name,phone,photo_path'])
            ->withCount('messages')
            ->where(function ($q2) {
                // Ocultar sesiones huérfanas: solo conversaciones con cliente identificado
                // o con al menos un mensaje real del cliente.
                $q2->whereNotNull('client_id')
                    ->orWhereExists(function ($sub) {
                        $sub->select(\DB::raw(1))
                            ->from('chat_messages')
                            ->whereColumn('chat_messages.conversation_id', 'chat_conversations.id')
                            ->where('chat_messages.sender', 'client');
                    });
            })
            ->orderByDesc('last_message_at');

        // Por defecto (o status=priority) la bandeja muestra solo lo que requiere atención:
        // conversaciones en espera (waiting_human) y activas con un asesor (human).
        // status=all muestra todas; cualquier otro valor filtra por ese estado puntual.
        if ($status === null || $status === '' || $status === 'priority') {
            $query->whereIn('status', ['waiting_human', 'human']);
        } elseif ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($sellerId) {
            $query->where('seller_id', $sellerId);
        }
        if ($q) {
            $query->where(function ($w) use ($q) {
                $w->where('session_id', 'like', "%$q%")
                  ->orWhereHas('client', fn ($c) => $c->where('name', 'ilike', "%$q%")
                      ->orWhere('document_number', 'like', "%$q%"));
            });
        }

        $items = $query->paginate(20);

        // Agregar último mensaje + unread_count (mensajes del cliente sin leer)
        $items->getCollection()->transform(function (ChatConversation $c) {
            $last = ChatMessage::where('conversation_id', $c->id)->latest('id')->first(['sender', 'body', 'created_at']);
            $c->last_message = $last ? [
                'sender' => $last->sender,
                'body' => mb_substr($last->body, 0, 120),
                'created_at' => $last->created_at,
            ] : null;
            $c->unread_count = ChatMessage::where('conversation_id', $c->id)
                ->where('sender', 'client')
                ->whereNull('read_at')
                ->count();
            return $c;
        });

        return response()->json($items);
    }

    /**
     * GET /api/admin/chats/{conversation}
     */
    public function show(ChatConversation $chat)
    {
        $chat->load(['client', 'seller']);
        $messages = ChatMessage::where('conversation_id', $chat->id)
            ->orderBy('id')
            ->get(['id', 'sender', 'sender_id', 'type', 'body', 'attachment_path', 'attachment_name', 'attachment_mime', 'attachment_size', 'metadata', 'created_at', 'read_at']);

        // Marcar automáticamente como leídos los mensajes del cliente al abrir
        ChatMessage::where('conversation_id', $chat->id)
            ->where('sender', 'client')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'conversation' => $chat,
            'messages' => $messages,
        ]);
    }

    /**
     * POST /api/admin/chats/{conversation}/reply
     */
    public function reply(Request $request, ChatConversation $chat)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();

        $msg = ChatMessage::create([
            'conversation_id' => $chat->id,
            'sender' => 'seller',
            'sender_id' => $user?->id,
            'body' => $data['body'],
            'metadata' => ['user_name' => $user?->name],
            'created_at' => now(),
        ]);

        // Estado resultante (sin tocar la BD todavía).
        $newStatus = in_array($chat->status, ['bot', 'waiting_human'], true) ? 'human' : $chat->status;
        $chat->status = $newStatus;

        // Mantener coherente el caché de conversación que usa el endpoint público:
        // así el bot deja de responder al instante, aunque el UPDATE a la BD se difiera.
        Cache::put("chat:conv:{$chat->session_id}", $chat, now()->addHours(2));

        // Broadcast inmediato: entrega el mensaje al cliente en ~80ms.
        NewChatMessage::dispatchSafe($msg, $chat->session_id, $newStatus);

        // Persistencia diferida (no retrasa la entrega ni la respuesta percibida).
        $chatId = $chat->id;
        app()->terminating(function () use ($chatId, $newStatus) {
            try {
                ChatConversation::whereKey($chatId)->update([
                    'status' => $newStatus,
                    'last_message_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // best-effort
            }
        });

        return response()->json(['message' => $msg, 'conversation' => $chat]);
    }

    /**
     * POST /api/admin/chats/{conversation}/take
     */
    public function take(Request $request, ChatConversation $chat)
    {
        $chat->update(['status' => 'human']);
        Cache::forget("chat:conv:{$chat->session_id}");

        $msg = ChatMessage::create([
            'conversation_id' => $chat->id,
            'sender' => 'system',
            'body' => 'Un asesor se incorporó al chat.',
            'created_at' => now(),
        ]);

        NewChatMessage::dispatchSafe($msg, $chat->session_id, 'human');

        return response()->json(['conversation' => $chat->fresh()]);
    }

    /**
     * POST /api/admin/chats/{conversation}/close
     */
    public function close(ChatConversation $chat)
    {
        $chat->update(['status' => 'closed', 'closed_at' => now()]);
        Cache::forget("chat:conv:{$chat->session_id}");

        $msg = ChatMessage::create([
            'conversation_id' => $chat->id,
            'sender' => 'system',
            'body' => 'Conversación cerrada por el asesor.',
            'created_at' => now(),
        ]);

        NewChatMessage::dispatchSafe($msg, $chat->session_id, 'closed');

        return response()->json(['conversation' => $chat->fresh()]);
    }

    /**
     * POST /api/admin/chats/{conversation}/typing
     * Marca que el vendedor está escribiendo (TTL 4s).
     */
    public function typing(ChatConversation $chat)
    {
        Cache::put("chat:typing:seller:{$chat->id}", true, now()->addSeconds(4));
        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/admin/chats/{conversation}/read
     * Marca como leídos todos los mensajes del cliente.
     */
    public function read(ChatConversation $chat)
    {
        $updated = ChatMessage::where('conversation_id', $chat->id)
            ->where('sender', 'client')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true, 'updated' => $updated]);
    }

    /**
     * POST /api/admin/chats/{conversation}/upload
     * Sube un adjunto (imagen, archivo o audio) como mensaje del vendedor.
     */
    public function upload(Request $request, ChatConversation $chat)
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:20480'], // 20 MB
            'caption' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $file = $request->file('file');

        [$type, $path, $name, $mime, $size] = $this->storeAttachment($file, $chat->id);

        $msg = ChatMessage::create([
            'conversation_id' => $chat->id,
            'sender' => 'seller',
            'sender_id' => $user?->id,
            'type' => $type,
            'body' => $data['caption'] ?? '',
            'attachment_path' => $path,
            'attachment_name' => $name,
            'attachment_mime' => $mime,
            'attachment_size' => $size,
            'metadata' => ['user_name' => $user?->name],
            'created_at' => now(),
        ]);

        $newStatus = in_array($chat->status, ['bot', 'waiting_human'], true) ? 'human' : $chat->status;
        $chat->status = $newStatus;

        // Mantener coherente el caché de conversación del endpoint público.
        Cache::put("chat:conv:{$chat->session_id}", $chat, now()->addHours(2));

        // Broadcast inmediato; persistencia del estado diferida.
        NewChatMessage::dispatchSafe($msg, $chat->session_id, $newStatus);

        $chatId = $chat->id;
        app()->terminating(function () use ($chatId, $newStatus) {
            try {
                ChatConversation::whereKey($chatId)->update([
                    'status' => $newStatus,
                    'last_message_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // best-effort
            }
        });

        return response()->json(['message' => $msg, 'conversation' => $chat]);
    }

    /**
     * @return array{0:string,1:string,2:string,3:string,4:int}  [type, path, originalName, mime, size]
     */
    public static function storeAttachment($file, int $conversationId): array
    {
        $detectedMime = $file->getMimeType() ?? 'application/octet-stream';
        $clientMime = $file->getClientMimeType() ?: '';
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');

        // Extensiones de audio comunes (las notas de voz webm/ogg suelen detectarse
        // como video/webm por el contenedor, así que clasificamos también por extensión
        // y por el mime que reporta el navegador).
        $audioExts = ['webm', 'ogg', 'oga', 'mp3', 'm4a', 'aac', 'wav', 'weba', 'opus'];
        $imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];

        $type = match (true) {
            str_starts_with($detectedMime, 'image/') => 'image',
            str_starts_with($detectedMime, 'audio/') => 'audio',
            str_starts_with($clientMime, 'audio/') => 'audio',
            in_array($ext, $audioExts, true) => 'audio',
            in_array($ext, $imageExts, true) => 'image',
            default => 'file',
        };

        // Para audios guardamos un mime reproducible por el navegador.
        $mime = $detectedMime;
        if ($type === 'audio' && ! str_starts_with($mime, 'audio/')) {
            $mime = str_starts_with($clientMime, 'audio/') ? $clientMime : 'audio/webm';
        }

        $filename = Str::random(24).($ext ? '.'.$ext : '');
        $dir = "chat/{$conversationId}";
        $path = $file->storeAs($dir, $filename, 'public');

        return [
            $type,
            $path,
            $file->getClientOriginalName(),
            $mime,
            (int) $file->getSize(),
        ];
    }
}

