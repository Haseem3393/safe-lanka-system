<?php

namespace Database\Seeders;

use App\Models\RescueTeam;
use Illuminate\Database\Seeder;

class RescueTeamSeeder extends Seeder
{
    public function run(): void
    {
        $teams = [
            ['name' => 'Hill Rescue Unit', 'station_name' => 'Kandy Station', 'contact_phone' => '+94 81 222 4411', 'status' => 'available', 'default_eta_minutes' => 8],
            ['name' => 'Fire Response Alpha', 'station_name' => 'Gampaha Station', 'contact_phone' => '+94 33 221 1001', 'status' => 'available', 'default_eta_minutes' => 11],
            ['name' => 'Flood Rapid Boat Team', 'station_name' => 'Colombo Dock', 'contact_phone' => '+94 11 255 4001', 'status' => 'available', 'default_eta_minutes' => 5],
        ];

        foreach ($teams as $team) {
            RescueTeam::query()->updateOrCreate(
                ['name' => $team['name']],
                $team
            );
        }
    }
}
