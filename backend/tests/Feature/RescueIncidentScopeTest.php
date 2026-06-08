<?php

namespace Tests\Feature;

use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\RescueTeam;
use App\Models\RescueTeamMember;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RescueIncidentScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_rescue_user_only_sees_incidents_assigned_to_their_team(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);

        $teamA = RescueTeam::query()->create([
            'name' => 'Team Alpha',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        $teamB = RescueTeam::query()->create([
            'name' => 'Team Beta',
            'station_name' => 'Kandy',
            'status' => 'available',
            'is_active' => true,
        ]);

        $rescueUser = $this->userWithRole('rescue');
        RescueTeamMember::query()->create([
            'rescue_team_id' => $teamA->id,
            'user_id' => $rescueUser->id,
            'name' => $rescueUser->name,
            'position' => 'Officer',
            'is_active' => true,
        ]);

        Incident::query()->create([
            'public_id' => 'SL-30001',
            'incident_type_id' => $type->id,
            'severity' => 'high',
            'status' => 'assigned',
            'description' => 'Assigned to team alpha.',
            'location_text' => 'Colombo',
            'assigned_team_id' => $teamA->id,
        ]);

        Incident::query()->create([
            'public_id' => 'SL-30002',
            'incident_type_id' => $type->id,
            'severity' => 'medium',
            'status' => 'assigned',
            'description' => 'Assigned to team beta.',
            'location_text' => 'Kandy',
            'assigned_team_id' => $teamB->id,
        ]);

        Sanctum::actingAs($rescueUser);

        $this->getJson('/api/v1/rescue/incidents')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.public_id', 'SL-30001');
    }

    public function test_rescue_user_cannot_update_status_for_another_teams_incident(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $type = IncidentType::query()->create(['name' => 'Fire', 'is_active' => true]);

        $teamA = RescueTeam::query()->create([
            'name' => 'Team Alpha',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        $teamB = RescueTeam::query()->create([
            'name' => 'Team Beta',
            'station_name' => 'Gampaha',
            'status' => 'available',
            'is_active' => true,
        ]);

        $rescueUser = $this->userWithRole('rescue');
        RescueTeamMember::query()->create([
            'rescue_team_id' => $teamA->id,
            'user_id' => $rescueUser->id,
            'name' => $rescueUser->name,
            'position' => 'Officer',
            'is_active' => true,
        ]);

        $foreignIncident = Incident::query()->create([
            'public_id' => 'SL-30003',
            'incident_type_id' => $type->id,
            'severity' => 'critical',
            'status' => 'assigned',
            'description' => 'Assigned to another team.',
            'location_text' => 'Gampaha',
            'assigned_team_id' => $teamB->id,
        ]);

        Sanctum::actingAs($rescueUser);

        $this->postJson("/api/v1/rescue/incidents/{$foreignIncident->id}/status", [
            'status' => 'on_the_way',
        ])->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_login_includes_rescue_team_for_rescue_users(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $team = RescueTeam::query()->create([
            'name' => 'Hill Rescue Unit',
            'station_name' => 'Kandy Station',
            'status' => 'available',
            'is_active' => true,
        ]);

        $rescueUser = User::factory()->create([
            'email' => 'field@safelanka.lk',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $rescueUser->roles()->attach(Role::query()->where('name', 'rescue')->firstOrFail());

        RescueTeamMember::query()->create([
            'rescue_team_id' => $team->id,
            'user_id' => $rescueUser->id,
            'name' => $rescueUser->name,
            'position' => 'Officer',
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'field@safelanka.lk',
            'password' => 'secret123',
        ])->assertOk()
            ->assertJsonPath('data.user.rescue_team.id', $team->id)
            ->assertJsonPath('data.user.rescue_team.name', 'Hill Rescue Unit');
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role);

        return $user;
    }
}
