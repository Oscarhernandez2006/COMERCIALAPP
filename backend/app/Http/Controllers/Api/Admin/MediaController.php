<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index()
    {
        return MediaItem::orderBy('sort_order')->orderByDesc('id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'in:image,video'],
            'title' => ['nullable', 'string', 'max:160'],
            'album' => ['required', 'string', 'max:80'],
            'sort_order' => ['nullable', 'integer'],
            'active' => ['nullable', 'boolean'],
            'file' => ['required', 'file', 'max:51200'], // 50 MB
            'thumb' => ['nullable', 'image', 'max:5120'],
        ]);

        $data['src_path'] = $request->file('file')->store(
            'uploads/gallery/' . ($data['type'] === 'video' ? 'videos' : 'images'),
            'public',
        );

        if ($request->hasFile('thumb')) {
            $data['thumb_path'] = $request->file('thumb')->store('uploads/gallery/thumbs', 'public');
        }

        unset($data['file']);
        return MediaItem::create($data);
    }

    public function update(Request $request, MediaItem $media)
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:160'],
            'album' => ['nullable', 'string', 'max:80'],
            'sort_order' => ['nullable', 'integer'],
            'active' => ['nullable', 'boolean'],
            'thumb' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('thumb')) {
            if ($media->thumb_path) {
                Storage::disk('public')->delete($media->thumb_path);
            }
            $data['thumb_path'] = $request->file('thumb')->store('uploads/gallery/thumbs', 'public');
        }

        $media->update($data);
        return $media->refresh();
    }

    public function destroy(MediaItem $media)
    {
        if ($media->src_path) {
            Storage::disk('public')->delete($media->src_path);
        }
        if ($media->thumb_path) {
            Storage::disk('public')->delete($media->thumb_path);
        }
        $media->delete();
        return response()->noContent();
    }
}
