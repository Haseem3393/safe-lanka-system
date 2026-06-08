<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Incident\AssignIncidentRequest;
use App\Http\Requests\Incident\IncidentIndexRequest;
use App\Http\Requests\Incident\StoreIncidentRequest;
use App\Http\Requests\Incident\UpdateIncidentRequest;
use App\Http\Requests\Incident\UpdateIncidentStatusRequest;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\PublicIncidentResource;
use App\Models\Incident;
use App\Models\IncidentMedia;
use App\Models\User;
use App\Services\IncidentService;
use App\Support\ApiResponse;
use App\Support\IncidentBroadcaster;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function __construct(private readonly IncidentService $incidentService) {}

    public function index(IncidentIndexRequest $request): JsonResponse
    {
        $user = $request->user();

        $query = Incident::query()
            ->with(['incidentType', 'reporter', 'assignedTeam'])
            ->latest();

        $this->scopeByActor($query, $user?->id, $user?->getRoleNames() ?? []);
        $this->applyFilters($query, $request->validated());

        $perPage = (int) $request->input('per_page', 15);
        $paginator = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'items' => IncidentResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], 'Incidents fetched.');
    }

    public function publicIndex(IncidentIndexRequest $request): JsonResponse
    {
        $query = Incident::query()
            ->with(['incidentType'])
            ->latest();

        if (! $request->boolean('include_resolved')) {
            $query->whereNotIn('status', ['resolved', 'completed']);
        }

        $this->applyFilters($query, $request->validated());

        $perPage = (int) $request->input('per_page', 50);
        $paginator = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'items' => PublicIncidentResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], 'Public incidents fetched.');
    }

    public function show(Incident $incident): JsonResponse
    {
        $user = request()->user();
        $roles = $user?->getRoleNames() ?? [];

        if (in_array('citizen', $roles, true) && $incident->reported_by_user_id !== $user?->id) {
            return ApiResponse::error('Forbidden.', [], 403);
        }

        if ($denied = $this->denyUnlessRescueTeamOwnsIncident($user, $incident)) {
            return $denied;
        }

        $incident->load(['incidentType', 'reporter', 'assignedTeam', 'statusHistory.changedBy', 'assignments.rescueTeam']);

        return ApiResponse::success([
            'incident' => new IncidentResource($incident),
            'status_history' => $incident->statusHistory
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'from_status' => $item->from_status,
                    'to_status' => $item->to_status,
                    'note' => $item->note,
                    'changed_by' => $item->changedBy?->name,
                    'created_at' => $item->created_at?->toIso8601String(),
                ]),
        ], 'Incident fetched.');
    }

    public function store(StoreIncidentRequest $request): JsonResponse
    {
        $incident = $this->incidentService->createIncident($request->validated(), $request->user()?->id);
        $incident->load(['incidentType', 'reporter', 'assignedTeam']);

        return ApiResponse::success([
            'incident' => new IncidentResource($incident),
        ], 'Incident created.', 201);
    }

    public function update(UpdateIncidentRequest $request, Incident $incident): JsonResponse
    {
        $incident->fill($request->validated())->save();
        $incident->load(['incidentType', 'reporter', 'assignedTeam']);
        IncidentBroadcaster::dispatch($incident, 'updated');

        return ApiResponse::success([
            'incident' => new IncidentResource($incident),
        ], 'Incident updated.');
    }

    public function assign(AssignIncidentRequest $request, Incident $incident): JsonResponse
    {
        $incident = $this->incidentService->assignTeam(
            $incident,
            (int) $request->integer('rescue_team_id'),
            $request->user()?->id,
            $request->input('note')
        );
        $incident->load(['incidentType', 'reporter', 'assignedTeam']);

        return ApiResponse::success([
            'incident' => new IncidentResource($incident),
        ], 'Incident assigned.');
    }

    public function updateStatus(UpdateIncidentStatusRequest $request, Incident $incident): JsonResponse
    {
        if ($denied = $this->denyUnlessRescueTeamOwnsIncident($request->user(), $incident)) {
            return $denied;
        }

        $incident = $this->incidentService->updateStatus(
            $incident,
            (string) $request->string('status'),
            $request->user()?->id,
            $request->input('note')
        );
        $incident->load(['incidentType', 'reporter', 'assignedTeam']);

        return ApiResponse::success([
            'incident' => new IncidentResource($incident),
        ], 'Incident status updated.');
    }

    public function uploadMedia(Request $request, Incident $incident): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,mp4,mov,webm', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store('incident-media/' . $incident->id, 'public');

        $media = IncidentMedia::query()->create([
            'incident_id' => $incident->id,
            'uploaded_by_user_id' => $request->user()?->id,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
        ]);

        return ApiResponse::success([
            'media' => $media,
            'url' => '/storage/' . $path,
        ], 'Media uploaded.', 201);
    }

    /**
     * @param  array<string,mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $query
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['severity'] ?? null, fn (Builder $q, string $severity) => $q->where('severity', $severity))
            ->when($filters['incident_type_id'] ?? null, fn (Builder $q, int $typeId) => $q->where('incident_type_id', $typeId))
            ->when($filters['assigned_team_id'] ?? null, fn (Builder $q, int $teamId) => $q->where('assigned_team_id', $teamId))
            ->when($filters['created_from'] ?? null, fn (Builder $q, string $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['created_to'] ?? null, fn (Builder $q, string $date) => $q->whereDate('created_at', '<=', $date))
            ->when($filters['search'] ?? null, function (Builder $q, string $search): void {
                $q->where(function (Builder $inner) use ($search): void {
                    $inner->where('public_id', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location_text', 'like', "%{$search}%");
                });
            });
    }

    /**
     * @param  array<int,string>  $roles
     */
    private function scopeByActor(Builder $query, ?int $userId, array $roles): void
    {
        if (in_array('admin', $roles, true)) {
            return;
        }

        if (in_array('citizen', $roles, true) && $userId) {
            $query->where('reported_by_user_id', $userId);
            return;
        }

        if (in_array('rescue', $roles, true) && $userId) {
            $teamId = User::query()->find($userId)?->getRescueTeamId();

            if ($teamId) {
                $query->where('assigned_team_id', $teamId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
    }

    private function denyUnlessRescueTeamOwnsIncident(?User $user, Incident $incident): ?JsonResponse
    {
        if (! $user?->hasRole('rescue')) {
            return null;
        }

        $teamId = $user->getRescueTeamId();

        if (! $teamId || $incident->assigned_team_id !== $teamId) {
            return ApiResponse::error('Forbidden.', [], 403);
        }

        return null;
    }
}
