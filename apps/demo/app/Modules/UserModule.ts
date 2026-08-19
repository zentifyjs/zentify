import { Module } from "@zentify/core";
import { UserController } from "../Controllers/UserController.js";
import { UserService } from "../Services/UserService.js";
import { RequestContextService } from "../Services/RequestContextService.js";
import { User } from "../Models/User.js";

@Module({
  controllers: [UserController],
  providers: [UserService, RequestContextService],
  entities: [User],
})
export class UserModule {}
