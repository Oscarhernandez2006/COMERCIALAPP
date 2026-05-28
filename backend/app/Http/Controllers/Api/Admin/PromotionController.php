<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    public function index()
    {
        return Promotion::orderByDesc('highlight')->orderBy('sort_order')->get();
    }

    public function show(Promotion $promotion)
    {
        return $promotion;
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('uploads/promotions', 'public');
        }

        return Promotion::create($data);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $data = $this->validateData($request);
        if (! empty($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        if ($request->hasFile('image')) {
            if ($promotion->image_path) {
                Storage::disk('public')->delete($promotion->image_path);
            }
            $data['image_path'] = $request->file('image')->store('uploads/promotions', 'public');
        }

        $promotion->update($data);
        return $promotion->refresh();
    }

    public function destroy(Promotion $promotion)
    {
        if ($promotion->image_path) {
            Storage::disk('public')->delete($promotion->image_path);
        }
        $promotion->delete();
        return response()->noContent();
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:200'],
            'subtitle' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'badge' => ['nullable', 'string', 'max:30'],
            'discount' => ['nullable', 'string', 'max:30'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'highlight' => ['nullable', 'boolean'],
            'active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);
    }
}
