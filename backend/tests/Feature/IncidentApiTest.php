<?php

namespace Tests\Feature;

use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\RescueTeam;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IncidentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_assign_and_update_incident_status(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $admin = $this->userWithRole('admin');
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);
        $team = RescueTeam::query()->create([
            'name' => 'Test Team',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/v1/admin/incidents', [
            'incident_type_id' => $type->id,
            'severity' => 'critical',
            'description' => 'River water level rising.',
            'location_text' => 'Colombo 07',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
        ])->assertCreated();

        $incidentId = $create->json('data.incident.id');

        $this->postJson("/api/v1/admin/incidents/{$incidentId}/assign", [
            'rescue_team_id' => $team->id,
            'note' => 'Closest team assigned.',
        ])->assertOk()
            ->assertJsonPath('data.incident.status', 'assigned');

        $this->postJson("/api/v1/admin/incidents/{$incidentId}/status", [
            'status' => 'in_progress',
            'note' => 'Team started operation.',
        ])->assertOk()
            ->assertJsonPath('data.incident.status', 'in_progress');
    }

    public function test_incident_list_supports_filtering_and_pagination(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $admin = $this->userWithRole('admin');
        $type = IncidentType::query()->create(['name' => 'Fire', 'is_active' => true]);

        Incident::query()->create([
            'public_id' => 'SL-12345',
            'incident_type_id' => $type->id,
            'severity' => 'high',
            'status' => 'pending',
            'description' => 'Warehouse fire',
            'location_text' => 'Gampaha',
        ]);

        Incident::query()->create([
            'public_id' => 'SL-12346',
            'incident_type_id' => $type->id,
            'severity' => 'low',
            'status' => 'resolved',
            'description' => 'Small smoke incident',
            'location_text' => 'Kandy',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/incidents?status=pending&search=Warehouse&per_page=1')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 1)
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.status', 'pending');
    }

    public function test_non_admin_cannot_access_admin_incident_routes(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $citizen = $this->userWithRole('citizen');
        Sanctum::actingAs($citizen);

        $this->getJson('/api/v1/admin/incidents')
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role);

        return $user;
    }
}
