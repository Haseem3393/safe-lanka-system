<?php

namespace App\Events;

use App\Http\Resources\IncidentResource;
use App\Http\Resources\PublicIncidentResource;
use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Incident $incident,
        public string $action,
    ) {}

    /**
     * @return array<int, Channel|PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [new Channel('incidents.public')];

        $channels[] = new PrivateChannel('admin.incidents');

        if ($this->incident->assigned_team_id) {
            $channels[] = new PrivateChannel('rescue.team.'.$this->incident->assigned_team_id);
        }

        if ($this->incident->reported_by_user_id) {
            $channels[] = new PrivateChannel('citizen.'.$this->incident->reported_by_user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'incident.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->incident->loadMissing(['incidentType', 'reporter', 'assignedTeam']);

        return [
            'action' => $this->action,
            'public_incident' => (new PublicIncidentResource($this->incident))->resolve(),
            'incident' => (new IncidentResource($this->incident))->resolve(),
        ];
    }
}
