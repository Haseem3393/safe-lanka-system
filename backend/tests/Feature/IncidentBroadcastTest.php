<?php

namespace Tests\Feature;

use App\Events\IncidentChanged;
use App\Models\Incident;
use App\Models\IncidentType;
use App\Models\RescueTeam;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IncidentBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_incident_dispatches_broadcast_event(): void
    {
        Event::fake([IncidentChanged::class]);

        $this->seed(\Database\Seeders\RoleSeeder::class);
        $admin = $this->userWithRole('admin');
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/incidents', [
            'incident_type_id' => $type->id,
            'severity' => 'critical',
            'description' => 'River water level rising.',
            'location_text' => 'Colombo 07',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
        ])->assertCreated();

        Event::assertDispatched(IncidentChanged::class, function (IncidentChanged $event): bool {
            return $event->action === 'created'
                && $event->incident->status === 'pending';
        });
    }

    public function test_assigning_incident_dispatches_broadcast_event(): void
    {
        Event::fake([IncidentChanged::class]);

        $this->seed(\Database\Seeders\RoleSeeder::class);
        $admin = $this->userWithRole('admin');
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);
        $team = RescueTeam::query()->create([
            'name' => 'Test Team',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/v1/admin/incidents', [
            'incident_type_id' => $type->id,
            'severity' => 'high',
            'description' => 'Bridge flooded.',
            'location_text' => 'Gampaha',
        ])->assertCreated();

        $incidentId = $create->json('data.incident.id');

        $this->postJson("/api/v1/admin/incidents/{$incidentId}/assign", [
            'rescue_team_id' => $team->id,
            'note' => 'Closest team assigned.',
        ])->assertOk();

        Event::assertDispatched(IncidentChanged::class, function (IncidentChanged $event) use ($team): bool {
            return $event->action === 'assigned'
                && $event->incident->assigned_team_id === $team->id;
        });
    }

    public function test_incident_changed_event_targets_role_scoped_channels(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $type = IncidentType::query()->create(['name' => 'Flood', 'is_active' => true]);
        $team = RescueTeam::query()->create([
            'name' => 'Test Team',
            'station_name' => 'Colombo',
            'status' => 'available',
            'is_active' => true,
        ]);

        $citizen = $this->userWithRole('citizen');
        $incident = Incident::query()->create([
            'public_id' => 'SL-55555',
            'incident_type_id' => $type->id,
            'severity' => 'high',
            'status' => 'assigned',
            'description' => 'Bridge flooded.',
            'location_text' => 'Gampaha',
            'reported_by_user_id' => $citizen->id,
            'assigned_team_id' => $team->id,
        ]);
        $incident->load(['incidentType', 'reporter', 'assignedTeam']);

        $event = new IncidentChanged($incident, 'assigned');
        $channelNames = collect($event->broadcastOn())->map(fn ($channel) => $channel->name)->all();

        $this->assertContains('incidents.public', $channelNames);
        $this->assertContains('private-admin.incidents', $channelNames);
        $this->assertContains('private-rescue.team.'.$team->id, $channelNames);
        $this->assertContains('private-citizen.'.$citizen->id, $channelNames);
    }

    private function userWithRole(string $roleName): User
    {
        $user = User::factory()->create(['is_active' => true]);
        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user->roles()->attach($role);

        return $user;
    }
}
