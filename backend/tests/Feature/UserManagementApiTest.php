<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());
        return $user;
    }

    public function test_admin_can_list_users(): void
    {
        $admin = $this->adminUser();
        User::factory()->create(['name' => 'Citizen One']);
        User::factory()->create(['name' => 'Citizen Two']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/users?per_page=50')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.items'); // admin + 2 citizens
    }

    public function test_admin_can_search_users_by_name(): void
    {
        $admin = $this->adminUser();
        User::factory()->create(['name' => 'Findable User']);
        User::factory()->create(['name' => 'Other Person']);

        Sanctum::actingAs($admin);

        $res = $this->getJson('/api/v1/admin/users?search=Findable')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(1, $res->json('data.items'));
    }

    public function test_admin_can_create_user_with_role(): void
    {
        Sanctum::actingAs($this->adminUser());

        $this->postJson('/api/v1/admin/users', [
            'name' => 'New Admin',
            'email' => 'newadmin@example.com',
            'phone' => '+94770000001',
            'password' => 'password123',
            'role' => 'admin',
        ])->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.roles.0', 'admin');

        $this->assertDatabaseHas('users', ['email' => 'newadmin@example.com']);
    }

    public function test_admin_can_update_user_name(): void
    {
        $admin = $this->adminUser();
        $user = User::factory()->create(['name' => 'Old Name']);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$user->id}", [
            'name' => 'New Name',
        ])->assertOk()
            ->assertJsonPath('data.user.name', 'New Name');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Name']);
    }

    public function test_admin_can_deactivate_user(): void
    {
        $admin = $this->adminUser();
        $user = User::factory()->create(['is_active' => true]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/v1/admin/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertFalse($user->is_active);
    }

    public function test_admin_can_reactivate_user(): void
    {
        $admin = $this->adminUser();
        $user = User::factory()->create(['is_active' => false]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$user->id}", [
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('data.user.is_active', true);
    }

    public function test_admin_can_change_user_role(): void
    {
        $admin = $this->adminUser();
        $citizen = User::factory()->create();
        $citizen->roles()->attach(Role::query()->where('name', 'citizen')->firstOrFail());

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$citizen->id}", [
            'role' => 'admin',
        ])->assertOk();

        $citizen->load('roles');
        $this->assertTrue($citizen->hasRole('admin'));
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $citizen = User::factory()->create();
        $citizen->roles()->attach(Role::query()->where('name', 'citizen')->firstOrFail());

        Sanctum::actingAs($citizen);

        $this->getJson('/api/v1/admin/users')->assertStatus(403);
    }

    public function test_create_user_validates_required_fields(): void
    {
        Sanctum::actingAs($this->adminUser());

        $this->postJson('/api/v1/admin/users', [])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_user_list_supports_role_filter(): void
    {
        $admin = $this->adminUser();
        $citizen = User::factory()->create();
        $citizen->roles()->attach(Role::query()->where('name', 'citizen')->firstOrFail());

        Sanctum::actingAs($admin);

        $res = $this->getJson('/api/v1/admin/users?role=citizen')
            ->assertOk();

        $items = $res->json('data.items');
        $this->assertCount(1, $items);
        $this->assertEquals($citizen->email, $items[0]['email']);
    }
}
