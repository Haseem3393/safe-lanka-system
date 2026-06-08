<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicIncidentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
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
            'timestamps' => [
                'created_at' => $this->created_at?->toIso8601String(),
            ],
        ];
    }
}
