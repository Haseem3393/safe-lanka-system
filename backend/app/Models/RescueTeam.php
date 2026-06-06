<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'station_name', 'contact_phone', 'status', 'default_eta_minutes', 'is_active'])]
class RescueTeam extends Model
{
    use HasFactory;

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'assigned_team_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(RescueTeamMember::class);
    }
}
