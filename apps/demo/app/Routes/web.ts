import { Route } from "@zentify/core";
import { HomeModule } from "../Modules/HomeModule.js";
import { UserModule } from "../Modules/UserModule.js";
import { TodoModule } from "../Modules/TodoModule.js";

// Web routes
Route.module(HomeModule)
Route.module(UserModule)
Route.module(TodoModule)