<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
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
            ->with('roles')
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

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('roles');

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
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getPermissionNames(),
        ];
    }
}
