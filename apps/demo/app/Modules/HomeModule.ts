import { Module } from "@zentify/core";
import { HomeController } from "../Controllers/Home.js";
import { HomeService } from "../Services/HomeService.js";
import { AuthService } from "../Services/AuthService.js";

@Module({
    controllers:[HomeController],
    providers:[HomeService, AuthService]
})
export class HomeModule{}