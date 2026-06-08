<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\RescueTeamMember;
use App\Models\Role;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 20);
        $search = $request->input('search');
        $roleFilter = $request->input('role');

        $query = User::query()->with('roles');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($roleFilter) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $roleFilter));
        }

        $users = $query->orderByDesc('id')->paginate($perPage);

        return ApiResponse::success([
            'items' => collect($users->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'is_active' => $u->is_active,
                'roles' => $u->getRoleNames(),
                'created_at' => $u->created_at?->toDateTimeString(),
                'last_login_at' => $u->last_login_at?->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 'Users fetched.');
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $roleName = $data['role'];
        unset($data['role']);

        $user = User::query()->create($data);

        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role);

        if ($roleName === 'rescue') {
            RescueTeamMember::query()->create([
                'user_id' => $user->id,
                'rescue_team_id' => (int) $request->integer('rescue_team_id'),
                'name' => $user->name,
                'phone' => $user->phone,
                'position' => 'Officer',
                'is_active' => true,
            ]);
        }

        $user->load(['roles', 'rescueTeamMember.rescueTeam']);

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'roles' => $user->getRoleNames(),
            ],
        ], 'User created.', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        // Handle role change if provided
        if (isset($data['role'])) {
            $newRoleName = $data['role'];
            unset($data['role']);

            $newRole = Role::query()->where('name', $newRoleName)->first();
            if ($newRole) {
                $user->roles()->sync([$newRole->id]);
            }
        }

        $user->update($data);
        $user->load('roles');

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'roles' => $user->getRoleNames(),
                'created_at' => $user->created_at?->toDateTimeString(),
                'last_login_at' => $user->last_login_at?->toDateTimeString(),
            ],
        ], 'User updated.');
    }

    public function destroy(User $user): JsonResponse
    {
        // Soft delete: deactivate instead of deleting
        $user->update(['is_active' => false]);

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'is_active' => $user->is_active,
            ],
        ], 'User deactivated.');
    }
}
