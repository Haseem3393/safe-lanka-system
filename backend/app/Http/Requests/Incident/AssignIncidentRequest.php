<?php

namespace App\Http\Requests\Incident;

use Illuminate\Foundation\Http\FormRequest;

class AssignIncidentRequest extends FormRequest
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
            'rescue_team_id' => ['required', 'integer', 'exists:rescue_teams,id'],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
