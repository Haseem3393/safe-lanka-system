<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shelter\StoreShelterRequest;
use App\Models\Shelter;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShelterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shelter::query()->where('is_active', true);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location_text', 'like', "%{$search}%");
            });
        }

        $shelters = $query->latest()->paginate(
            (int) $request->input('per_page', 20)
        );

        return ApiResponse::success([
            'items' => $shelters->items(),
            'pagination' => [
                'current_page' => $shelters->currentPage(),
                'per_page' => $shelters->perPage(),
                'total' => $shelters->total(),
                'last_page' => $shelters->lastPage(),
            ],
        ], 'Shelters fetched.');
    }

    public function store(StoreShelterRequest $request): JsonResponse
    {
        $shelter = Shelter::query()->create($request->validated());

        return ApiResponse::success([
            'shelter' => $shelter,
        ], 'Shelter created.', 201);
    }

    public function show(Shelter $shelter): JsonResponse
    {
        return ApiResponse::success([
            'shelter' => $shelter,
        ], 'Shelter fetched.');
    }

    public function update(StoreShelterRequest $request, Shelter $shelter): JsonResponse
    {
        $shelter->fill($request->validated())->save();

        return ApiResponse::success([
            'shelter' => $shelter->fresh(),
        ], 'Shelter updated.');
    }

    public function destroy(Shelter $shelter): JsonResponse
    {
        $shelter->update(['is_active' => false]);

        return ApiResponse::success([], 'Shelter deactivated.');
    }
}
