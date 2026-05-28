<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MediaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'album',
        'src_path',
        'thumb_path',
        'sort_order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['src_url', 'thumb_url'];

    public function getSrcUrlAttribute(): ?string
    {
        return $this->src_path ? Storage::url($this->src_path) : null;
    }

    public function getThumbUrlAttribute(): ?string
    {
        return $this->thumb_path
            ? Storage::url($this->thumb_path)
            : ($this->type === 'image' ? $this->getSrcUrlAttribute() : null);
    }
}
