import { Body, Controller, Get, Post, render, redirect } from "@zentify/core";
import { AuthMiddleware, AuthUser } from "@zentify/auth";
import { TodoService } from "../Services/TodoService.js";
import { User } from "../Models/User.js";

@Controller({ path: "/todos" })
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get("/")
  async index(@AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");

    const todos = await this.todoService.getUserTodos(user.id);
    return render("Todos/Index", { title: "Todo List", todos });
  }

  @Post("/create")
  async create(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title) {
      await this.todoService.create(user.id, title);
    }
    return redirect("/todos");
  }

  @Post("/toggle")
  async toggle(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");

    const id = parseInt(body.id, 10);
    if (id) {
      await this.todoService.toggle(id, user.id);
    }
    return redirect("/todos");
  }

  @Post("/update")
  async update(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");

    const id = parseInt(body.id, 10);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (id && title) {
      await this.todoService.update(id, user.id, title);
    }
    return redirect("/todos");
  }

  @Post("/delete")
  async destroy(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");

    const id = parseInt(body.id, 10);
    if (id) {
      await this.todoService.remove(id, user.id);
    }
    return redirect("/todos");
  }
}
