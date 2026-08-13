import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { UserSeeder } from "./UserSeeder.js";

export class DatabaseSeeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        // Panggil semua seeder Anda di sini secara berurutan
        
        // Contoh:
        await new UserSeeder().run(app);
        
        console.log("Database seeded successfully!");
    }
}
