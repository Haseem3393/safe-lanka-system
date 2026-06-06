<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RescueTeamMember;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RescueTeamMemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RescueTeamMember::query()
            ->with('rescueTeam')
            ->where('is_active', true);

        if ($teamId = $request->input('rescue_team_id')) {
            $query->where('rescue_team_id', $teamId);
        }

        $members = $query->latest()->paginate(
            (int) $request->input('per_page', 50)
        );

        return ApiResponse::success([
            'items' => $members->items(),
            'pagination' => [
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
            ],
        ], 'Rescue team members fetched.');
    }
}
