<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_role_and_permissions(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $user = User::factory()->create([
            'email' => 'admin@safelanka.lk',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $user->roles()->attach(Role::query()->where('name', 'admin')->firstOrFail());

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@safelanka.lk',
            'password' => 'secret123',
            'device_name' => 'web-frontend',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.roles.0', 'admin')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_at',
                    'user' => ['id', 'name', 'email', 'roles', 'permissions'],
                ],
                'errors',
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'citizen@safelanka.lk',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'citizen@safelanka.lk',
            'password' => 'bad-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_me_and_logout_require_authentication_and_work_with_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_register_creates_citizen_user_with_token(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Citizen',
            'email' => 'newuser@example.com',
            'phone' => '+94771234567',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.roles.0', 'citizen')
            ->assertJsonPath('data.user.email', 'newuser@example.com')
            ->assertJsonStructure([
                'data' => ['access_token', 'user' => ['id', 'name', 'email', 'roles', 'permissions']],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate',
            'email' => 'taken@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_register_fails_with_password_mismatch(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Mismatch',
            'email' => 'mismatch@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'different123',
        ]);

        $response->assertStatus(422);
    }
}
