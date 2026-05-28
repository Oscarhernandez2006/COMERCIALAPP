<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        return Product::with('category:id,name,slug')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();
    }

    public function show(Product $product)
    {
        return $product->load('category:id,name,slug');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('uploads/products', 'public');
        }

        return Product::create($data)->load('category:id,name,slug');
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validateData($request);
        if (! empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('uploads/products', 'public');
        }

        $product->update($data);
        return $product->refresh()->load('category:id,name,slug');
    }

    public function destroy(Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
        $product->delete();
        return response()->noContent();
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:200'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'compare_price' => ['nullable', 'integer', 'min:0'],
            'badge' => ['nullable', 'string', 'max:20'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'featured' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);
    }
}
