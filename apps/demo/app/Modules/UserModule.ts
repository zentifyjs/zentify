import { Module } from "@zentify/core";
import { UserController } from "../Controllers/UserController.js";
import { UserService } from "../Services/UserService.js";
import { User } from "../Models/User.js";

@Module({
    controllers: [UserController],
    providers: [UserService],
    entities: [User]
})
export class UserModule {}
