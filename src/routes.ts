import { Route } from "./core/router/route";
import { FileController } from "./test/file";
import { HaloMiddleware } from "./test/halo";
import { UserController } from "./test/user";

Route.controller(FileController, [new HaloMiddleware()]);
Route.controller(UserController);
