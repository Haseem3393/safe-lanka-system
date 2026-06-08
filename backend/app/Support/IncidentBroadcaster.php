<?php

namespace App\Support;

use App\Events\IncidentChanged;
use App\Models\Incident;
use Illuminate\Support\Facades\Log;

class IncidentBroadcaster
{
    public static function dispatch(Incident $incident, string $action): void
    {
        try {
            $incident->loadMissing(['incidentType', 'reporter', 'assignedTeam']);
            event(new IncidentChanged($incident, $action));
        } catch (\Throwable $e) {
            // Broadcasting is optional - log the error but don't crash the request
            Log::warning('Broadcasting failed (Reverb may not be running): ' . $e->getMessage());
        }
    }
}
