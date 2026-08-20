import { Authenticatable } from "@zentify/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Admin implements Authenticatable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ name: "password", nullable: true, type: "varchar", length: 255 })
  password!: string;

  getAuthIdentifier() {
    return this.email;
  }

  getAuthPassword() {
    return this.password;
  }
}
