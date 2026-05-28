<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;

class GalleryController extends Controller
{
    public function index()
    {
        return MediaItem::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();
    }
}
