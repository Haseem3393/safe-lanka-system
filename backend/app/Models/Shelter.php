<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'location_text', 'latitude', 'longitude', 'capacity', 'available_beds', 'contact_phone', 'is_active'])]
class Shelter extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'capacity' => 'integer',
            'available_beds' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
