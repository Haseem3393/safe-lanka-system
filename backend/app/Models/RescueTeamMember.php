<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['rescue_team_id', 'user_id', 'name', 'phone', 'position', 'is_active'])]
class RescueTeamMember extends Model
{
    public function rescueTeam(): BelongsTo
    {
        return $this->belongsTo(RescueTeam::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
