import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { DataSource } from "typeorm";
import { User } from "../../Models/User.js";

export class UserSeeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        // Anda bebas memanggil Container apapun!
        const dataSource: DataSource = app.container.resolve(DataSource);
        const userRepo = dataSource.getRepository(User)
        await userRepo.save({
            name: "TEST",
            email: "test@gmail.com"
        })
        
        // Contoh:
        // const userRepository = dataSource.getRepository(User);
        // await userRepository.save({ ... });
        
        console.log("Seeding User...");
    }
}
