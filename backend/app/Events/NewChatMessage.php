<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NewChatMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $conversationId;
    public string $sessionId;
    public array $payload;

    public function __construct(ChatMessage $message, string $sessionId)
    {
        $this->conversationId = (int) $message->conversation_id;
        $this->sessionId = $sessionId;
        $this->payload = [
            'id' => $message->id,
            'sender' => $message->sender,
            'sender_id' => $message->sender_id,
            'type' => $message->type ?? 'text',
            'body' => $message->body,
            'attachment_url' => $message->attachment_url,
            'attachment_name' => $message->attachment_name,
            'attachment_mime' => $message->attachment_mime,
            'attachment_size' => $message->attachment_size,
            'metadata' => $message->metadata,
            'created_at' => optional($message->created_at)->toIso8601String(),
        ];
    }

    /**
     * Canales públicos (sin auth) — el sessionId y conversationId son los identificadores.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("chat.session.{$this->sessionId}"),
            new Channel("chat.conversation.{$this->conversationId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'session_id' => $this->sessionId,
            'message' => $this->payload,
        ];
    }

    /**
     * Dispatch resiliente: si el servidor de broadcast (Reverb) no está disponible,
     * solo registramos el warning y seguimos. El cliente recibirá el mensaje vía
     * el polling de fallback igualmente.
     */
    public static function dispatchSafe(ChatMessage $message, string $sessionId): void
    {
        try {
            self::dispatch($message, $sessionId);
        } catch (\Throwable $e) {
            Log::warning('[broadcast] No se pudo emitir NewChatMessage: '.$e->getMessage(), [
                'conversation_id' => $message->conversation_id,
                'message_id' => $message->id,
            ]);
        }
    }
}
