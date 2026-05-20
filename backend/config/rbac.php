<?php

return [
    'roles' => [
        'admin' => [
            'label' => 'Government Admin',
            'permissions' => [
                'incident.view.any',
                'incident.assign',
                'incident.update.status',
                'shelter.manage',
                'analytics.view',
                'user.view',
            ],
        ],
        'rescue' => [
            'label' => 'Rescue Team',
            'permissions' => [
                'incident.view.assigned',
                'incident.update.status.assigned',
            ],
        ],
        'citizen' => [
            'label' => 'Citizen',
            'permissions' => [
                'incident.create',
                'incident.view.own',
                'shelter.view',
                'map.view.public',
            ],
        ],
    ],
];
