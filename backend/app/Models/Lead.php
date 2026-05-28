<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'name',
        'company',
        'phone',
        'email',
        'interest',
        'message',
        'status',
        'source',
        'session_id',
        'chat_transcript',
    ];

    protected $casts = [
        'chat_transcript' => 'array',
    ];
}
