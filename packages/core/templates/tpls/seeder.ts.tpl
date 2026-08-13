import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { DataSource } from "typeorm";

export class {{name}}Seeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        // Anda bebas memanggil Container apapun!
        const dataSource = app.container.resolve(DataSource);
        
        // Contoh:
        // const userRepository = dataSource.getRepository(User);
        // await userRepository.save({ ... });
        
        console.log("Seeding {{name}}...");
    }
}
