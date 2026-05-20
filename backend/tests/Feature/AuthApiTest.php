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
}
