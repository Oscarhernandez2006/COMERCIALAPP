<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'client_id',
        'seller_id',
        'status',
        'client_in_erp',
        'started_at',
        'last_message_at',
        'closed_at',
    ];

    protected $casts = [
        'client_in_erp' => 'boolean',
        'started_at' => 'datetime',
        'last_message_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->orderBy('created_at');
    }
}
