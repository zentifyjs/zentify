import { Module } from "@zentify/core";
import { HomeController } from "../Controllers/Home.js";
import { HomeService } from "../Services/HomeService.js";
import { AuthService } from "../Services/AuthService.js";
import { User } from "../Models/User.js";

@Module({
    controllers:[HomeController],
    providers:[HomeService, AuthService],
    entities:[User]
})
export class HomeModule{}