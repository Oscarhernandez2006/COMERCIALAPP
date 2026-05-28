<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('created_at');
            $table->index(['conversation_id', 'sender', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id', 'sender', 'read_at']);
            $table->dropColumn('read_at');
        });
    }
};
