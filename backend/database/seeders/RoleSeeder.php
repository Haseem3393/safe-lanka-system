<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = config('rbac.roles', []);

        foreach ($definitions as $name => $meta) {
            Role::query()->updateOrCreate(
                ['name' => $name],
                ['label' => $meta['label'] ?? ucfirst($name)]
            );
        }
    }
}
