<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\RescueTeam;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $totalIncidents = Incident::query()->count();
        $activeIncidents = Incident::query()
            ->whereNotIn('status', ['resolved', 'completed'])
            ->count();
        $resolvedIncidents = Incident::query()
            ->whereIn('status', ['resolved', 'completed'])
            ->count();
        $availableTeams = RescueTeam::query()
            ->where('status', 'available')
            ->where('is_active', true)
            ->count();
        $totalTeams = RescueTeam::query()
            ->where('is_active', true)
            ->count();

        return ApiResponse::success([
            'total_incidents' => $totalIncidents,
            'active_incidents' => $activeIncidents,
            'resolved_incidents' => $resolvedIncidents,
            'available_teams' => $availableTeams,
            'total_teams' => $totalTeams,
        ], 'Stats fetched.');
    }
}
