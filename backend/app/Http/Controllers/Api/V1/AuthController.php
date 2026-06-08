<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->where('email', strtolower((string) $request->string('email')))
            ->with(['roles', 'rescueTeamMember.rescueTeam'])
            ->first();

        if (! $user || ! Hash::check((string) $request->string('password'), $user->password)) {
            return ApiResponse::error('Invalid credentials.', [
                'email' => ['The provided credentials are incorrect.'],
            ], 401);
        }

        if (! $user->is_active) {
            return ApiResponse::error('User account is inactive.', [], 403);
        }

        $expirationMinutes = config('sanctum.expiration');
        $expiresAt = $expirationMinutes ? now()->addMinutes((int) $expirationMinutes) : null;

        $tokenName = $request->input('device_name')
            ?: ($request->userAgent() ? 'web:'.$request->userAgent() : 'web-client');

        $token = $user->createToken($tokenName, ['*'], $expiresAt);
        $user->forceFill(['last_login_at' => now()])->save();

        return ApiResponse::success([
            'token_type' => 'Bearer',
            'access_token' => $token->plainTextToken,
            'expires_at' => $expiresAt?->toIso8601String(),
            'user' => $this->authUserPayload($user),
        ], 'Login successful.');
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        unset($data['password_confirmation']);

        $user = User::query()->create($data);

        $citizenRole = Role::query()->where('name', 'citizen')->firstOrFail();
        $user->roles()->attach($citizenRole);

        $expirationMinutes = config('sanctum.expiration');
        $expiresAt = $expirationMinutes ? now()->addMinutes((int) $expirationMinutes) : null;
        $token = $user->createToken('web-client', ['*'], $expiresAt);

        $user->load('roles');

        return ApiResponse::success([
            'token_type' => 'Bearer',
            'access_token' => $token->plainTextToken,
            'expires_at' => $expiresAt?->toIso8601String(),
            'user' => $this->authUserPayload($user),
        ], 'Registration successful.', 201);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['roles', 'rescueTeamMember.rescueTeam']);

        return ApiResponse::success([
            'user' => $this->authUserPayload($user),
        ], 'Authenticated user fetched.');
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return ApiResponse::success([], 'Logout successful.');
    }

    /**
     * @return array<string, mixed>
     */
    private function authUserPayload(User $user): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getPermissionNames(),
        ];

        if ($user->hasRole('rescue')) {
            $membership = $user->rescueTeamMember;
            $payload['rescue_team'] = $membership ? [
                'id' => $membership->rescue_team_id,
                'name' => $membership->rescueTeam?->name,
            ] : null;
        }

        return $payload;
    }
}
