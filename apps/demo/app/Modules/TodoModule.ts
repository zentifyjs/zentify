import { Module } from "@zentify/core";
import { TodoController } from "../Controllers/TodoController.js";
import { TodoService } from "../Services/TodoService.js";
import { Todo } from "../Models/Todo.js";
import { AuthMiddleware } from "@zentify/auth";

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  entities: [Todo],
  middleware: [
    {
      middlewares: [new AuthMiddleware({ guard: "web", redirectTo: "/login" })],
    },
  ],
})
export class TodoModule {}
