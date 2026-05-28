<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::orderBy('sort_order')->get();
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('uploads/categories', 'public');
        }

        return Category::create($data);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request, $category->id);
        if (! empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->hasFile('image')) {
            if ($category->image_path) {
                Storage::disk('public')->delete($category->image_path);
            }
            $data['image_path'] = $request->file('image')->store('uploads/categories', 'public');
        }

        $category->update($data);
        return $category->refresh();
    }

    public function destroy(Category $category)
    {
        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }
        $category->delete();
        return response()->noContent();
    }

    private function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer'],
            'active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);
    }
}
