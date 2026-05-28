<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    protected $casts = [
        'value' => 'array',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::where('key', $key)->first();
        return $row?->value ?? $default;
    }

    public static function set(string $key, mixed $value, string $group = 'general'): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group],
        );
    }

    public static function allGrouped(): array
    {
        $out = [];
        foreach (static::all() as $row) {
            $out[$row->key] = $row->value;
        }
        return $out;
    }
}
