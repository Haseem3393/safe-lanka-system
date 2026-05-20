<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Incident\AssignIncidentRequest;
use App\Http\Requests\Incident\IncidentIndexRequest;
use App\Http\Requests\Incident\StoreIncidentRequest;
use App\Http\Requests\Incident\UpdateIncidentRequest;
use App\Http\Requests\Incident\UpdateIncidentStatusRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use App\Services\IncidentService;
use App\Support\ApiResponse;
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

    public function show(Incident $incident): JsonResponse
    {
        $user = request()->user();
        $roles = $user?->getRoleNames() ?? [];

        if (in_array('citizen', $roles, true) && $incident->reported_by_user_id !== $user?->id) {
            return ApiResponse::error('Forbidden.', [], 403);
        }

        if (in_array('rescue', $roles, true) && $incident->assigned_team_id === null) {
            return ApiResponse::error('Forbidden.', [], 403);
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

        if (in_array('rescue', $roles, true)) {
            $query->whereNotNull('assigned_team_id');
        }
    }
}
