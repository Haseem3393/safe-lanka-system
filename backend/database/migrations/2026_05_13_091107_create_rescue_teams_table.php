<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rescue_teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('station_name');
            $table->string('contact_phone', 30)->nullable();
            $table->enum('status', ['available', 'assigned', 'busy'])->default('available');
            $table->unsignedSmallInteger('default_eta_minutes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rescue_teams');
    }
};
