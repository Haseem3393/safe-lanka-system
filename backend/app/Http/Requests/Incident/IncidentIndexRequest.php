<?php

namespace App\Http\Requests\Incident;

use Illuminate\Foundation\Http\FormRequest;

class IncidentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'string', 'in:pending,assigned,in_progress,on_the_way,arrived,rescued,completed,resolved'],
            'severity' => ['sometimes', 'string', 'in:low,medium,high,critical'],
            'incident_type_id' => ['sometimes', 'integer', 'exists:incident_types,id'],
            'assigned_team_id' => ['sometimes', 'integer', 'exists:rescue_teams,id'],
            'created_from' => ['sometimes', 'date'],
            'created_to' => ['sometimes', 'date'],
        ];
    }
}
