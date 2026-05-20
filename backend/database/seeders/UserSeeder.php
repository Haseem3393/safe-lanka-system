<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'System Admin', 'email' => 'admin@safelanka.lk', 'password' => 'secret123', 'phone' => '+94 77 111 0001', 'role' => 'admin'],
            ['name' => 'Rescue Officer', 'email' => 'rescue@safelanka.lk', 'password' => 'secret123', 'phone' => '+94 77 111 0002', 'role' => 'rescue'],
            ['name' => 'Citizen User', 'email' => 'citizen@safelanka.lk', 'password' => 'secret123', 'phone' => '+94 77 111 0003', 'role' => 'citizen'],
        ];

        foreach ($users as $record) {
            $user = User::query()->updateOrCreate(
                ['email' => $record['email']],
                [
                    'name' => $record['name'],
                    'password' => $record['password'],
                    'phone' => $record['phone'],
                    'is_active' => true,
                ]
            );

            $roleId = Role::query()->where('name', $record['role'])->value('id');

            if ($roleId) {
                $user->roles()->syncWithoutDetaching([$roleId]);
            }
        }
    }
}
