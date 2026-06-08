<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\IncidentAssignment;
use App\Models\IncidentStatusHistory;
use App\Support\IncidentBroadcaster;
use Illuminate\Support\Facades\DB;

class IncidentService
{
    /**
     * @param  array<string,mixed>  $payload
     */
    public function createIncident(array $payload, ?int $actorUserId): Incident
    {
        return DB::transaction(function () use ($payload, $actorUserId): Incident {
            $incident = Incident::query()->create([
                ...$payload,
                'public_id' => $this->generatePublicId(),
                'status' => 'pending',
                'reported_by_user_id' => $actorUserId,
            ]);

            IncidentStatusHistory::query()->create([
                'incident_id' => $incident->id,
                'from_status' => null,
                'to_status' => 'pending',
                'note' => 'Incident created.',
                'changed_by_user_id' => $actorUserId,
            ]);

            IncidentBroadcaster::dispatch($incident, 'created');

            return $incident;
        });
    }

    public function assignTeam(Incident $incident, int $rescueTeamId, ?int $actorUserId, ?string $note): Incident
    {
        return DB::transaction(function () use ($incident, $rescueTeamId, $actorUserId, $note): Incident {
            $fromStatus = $incident->status;

            $incident->fill([
                'assigned_team_id' => $rescueTeamId,
                'assigned_by_user_id' => $actorUserId,
                'assigned_at' => now(),
                'status' => 'assigned',
            ])->save();

            IncidentAssignment::query()->create([
                'incident_id' => $incident->id,
                'rescue_team_id' => $rescueTeamId,
                'assigned_by_user_id' => $actorUserId,
                'note' => $note,
            ]);

            IncidentStatusHistory::query()->create([
                'incident_id' => $incident->id,
                'from_status' => $fromStatus,
                'to_status' => 'assigned',
                'note' => $note ?: 'Rescue team assigned.',
                'changed_by_user_id' => $actorUserId,
            ]);

            $incident = $incident->fresh();
            IncidentBroadcaster::dispatch($incident, 'assigned');

            return $incident;
        });
    }

    public function updateStatus(Incident $incident, string $status, ?int $actorUserId, ?string $note): Incident
    {
        return DB::transaction(function () use ($incident, $status, $actorUserId, $note): Incident {
            $fromStatus = $incident->status;
            $incident->status = $status;

            if ($status === 'completed') {
                $incident->completed_at = now();
            }

            if ($status === 'resolved') {
                $incident->resolved_at = now();
            }

            $incident->save();

            IncidentStatusHistory::query()->create([
                'incident_id' => $incident->id,
                'from_status' => $fromStatus,
                'to_status' => $status,
                'note' => $note,
                'changed_by_user_id' => $actorUserId,
            ]);

            $incident = $incident->fresh();
            IncidentBroadcaster::dispatch($incident, 'status_changed');

            return $incident;
        });
    }

    private function generatePublicId(): string
    {
        do {
            $publicId = 'SL-'.random_int(10000, 99999);
        } while (Incident::query()->where('public_id', $publicId)->exists());

        return $publicId;
    }
}
