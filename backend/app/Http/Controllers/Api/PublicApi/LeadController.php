<?php

namespace App\Http\Controllers\Api\PublicApi;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:160'],
            'interest' => ['nullable', 'string', 'max:60'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $lead = Lead::create($data + ['status' => 'new']);

        return response()->json([
            'ok' => true,
            'lead_id' => $lead->id,
            'message' => 'Recibido. Un asesor te contactará en breve.',
        ], 201);
    }
}
