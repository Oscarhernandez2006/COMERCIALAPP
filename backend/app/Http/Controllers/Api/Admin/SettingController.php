<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        return SiteSetting::orderBy('group')->orderBy('key')->get();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:120'],
            'settings.*.value' => ['nullable'],
            'settings.*.group' => ['nullable', 'string', 'max:60'],
        ]);

        foreach ($data['settings'] as $row) {
            SiteSetting::set(
                $row['key'],
                $row['value'] ?? null,
                $row['group'] ?? 'general',
            );
        }

        return SiteSetting::orderBy('group')->orderBy('key')->get();
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:5120'],
        ]);

        $old = SiteSetting::get('logo_path');
        if ($old) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('logo')->store('uploads/site', 'public');
        SiteSetting::set('logo_path', $path, 'general');

        return response()->json([
            'logo_path' => $path,
            'logo_url' => Storage::url($path),
        ]);
    }
}
