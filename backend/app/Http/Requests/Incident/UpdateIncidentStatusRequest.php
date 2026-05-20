<?php

namespace App\Http\Requests\Incident;

use App\Models\Incident;
use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentStatusRequest extends FormRequest
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
            'status' => ['required', 'string', 'in:'.implode(',', Incident::ALLOWED_STATUSES)],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
