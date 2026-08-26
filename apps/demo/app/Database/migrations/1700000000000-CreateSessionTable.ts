import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionTable1700000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query("DROP TABLE sessions");
  }
}
