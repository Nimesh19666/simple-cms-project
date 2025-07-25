<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // This line tells Laravel to run your UserSeeder file.
        $this->call([
            UserSeeder::class,
        ]);
    }
}
