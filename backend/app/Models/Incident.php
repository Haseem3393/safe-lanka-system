<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'public_id',
    'reported_by_user_id',
    'incident_type_id',
    'severity',
    'status',
    'description',
    'location_text',
    'latitude',
    'longitude',
    'assigned_team_id',
    'assigned_by_user_id',
    'assigned_at',
    'completed_at',
    'resolved_at',
])]
class Incident extends Model
{
    use HasFactory;

    public const ALLOWED_STATUSES = [
        'pending',
        'assigned',
        'in_progress',
        'on_the_way',
        'arrived',
        'rescued',
        'completed',
        'resolved',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'completed_at' => 'datetime',
            'resolved_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function incidentType(): BelongsTo
    {
        return $this->belongsTo(IncidentType::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    public function assignedTeam(): BelongsTo
    {
        return $this->belongsTo(RescueTeam::class, 'assigned_team_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(IncidentAssignment::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(IncidentStatusHistory::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(IncidentMedia::class);
    }
}
