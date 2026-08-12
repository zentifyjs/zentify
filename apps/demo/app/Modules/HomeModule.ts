import { Module } from "@zify/core";
import { HomeController } from "../Controllers/Home";

@Module({
    controllers:[HomeController],
    providers:[]
})
export class HomeModule{}