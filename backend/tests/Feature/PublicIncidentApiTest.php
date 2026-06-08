<?php

namespace Tests\Feature;

use App\Models\Incident;
use App\Models\IncidentType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicIncidentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_incidents_are_accessible_without_authentication(): void
    {
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);

        Incident::query()->create([
            'public_id' => 'SL-10001',
            'incident_type_id' => $type->id,
            'severity' => 'critical',
            'status' => 'pending',
            'description' => 'River overflow near bridge.',
            'location_text' => 'Kelani bridge, Colombo',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
        ]);

        Incident::query()->create([
            'public_id' => 'SL-10002',
            'incident_type_id' => $type->id,
            'severity' => 'low',
            'status' => 'resolved',
            'description' => 'Closed case.',
            'location_text' => 'Kandy',
        ]);

        $response = $this->getJson('/api/v1/public/incidents');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.public_id', 'SL-10001')
            ->assertJsonMissingPath('data.items.0.reporter')
            ->assertJsonStructure([
                'data' => [
                    'items' => [[
                        'public_id',
                        'type' => ['name'],
                        'severity',
                        'status',
                        'description',
                        'location' => ['text', 'latitude', 'longitude'],
                        'timestamps' => ['created_at'],
                    ]],
                ],
            ]);
    }

    public function test_public_incidents_can_include_resolved_when_requested(): void
    {
        $type = IncidentType::query()->create(['name' => 'Fire', 'is_active' => true]);

        Incident::query()->create([
            'public_id' => 'SL-20001',
            'incident_type_id' => $type->id,
            'severity' => 'high',
            'status' => 'resolved',
            'description' => 'Resolved warehouse fire.',
            'location_text' => 'Gampaha',
        ]);

        $this->getJson('/api/v1/public/incidents?include_resolved=1')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.public_id', 'SL-20001');
    }
}
