import { Module } from "@zentify/core";
import { UserController } from "../Controllers/UserController.js";
import { UserService } from "../Services/UserService.js";
import { RequestContextService } from "../Services/RequestContextService.js";
import { User } from "../Models/User.js";
import { AdminService } from "../Services/AdminService.js";
import { Admin } from "../Models/Admin.js";

@Module({
  controllers: [UserController],
  providers: [UserService, AdminService, RequestContextService],
  entities: [User, Admin],
})
export class UserModule {}
