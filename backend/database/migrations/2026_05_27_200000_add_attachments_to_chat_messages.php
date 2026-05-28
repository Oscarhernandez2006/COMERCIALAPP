<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('type', 20)->default('text')->after('sender_id');
            $table->string('attachment_path')->nullable()->after('body');
            $table->string('attachment_name')->nullable()->after('attachment_path');
            $table->string('attachment_mime', 120)->nullable()->after('attachment_name');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime');
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'attachment_path', 'attachment_name', 'attachment_mime', 'attachment_size']);
        });
    }
};
