<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->get();
    }
}
