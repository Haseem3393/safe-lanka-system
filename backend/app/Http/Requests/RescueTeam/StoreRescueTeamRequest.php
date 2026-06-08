<?php

namespace App\Http\Requests\RescueTeam;

use Illuminate\Foundation\Http\FormRequest;

class StoreRescueTeamRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'station_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', 'string', 'in:available,assigned,busy'],
            'default_eta_minutes' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
