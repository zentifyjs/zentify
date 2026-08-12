import { Route, Zify, Controller, Post, Module, Dependency, Body } from "@zify/core";
import * as v from "valibot";

const port = 3004;
const host = "127.0.0.1";

const app = new Zify({
  server: { port, host },
});

// A complex DTO Schema using Zod
class CreateUserDto {
  static schema = v.object({
    username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
    email: v.pipe(v.string(), v.email()),
    age: v.pipe(v.number(), v.integer(), v.minValue(18), v.maxValue(100)),
    address: v.object({
      street: v.string(),
      city: v.string(),
      country: v.string()
    }),
    tags: v.pipe(v.array(v.string()), v.maxLength(10))
  });

  username!: string;
  email!: string;
  age!: number;
  address!: {
    street: string;
    city: string;
    country: string;
  };
  tags!: string[];
}

@Dependency()
class DatabaseService {
    async saveUser(user: CreateUserDto) {
        // Simulate a heavy operation or DB save
        return {
            id: Math.random().toString(36).substring(7),
            ...user,
            createdAt: new Date().toISOString()
        };
    }
}

@Controller({ path: "users" })
class UserController {
    constructor(private readonly db: DatabaseService) {}

    @Post()
    async create(@Body() user: CreateUserDto) {
        // Validation happens automatically before reaching here
        const savedUser = await this.db.saveUser(user);
        
        return { 
            message: "User created successfully",
            data: savedUser 
        };
    }
}

@Module({
    controllers: [UserController],
    providers: [DatabaseService]
})
class UserModule {}

Route.module(UserModule);

app.run();
