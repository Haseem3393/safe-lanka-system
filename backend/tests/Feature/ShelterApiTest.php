<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShelterApiTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());
        return $user;
    }

    public function test_admin_can_create_shelter(): void
    {
        Sanctum::actingAs($this->adminUser());

        $this->postJson('/api/v1/admin/shelters', [
            'name' => 'Colombo Shelter',
            'location_text' => 'Colombo 07',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
            'capacity' => 200,
            'available_beds' => 150,
            'contact_phone' => '+94112345678',
        ])->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('shelters', ['name' => 'Colombo Shelter']);
    }

    public function test_admin_can_update_shelter(): void
    {
        $shelter = Shelter::query()->create([
            'name' => 'Old Shelter',
            'location_text' => 'Gampaha',
            'capacity' => 100,
            'available_beds' => 50,
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->putJson("/api/v1/admin/shelters/{$shelter->id}", [
            'name' => 'Updated Shelter',
            'location_text' => 'Gampaha Updated',
            'capacity' => 120,
            'available_beds' => 60,
        ])->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('shelters', ['id' => $shelter->id, 'name' => 'Updated Shelter']);
    }

    public function test_admin_can_deactivate_shelter(): void
    {
        $shelter = Shelter::query()->create([
            'name' => 'Deactivate Me',
            'location_text' => 'Kandy',
            'capacity' => 50,
            'available_beds' => 30,
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->adminUser());

        $this->deleteJson("/api/v1/admin/shelters/{$shelter->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $shelter->refresh();
        $this->assertFalse($shelter->is_active);
    }

    public function test_authenticated_user_can_list_shelters(): void
    {
        Shelter::query()->create([
            'name' => 'Shelter A',
            'location_text' => 'Colombo',
            'capacity' => 100,
            'available_beds' => 80,
            'is_active' => true,
        ]);

        $this->seed(\Database\Seeders\RoleSeeder::class);
        $citizen = User::factory()->create();
        $citizen->roles()->attach(Role::query()->where('name', 'citizen')->firstOrFail());

        Sanctum::actingAs($citizen);

        $this->getJson('/api/v1/shelters')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_unauthenticated_user_cannot_create_shelter(): void
    {
        $this->postJson('/api/v1/admin/shelters', [
            'name' => 'No Auth',
            'location_text' => 'Nowhere',
            'capacity' => 10,
            'available_beds' => 5,
        ])->assertStatus(401);
    }
}
