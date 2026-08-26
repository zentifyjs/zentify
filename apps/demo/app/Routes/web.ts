import { Route } from "@zentify/core";
import { HomeModule } from "../Modules/HomeModule";
import { AuthModule } from "../Modules/AuthModule";
import { UserModule } from "../Modules/UserModule";

// Web routes
Route.module(HomeModule);
Route.module(AuthModule);
Route.module(UserModule);
