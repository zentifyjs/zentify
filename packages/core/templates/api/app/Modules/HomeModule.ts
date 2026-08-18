import { Module } from "@zentify/core";
import { HomeController } from "../Controllers/Home.js";
import { HomeService } from "../Services/HomeService.js";
import { AuthService } from "../Services/AuthService.js";
import { AppConfig } from "../Config/AppConfig.js";

@Module({
    controllers:[HomeController],
    providers:[HomeService, AuthService, AppConfig]
})
export class HomeModule{}