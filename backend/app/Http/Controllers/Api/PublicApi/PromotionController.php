<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\Promotion;

class PromotionController extends Controller
{
    public function index()
    {
        return Promotion::query()
            ->where('active', true)
            ->orderByDesc('highlight')
            ->orderBy('sort_order')
            ->get();
    }
}
