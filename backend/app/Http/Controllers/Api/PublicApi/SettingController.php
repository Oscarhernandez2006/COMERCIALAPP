<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $all = SiteSetting::allGrouped();
        if (! empty($all['logo_path'])) {
            $all['logo_url'] = Storage::url($all['logo_path']);
        }
        return response()->json($all);
    }
}
