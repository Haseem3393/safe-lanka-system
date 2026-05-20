<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'public_id' => $this->public_id,
            'type' => [
                'id' => $this->incident_type_id,
                'name' => $this->incidentType?->name,
            ],
            'severity' => $this->severity,
            'status' => $this->status,
            'description' => $this->description,
            'location' => [
                'text' => $this->location_text,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            'reporter' => $this->whenLoaded('reporter', fn () => [
                'id' => $this->reporter?->id,
                'name' => $this->reporter?->name,
                'email' => $this->reporter?->email,
            ]),
            'assigned_team' => $this->whenLoaded('assignedTeam', fn () => [
                'id' => $this->assignedTeam?->id,
                'name' => $this->assignedTeam?->name,
                'status' => $this->assignedTeam?->status,
            ]),
            'timestamps' => [
                'assigned_at' => $this->assigned_at?->toIso8601String(),
                'completed_at' => $this->completed_at?->toIso8601String(),
                'resolved_at' => $this->resolved_at?->toIso8601String(),
                'created_at' => $this->created_at?->toIso8601String(),
                'updated_at' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
