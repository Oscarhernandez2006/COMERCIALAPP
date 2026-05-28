<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Seller extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'phone',
        'whatsapp',
        'email',
        'photo_path',
        'zone',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected $appends = ['photo_url'];

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(ChatConversation::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? Storage::url($this->photo_path) : null;
    }
}
