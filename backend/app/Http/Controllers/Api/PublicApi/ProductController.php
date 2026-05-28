<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $q = Product::query()
            ->with('category:id,name,slug')
            ->where('active', true)
            ->orderBy('sort_order');

        if ($request->boolean('featured')) {
            $q->where('featured', true);
        }
        if ($cat = $request->query('category')) {
            $q->whereHas('category', fn ($qq) => $qq->where('slug', $cat));
        }
        if ($search = $request->query('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        return $q->get();
    }

    public function show(string $slug)
    {
        return Product::with('category:id,name,slug')
            ->where('slug', $slug)
            ->where('active', true)
            ->firstOrFail();
    }
}
