import { Route } from "@zentify/core";
import { HomeModule } from "../Modules/HomeModule.js";
import { AuthModule } from "../Modules/AuthModule.js";

// Web routes
Route.module(HomeModule)
Route.module(AuthModule)
