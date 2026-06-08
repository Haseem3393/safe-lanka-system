<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('admin.incidents', function (User $user): bool {
    return $user->hasRole('admin');
});

Broadcast::channel('rescue.team.{teamId}', function (User $user, string $teamId): bool {
    return $user->hasRole('rescue') && $user->getRescueTeamId() === (int) $teamId;
});

Broadcast::channel('citizen.{userId}', function (User $user, string $userId): bool {
    return $user->hasRole('citizen') && (int) $user->id === (int) $userId;
});
