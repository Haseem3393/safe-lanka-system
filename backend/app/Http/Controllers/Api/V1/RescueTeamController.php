<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RescueTeam;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RescueTeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RescueTeam::query()->where('is_active', true);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $teams = $query->get();

        return ApiResponse::success([
            'teams' => $teams,
        ], 'Rescue teams fetched.');
    }
}
