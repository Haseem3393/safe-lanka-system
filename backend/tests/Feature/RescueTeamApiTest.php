<?php

namespace Tests\Feature;

use App\Models\RescueTeam;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RescueTeamApiTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());
        return $user;
    }

    public function test_admin_can_list_rescue_teams(): void
    {
        RescueTeam::query()->create([
            'name' => 'Alpha Unit',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->getJson('/api/v1/admin/rescue-teams')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.teams.0.name', 'Alpha Unit');
    }

    public function test_admin_can_create_rescue_team(): void
    {
        Sanctum::actingAs($this->adminUser());

        $this->postJson('/api/v1/admin/rescue-teams', [
            'name' => 'Bravo Unit',
            'station_name' => 'Gampaha',
            'contact_phone' => '+94771234567',
            'status' => 'available',
            'default_eta_minutes' => 15,
        ])->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.team.name', 'Bravo Unit');

        $this->assertDatabaseHas('rescue_teams', ['name' => 'Bravo Unit', 'station_name' => 'Gampaha']);
    }

    public function test_admin_can_update_rescue_team(): void
    {
        $team = RescueTeam::query()->create([
            'name' => 'Charlie',
            'station_name' => 'Kandy',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->patchJson("/api/v1/admin/rescue-teams/{$team->id}", [
            'name' => 'Charlie Updated',
            'status' => 'busy',
        ])->assertOk()
            ->assertJsonPath('data.team.name', 'Charlie Updated');

        $this->assertDatabaseHas('rescue_teams', ['id' => $team->id, 'name' => 'Charlie Updated', 'status' => 'busy']);
    }

    public function test_admin_can_deactivate_rescue_team(): void
    {
        $team = RescueTeam::query()->create([
            'name' => 'Delta',
            'station_name' => 'Matara',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->deleteJson("/api/v1/admin/rescue-teams/{$team->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $team->refresh();
        $this->assertFalse((bool) $team->is_active);
    }

    public function test_admin_can_show_team_with_members(): void
    {
        $team = RescueTeam::query()->create([
            'name' => 'Echo',
            'station_name' => 'Galle',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->getJson("/api/v1/admin/rescue-teams/{$team->id}")
            ->assertOk()
            ->assertJsonPath('data.team.name', 'Echo');
    }

    public function test_create_team_validates_required_fields(): void
    {
        Sanctum::actingAs($this->adminUser());

        $this->postJson('/api/v1/admin/rescue-teams', [])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_non_admin_cannot_access_team_crud(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $citizen = User::factory()->create();
        $citizen->roles()->attach(Role::query()->where('name', 'citizen')->firstOrFail());

        Sanctum::actingAs($citizen);

        $this->getJson('/api/v1/admin/rescue-teams')->assertStatus(403);
        $this->postJson('/api/v1/admin/rescue-teams', ['name' => 'X', 'station_name' => 'X'])->assertStatus(403);
    }
}
