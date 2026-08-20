import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { Todo } from "../Models/Todo.js";

@Dependency()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async getUserTodos(userId: number) {
    return await this.todoRepository.find({
      where: { userId },
      order: { id: "DESC" },
    });
  }

  async create(userId: number, title: string) {
    const todo = this.todoRepository.create({ userId, title });
    return await this.todoRepository.save(todo);
  }

  async toggle(id: number, userId: number) {
    const todo = await this.todoRepository.findOneBy({ id, userId });
    if (!todo) return null;

    todo.isDone = !todo.isDone;
    return await this.todoRepository.save(todo);
  }

  async update(id: number, userId: number, title: string) {
    const todo = await this.todoRepository.findOneBy({ id, userId });
    if (!todo) return null;

    todo.title = title;
    return await this.todoRepository.save(todo);
  }

  async remove(id: number, userId: number) {
    return await this.todoRepository.delete({ id, userId });
  }
}