import { Column, MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class Todo1786800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "todo",
                columns: [
                    new TableColumn({
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    }),
                    new TableColumn({
                        name: "title",
                        type: "varchar",
                        length: "255",
                    }),
                    new TableColumn({
                        name: "is_done",
                        type: "boolean",
                        default: false,
                    }),
                    new TableColumn({
                        name: "user_id",
                        type: "int",
                    }),
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            "todo",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("todo", true, true, true);
    }
}