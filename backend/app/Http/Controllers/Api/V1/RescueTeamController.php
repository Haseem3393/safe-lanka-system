<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RescueTeam\StoreRescueTeamRequest;
use App\Http\Requests\RescueTeam\UpdateRescueTeamRequest;
use App\Models\RescueTeam;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RescueTeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RescueTeam::query()->withCount('members');

        if ($request->boolean('include_inactive')) {
            // admin can see all
        } else {
            $query->where('is_active', true);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $teams = $query->orderBy('name')->get();

        return ApiResponse::success([
            'teams' => $teams->map(fn (RescueTeam $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'station_name' => $t->station_name,
                'contact_phone' => $t->contact_phone,
                'status' => $t->status,
                'default_eta_minutes' => $t->default_eta_minutes,
                'is_active' => $t->is_active,
                'members_count' => $t->members_count,
                'created_at' => $t->created_at?->toDateTimeString(),
            ]),
        ], 'Rescue teams fetched.');
    }

    public function store(StoreRescueTeamRequest $request): JsonResponse
    {
        $data = $request->validated();

        $team = RescueTeam::query()->create(array_merge($data, [
            'is_active' => true,
        ]));

        $team->loadCount('members');

        return ApiResponse::success([
            'team' => $team,
        ], 'Rescue team created.', 201);
    }

    public function show(RescueTeam $rescueTeam): JsonResponse
    {
        $rescueTeam->load(['members' => fn ($q) => $q->where('is_active', true)]);
        $rescueTeam->loadCount('members');

        return ApiResponse::success([
            'team' => $rescueTeam,
        ], 'Rescue team details.');
    }

    public function update(UpdateRescueTeamRequest $request, RescueTeam $rescueTeam): JsonResponse
    {
        $data = $request->validated();
        $rescueTeam->update($data);

        $rescueTeam->loadCount('members');

        return ApiResponse::success([
            'team' => $rescueTeam->fresh(),
        ], 'Rescue team updated.');
    }

    public function destroy(RescueTeam $rescueTeam): JsonResponse
    {
        // Soft delete: deactivate instead of deleting
        $rescueTeam->update(['is_active' => false, 'status' => 'busy']);

        return ApiResponse::success([
            'team' => $rescueTeam,
        ], 'Rescue team deactivated.');
    }
}
