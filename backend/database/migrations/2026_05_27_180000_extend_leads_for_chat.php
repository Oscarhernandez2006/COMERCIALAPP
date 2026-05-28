<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('source', 30)->default('form')->after('status'); // form | chat
            $table->string('session_id')->nullable()->after('source');
            $table->json('chat_transcript')->nullable()->after('session_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['source', 'session_id', 'chat_transcript']);
        });
    }
};
