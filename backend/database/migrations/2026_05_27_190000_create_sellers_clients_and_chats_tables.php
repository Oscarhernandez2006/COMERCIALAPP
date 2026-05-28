<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique()->nullable();      // código interno del vendedor en el ERP
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('zone')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 10)->default('NIT');    // NIT | CC | CE | PAS
            $table->string('document_number', 30)->unique();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->foreignId('seller_id')->nullable()->constrained('sellers')->nullOnDelete();
            $table->string('source', 20)->default('manual');        // manual | erp | chat
            $table->boolean('synced_with_erp')->default(false);
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['document_type', 'document_number']);
        });

        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained('sellers')->nullOnDelete();
            $table->string('status', 20)->default('bot');           // bot | waiting_human | human | closed
            $table->boolean('client_in_erp')->default(true);        // false => avisar al vendedor que debe darlo de alta
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['seller_id', 'status']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $table->string('sender', 20);   // client | bot | seller | system
            $table->unsignedBigInteger('sender_id')->nullable();    // seller_id si sender=seller
            $table->text('body');
            $table->json('metadata')->nullable();                   // productos sugeridos, intent, etc.
            $table->timestamp('created_at')->useCurrent();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('sellers');
    }
};
