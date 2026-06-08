<?php

use App\Http\Middleware\EnsureRole;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
        ]);
        // Apply CORS globally (including OPTIONS preflight) not just to api group
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $e) {
            return ApiResponse::error('Validation failed.', $e->errors(), 422);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return ApiResponse::error('Unauthenticated.', [], 401);
        });

        $exceptions->render(function (AuthorizationException $e) {
            return ApiResponse::error('Forbidden.', [], 403);
        });

        $exceptions->render(function (NotFoundHttpException $e) {
            return ApiResponse::error('Resource not found.', [], 404);
        });

        $exceptions->render(function (\Throwable $e) {
            report($e);

            return ApiResponse::error('Server error.', [], 500);
        });
    })->create();
