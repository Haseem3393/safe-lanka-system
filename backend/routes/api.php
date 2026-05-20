<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\IncidentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => \App\Support\ApiResponse::success([
        'service' => 'safe-lanka-api',
        'status' => 'healthy',
    ], 'Safe Lanka API is healthy.'));

    Route::prefix('auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login']);
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
        Route::get('/incidents', [IncidentController::class, 'index']);
        Route::get('/incidents/{incident}', [IncidentController::class, 'show']);
        Route::post('/incidents', [IncidentController::class, 'store']);
        Route::patch('/incidents/{incident}', [IncidentController::class, 'update']);
        Route::post('/incidents/{incident}/assign', [IncidentController::class, 'assign']);
        Route::post('/incidents/{incident}/status', [IncidentController::class, 'updateStatus']);
    });

    Route::middleware(['auth:sanctum', 'role:rescue'])->prefix('rescue')->group(function (): void {
        Route::get('/incidents', [IncidentController::class, 'index']);
        Route::get('/incidents/{incident}', [IncidentController::class, 'show']);
        Route::post('/incidents/{incident}/status', [IncidentController::class, 'updateStatus']);
    });

    Route::middleware(['auth:sanctum', 'role:citizen'])->prefix('citizen')->group(function (): void {
        Route::get('/incidents', [IncidentController::class, 'index']);
        Route::post('/incidents', [IncidentController::class, 'store']);
        Route::get('/incidents/{incident}', [IncidentController::class, 'show']);
    });
});
