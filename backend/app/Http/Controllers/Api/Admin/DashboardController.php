<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Lead;
use App\Models\MediaItem;
use App\Models\Product;
use App\Models\Promotion;

class DashboardController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'counts' => [
                'products' => Product::count(),
                'promotions_active' => Promotion::where('active', true)->count(),
                'categories' => Category::count(),
                'media' => MediaItem::count(),
                'leads' => Lead::count(),
                'leads_new' => Lead::where('status', 'new')->count(),
            ],
            'recent_leads' => Lead::latest()->take(5)->get(),
            'recent_products' => Product::latest()->take(5)->get(['id', 'name', 'price', 'image_path', 'created_at']),
        ]);
    }
}
