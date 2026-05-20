<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'is_active'])]
class IncidentType extends Model
{
    use HasFactory;

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }
}
