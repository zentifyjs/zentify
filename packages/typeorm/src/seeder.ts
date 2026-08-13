import type { Zentify } from "@zentify/core";

export interface Seeder {
    run(app: Zentify): Promise<void>;
}
