<?php

namespace App\Http\Requests\Incident;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentRequest extends FormRequest
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
            'incident_type_id' => ['sometimes', 'integer', 'exists:incident_types,id'],
            'severity' => ['sometimes', 'string', 'in:low,medium,high,critical'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'location_text' => ['sometimes', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
