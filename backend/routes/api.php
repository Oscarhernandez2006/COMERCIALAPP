<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ChatController as AdminChatController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Api\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\PublicApi\CategoryController;
use App\Http\Controllers\Api\PublicApi\ChatController;
use App\Http\Controllers\Api\PublicApi\GalleryController;
use App\Http\Controllers\Api\PublicApi\LeadController;
use App\Http\Controllers\Api\PublicApi\ProductController;
use App\Http\Controllers\Api\PublicApi\PromotionController;
use App\Http\Controllers\Api\PublicApi\SettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['message' => 'pong from Laravel', 'time' => now()->toIso8601String()]);

/*
|--------------------------------------------------------------------------
| API pública (portal de clientes)
|--------------------------------------------------------------------------
*/
Route::prefix('public')->group(function () {
    Route::get('settings', [SettingController::class, 'index']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);
    Route::get('promotions', [PromotionController::class, 'index']);
    Route::get('gallery', [GalleryController::class, 'index']);
    Route::post('leads', [LeadController::class, 'store']);
    Route::post('chat', [ChatController::class, 'send']);
    Route::get('chat/{sessionId}/messages', [ChatController::class, 'messages']);
    Route::post('chat/{sessionId}/upload', [ChatController::class, 'upload']);
});

/*
|--------------------------------------------------------------------------
| Autenticación admin (Sanctum tokens)
|--------------------------------------------------------------------------
*/
Route::post('admin/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('dashboard', DashboardController::class);

    Route::apiResource('categories', AdminCategoryController::class);
    Route::apiResource('products', AdminProductController::class);
    Route::apiResource('promotions', AdminPromotionController::class);
    Route::apiResource('media', AdminMediaController::class)->except(['show']);

    Route::get('settings', [AdminSettingController::class, 'index']);
    Route::put('settings', [AdminSettingController::class, 'update']);
    Route::post('settings/logo', [AdminSettingController::class, 'uploadLogo']);

    Route::get('leads', [AdminLeadController::class, 'index']);
    Route::patch('leads/{lead}', [AdminLeadController::class, 'update']);
    Route::delete('leads/{lead}', [AdminLeadController::class, 'destroy']);

    Route::get('chats', [AdminChatController::class, 'index']);
    Route::get('chats/{chat}', [AdminChatController::class, 'show']);
    Route::post('chats/{chat}/reply', [AdminChatController::class, 'reply']);
    Route::post('chats/{chat}/upload', [AdminChatController::class, 'upload']);
    Route::post('chats/{chat}/take', [AdminChatController::class, 'take']);
    Route::post('chats/{chat}/close', [AdminChatController::class, 'close']);
    Route::post('chats/{chat}/typing', [AdminChatController::class, 'typing']);
    Route::post('chats/{chat}/read', [AdminChatController::class, 'read']);
});

Route::get('/user', fn (Request $request) => $request->user())->middleware('auth:sanctum');
