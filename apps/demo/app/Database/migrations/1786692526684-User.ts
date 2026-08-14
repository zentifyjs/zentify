import { Column, MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

export class User1786692526684 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`...`);
        await queryRunner.createTable(
            new Table(
                {
                    name: "users",
                    columns: [
                        new TableColumn({
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment",
                        }),
                        new TableColumn({
                            name: "username",
                            type: "varchar"
                        }),
                        new TableColumn({
                            name: "password",
                            type: "varchar"
                        }),
                        new TableColumn({
                            name: "email",
                            type: "varchar"
                        })
                    ]
                }
            ),
            true
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`...`);
        await queryRunner.dropTable("users", true, true, true)
    }
}
