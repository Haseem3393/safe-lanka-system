<?php

namespace Database\Seeders;

use App\Models\RescueTeam;
use App\Models\RescueTeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class RescueTeamMemberSeeder extends Seeder
{
    public function run(): void
    {
        $rescueUser = User::query()->where('email', 'rescue@safelanka.lk')->first();
        $team = RescueTeam::query()->where('name', 'Flood Rapid Boat Team')->first();

        if (! $rescueUser || ! $team) {
            return;
        }

        RescueTeamMember::query()->updateOrCreate(
            ['user_id' => $rescueUser->id],
            [
                'rescue_team_id' => $team->id,
                'name' => $rescueUser->name,
                'phone' => $rescueUser->phone,
                'position' => 'Team Lead',
                'is_active' => true,
            ]
        );
    }
}
