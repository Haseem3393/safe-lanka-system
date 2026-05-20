<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['incident_id', 'rescue_team_id', 'assigned_by_user_id', 'note', 'unassigned_at'])]
class IncidentAssignment extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'unassigned_at' => 'datetime',
        ];
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function rescueTeam(): BelongsTo
    {
        return $this->belongsTo(RescueTeam::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }
}
