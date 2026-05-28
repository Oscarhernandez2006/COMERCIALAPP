<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ChatMessage extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'sender',
        'sender_id',
        'type',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
        'metadata',
        'created_at',
        'read_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'attachment_size' => 'integer',
        'created_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    protected $appends = ['attachment_url'];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    protected function attachmentUrl(): Attribute
    {
        return Attribute::get(function () {
            if (! $this->attachment_path) {
                return null;
            }
            return Storage::disk('public')->url($this->attachment_path);
        });
    }
}
