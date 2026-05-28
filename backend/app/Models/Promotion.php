<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'subtitle',
        'description',
        'image_path',
        'badge',
        'discount',
        'starts_at',
        'ends_at',
        'highlight',
        'active',
        'sort_order',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'highlight' => 'boolean',
        'active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::url($this->image_path) : null;
    }
}
