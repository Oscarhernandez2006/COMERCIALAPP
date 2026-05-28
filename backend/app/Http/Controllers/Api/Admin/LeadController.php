<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index()
    {
        return Lead::orderByDesc('id')->get();
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,contacted,qualified,closed'],
        ]);
        $lead->update($data);
        return $lead;
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->noContent();
    }
}
