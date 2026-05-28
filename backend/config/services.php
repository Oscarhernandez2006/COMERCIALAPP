<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'azure_openai' => [
        'endpoint' => env('AZURE_OPENAI_ENDPOINT'),          // https://xxx.openai.azure.com
        'api_key' => env('AZURE_OPENAI_API_KEY'),
        'deployment' => env('AZURE_OPENAI_DEPLOYMENT'),      // ej: gpt-4o-mini
        'api_version' => env('AZURE_OPENAI_API_VERSION', '2025-04-01-preview'),
        'max_tokens' => (int) env('AZURE_OPENAI_MAX_TOKENS', 350),
        'temperature' => (float) env('AZURE_OPENAI_TEMPERATURE', 0.4),
        'verify_ssl' => filter_var(env('AZURE_OPENAI_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN),
    ],

];
