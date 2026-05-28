<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_number',
        'name',
        'phone',
        'email',
        'address',
        'city',
        'seller_id',
        'source',
        'synced_with_erp',
        'notes',
        'active',
    ];

    protected $casts = [
        'synced_with_erp' => 'boolean',
        'active' => 'boolean',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(ChatConversation::class);
    }

    /**
     * Normaliza un documento: deja solo dígitos y letras alfanuméricas.
     */
    public static function normalizeDocument(string $value): string
    {
        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value));
    }
}
