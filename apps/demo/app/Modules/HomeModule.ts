import { Module } from "@zentify/core";
import { HomeController } from "../Controllers/Home.js";
import { HomeService } from "../Services/HomeService.js";
import { AuthService } from "../Services/AuthService.js";
import { AppConfig } from "../Config/AppConfig.js";
import { User } from "../Models/User.js";

@Module({
    controllers:[HomeController],
    providers:[HomeService, AuthService, AppConfig],
    entities:[User]
})
export class HomeModule{}