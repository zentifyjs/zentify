# Zentify - Panduan Lengkap Penggunaan

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Struktur Project](#2-struktur-project)
3. [CLI Commands](#3-cli-commands)
4. [Cara Membuat Component](#4-cara-membuat-component)
5. [Decorators Reference](#5-decorators-reference)
6. [Dependency Injection](#6-dependency-injection)
7. [Routing](#7-routing)
8. [Authentication & Guards](#8-authentication--guards)
9. [Database (TypeORM)](#9-database-typeorm)
10. [DTO Validation (Valibot)](#10-dto-validation-valibot)
11. [Views (React + Vite)](#11-views-react--vite)
12. [Configuration](#12-configuration)
13. [Contoh Lengkap: CRUD Feature](#13-contoh-lengkap-crud-feature)
14. [Tips & Best Practices](#14-tips--best-practices)

---

## 1. Pendahuluan

Zentify adalah framework Node.js fullstack yang mengintegrasikan:

- **Backend**: TypeScript dengan dependency injection (NestJS-style)
- **ORM**: TypeORM (PostgreSQL / MySQL)
- **Frontend**: React + Vite (SSR-compatible)
- **Auth**: Session-based authentication dengan multiple guards
- **Validation**: Valibot untuk DTO/schema validation

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| DI System | Custom (NestJS-style decorators) |
| ORM | TypeORM |
| Database | PostgreSQL / MySQL |
| View Engine | Vite + React |
| Client Hooks | `@zentify/react` |
| Auth | `@zentify/auth` (session + bcrypt) |
| Validation | Valibot |

---

## 2. Struktur Project

```
your-app/
├── app/
│   ├── index.ts                 ← Entry point bootstrap
│   ├── Config/
│   │   └── AppConfig.ts         ← Konfigurasi dengan @Configuration + @Env
│   ├── Controllers/
│   │   ├── Home.ts              ← Controller
│   │   ├── UserController.ts
│   │   └── dto/
│   │       ├── HomeDTO.ts       ← Data Transfer Object
│   │       └── UserDTO.ts
│   ├── Database/
│   │   ├── migrations/          ← TypeORM migrations
│   │   └── seeders/             ← Database seeders
│   ├── Models/
│   │   ├── User.ts              ← TypeORM entities
│   │   └── Todo.ts
│   ├── Modules/
│   │   ├── HomeModule.ts        ← Module declarations
│   │   ├── UserModule.ts
│   │   └── TodoModule.ts
│   ├── Routes/
│   │   └── web.ts               ← Route registration
│   ├── Services/
│   │   ├── HomeService.ts       ← Business logic
│   │   ├── UserService.ts
│   │   └── TodoService.ts
│   └── Views/
│       ├── main.tsx             ← React client entry
│       ├── global.css
│       └── Pages/
│           ├── Index.tsx        ← Page components
│           ├── Login.tsx
│           ├── Todos/Index.tsx
│           └── Users/Index.tsx
├── .env
├── package.json
├── tsconfig.json
└── zentify.json
```

### Alur Kerja

```
index.ts
  → Route.module(HomeModule)
  → Route.module(UserModule)
  → Route.module(TodoModule)

Module
  → Controllers (route handlers)
  → Services    (business logic, DI)
  → Entities    (TypeORM models)

Controller method
  → @Get / @Post decorator → route path
  → @Body / @Query / @AuthUser → parameter injection
  → Service method → Repository → Database
  → render("PageName", data) → React view
```

---

## 3. CLI Commands

### Project Commands

```bash
# Buat project baru (interactive)
zentify new <name>

# Buat project baru (non-interactive)
zentify new <name> --type api --database postgres --auth

# Start dev server (hot-reload)
zentify dev

# Build untuk production
zentify build

# Build standalone (self-contained)
zentify build --standalone

# Start production server
zentify start
```

### Generator Commands

```bash
# Generate Controller
zentify make:controller <Name>
# → app/Controllers/<Name>Controller.ts

# Generate Service
zentify make:service <Name>
# → app/Services/<Name>Service.ts

# Generate Model/Entity
zentify make:model <Name>
# → app/Models/<Name>.ts

# Generate Module (Controller + Service + Model + Module sekaligus)
zentify make:module <Name>
# → app/Controllers/<Name>Controller.ts
# → app/Services/<Name>Service.ts
# → app/Models/<Name>.ts
# → app/Modules/<Name>Module.ts

# Generate Migration
zentify make:migration <Name>
# → app/Database/migrations/<timestamp>-<Name>.ts

# Generate Seeder
zentify make:seeder <Name>
# → app/Database/seeders/<Name>Seeder.ts
```

### Database Commands

```bash
# Run pending migrations
zentify migrate:run

# Revert last migration
zentify migrate:revert

# Drop all tables + re-run migrations
zentify migrate:fresh

# Run all seeders
zentify db:seed

# Run specific seeder
zentify db:seed -c UserSeeder
```

---

## 4. Cara Membuat Component

### 4.1 Membuat Controller

**Via CLI:**
```bash
zentify make:controller Product
```

**Template yang dihasilkan:**
```typescript
import { Controller, Get } from "@zentify/core";

@Controller("/product")
export class ProductController {
  @Get("/")
  public index() {
    return { message: "Hello from ProductController" };
  }
}
```

**Manual (lengkap):**
```typescript
import { Controller, Get, Post, Body, Query, render, redirect } from "@zentify/core";
import { ProductService } from "../Services/ProductService.js";

@Controller({ path: "/products" })
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  @Get("/")
  async index(@Query() query: any) {
    const page = parseInt(query.page || "1", 10);
    const products = await this.productService.getPaginated(page, 10);
    return render("Products/Index", { title: "Products", ...products });
  }

  @Post("/create")
  async create(@Body() body: any) {
    await this.productService.create(body);
    return redirect("/products");
  }
}
```

**Setelah membuat controller, jangan lupa:**
1. Buat Service-nya
2. Buat Entity/Model-nya
3. Buat Module-nya
4. Register module di `Routes/web.ts`

---

### 4.2 Membuat Service

**Via CLI:**
```bash
zentify make:service Product
```

**Template yang dihasilkan:**
```typescript
export class ProductService {
  constructor() {
    // Initialization
  }

  public doSomething() {
    return "Action performed by ProductService";
  }
}
```

**Manual (lengkap dengan database):**
```typescript
import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { Product } from "../Models/Product.js";

@Dependency()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getPaginated(page: number, limit: number) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "DESC" },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: number) {
    return await this.productRepository.findOneBy({ id });
  }

  async create(data: Partial<Product>) {
    const product = this.productRepository.create(data);
    return await this.productRepository.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    await this.productRepository.update(id, data);
    return this.getById(id);
  }

  async delete(id: number) {
    return await this.productRepository.delete(id);
  }
}
```

**Penting:** Service HARUS di-decorate dengan `@Dependency()` agar bisa di-inject.

---

### 4.3 Membuat Model/Entity

**Via CLI:**
```bash
zentify make:model Product
```

**Template yang dihasilkan:**
```typescript
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id!: number;
}
```

**Manual (lengkap):**
```typescript
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User.js";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ name: "stock", type: "int", default: 0 })
  stock!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
```

**Catatan:**
- Model tidak perlu suffix "Model" (cukup nama entity, misal `Product`, bukan `ProductModel`)
- Gunakan `@Column({ name: "column_name" })` untuk snake_case column names
- Gunakan `@ManyToOne` / `@JoinColumn` untuk relationships

---

### 4.4 Membuat Module

**Via CLI (recommended - generate semua sekaligus):**
```bash
zentify make:module Product
# → Generate ProductController, ProductService, Product, ProductModule
```

**Template yang dihasilkan:**
```typescript
import { Module } from "@zentify/core";
import { ProductController } from "../Controllers/ProductController";
import { ProductService } from "../Services/ProductService";
import { Product } from "../Models/Product";

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  entities: [Product]
})
export class ProductModule {}
```

**Manual:**
```typescript
import { Module } from "@zentify/core";
import { ProductController } from "../Controllers/ProductController.js";
import { ProductService } from "../Services/ProductService.js";
import { Product } from "../Models/Product.js";

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  entities: [Product],
})
export class ProductModule {}
```

**Setelah membuat module, register di `Routes/web.ts`:**
```typescript
import { Route } from "@zentify/core";
import { ProductModule } from "../Modules/ProductModule.js";

Route.module(ProductModule)
```

---

### 4.5 Membuat Migration

**Via CLI:**
```bash
zentify make:migration CreateProductsTable
# → app/Database/migrations/<timestamp>-CreateProductsTable.ts
```

**Isi migration:**
```typescript
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateProductsTable1786800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "product",
                columns: [
                    new TableColumn({
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    }),
                    new TableColumn({
                        name: "name",
                        type: "varchar",
                        length: "255",
                    }),
                    new TableColumn({
                        name: "price",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    }),
                    new TableColumn({
                        name: "user_id",
                        type: "int",
                    }),
                ],
            }),
            true,
        );

        // Foreign key
        await queryRunner.createForeignKey(
            "product",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("product", true, true, true);
    }
}
```

**Jalankan migration:**
```bash
zentify migrate:run
```

---

### 4.6 Membuat Seeder

**Via CLI:**
```bash
zentify make:seeder Product
# → app/Database/seeders/ProductSeeder.ts
# → Juga membuat DatabaseSeeder.ts jika belum ada
```

**Isi seeder:**
```typescript
import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { DataSource } from "typeorm";
import { Product } from "../../Models/Product.js";

export class ProductSeeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        const dataSource: DataSource = app.container.resolve(DataSource);
        const productRepo = dataSource.getRepository(Product);

        await productRepo.save([
            { name: "Product A", price: 100000, userId: 1 },
            { name: "Product B", price: 250000, userId: 1 },
        ]);

        console.log("Seeding Product...");
    }
}
```

**Register di DatabaseSeeder:**
```typescript
import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { UserSeeder } from "./UserSeeder.js";
import { ProductSeeder } from "./ProductSeeder.js";

export class DatabaseSeeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        await new UserSeeder().run(app);
        await new ProductSeeder().run(app);

        console.log("Database seeded successfully!");
    }
}
```

**Jalankan seeder:**
```bash
zentify db:seed
zentify db:seed -c ProductSeeder   # specific seeder
```

---

## 5. Decorators Reference

### 5.1 Dari `@zentify/core`

| Decorator | Tempat | Fungsi | Contoh |
|-----------|--------|--------|--------|
| `@Controller({ path })` | Class | Tandai sebagai controller dengan route prefix | `@Controller({ path: "/users" })` |
| `@Get(path)` | Method | Definisikan GET route | `@Get("/")` |
| `@Post(path)` | Method | Definisikan POST route | `@Post("/create")` |
| `@Body()` | Parameter | Inject request body | `@Body() body: any` |
| `@Query()` | Parameter | Inject URL query params | `@Query() query: any` |
| `@Res()` | Parameter | Inject raw response object | `@Res() res: any` |
| `@Inject(token)` | Parameter | Explicit DI by token | `@Inject(UserService) svc: UserService` |
| `@Module({...})` | Class | Declare module | `@Module({ controllers, providers, entities })` |
| `@Configuration()` | Class | Tandai sebagai config provider | `@Configuration() class AppConfig {}` |
| `@Env("KEY")` | Property | Map env variable ke property | `@Env("DB_HOST") dbHost!: string` |
| `@Dependency()` | Class | Tandai sebagai injectable service | `@Dependency() class UserService {}` |

**Import dari `@zentify/core`:**
```typescript
import {
  Controller, Get, Post, Body, Query, Res,
  Inject, Module, Configuration, Env, Dependency,
  render, redirect, Route, Zentify,
  UnauthorizedException, REQUEST_CONTEXT,
  ZentifyHttpContextService, Authenticatable,
} from "@zentify/core";
```

---

### 5.2 Dari `@zentify/auth`

| Decorator | Fungsi | Contoh |
|-----------|--------|--------|
| `@AuthUser("guard")` | Inject authenticated user untuk guard tertentu | `@AuthUser("web") user: User \| null` |
| `AuthMiddleware({ guard, redirectTo })` | Middleware enforce authentication | `new AuthMiddleware({ guard: "web", redirectTo: "/login" })` |

**Import dari `@zentify/auth`:**
```typescript
import { AuthManager, AuthMiddleware, AuthUser } from "@zentify/auth";
```

---

### 5.3 Dari `@zentify/typeorm`

| Decorator | Fungsi | Contoh |
|-----------|--------|--------|
| `@InjectRepository(Entity)` | Inject TypeORM repository | `@InjectRepository(User) repo: Repository<User>` |

**Import dari `@zentify/typeorm`:**
```typescript
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
```

---

### 5.4 Dari TypeORM

| Decorator | Fungsi | Contoh |
|-----------|--------|--------|
| `@Entity()` | Tandai sebagai database entity | `@Entity() export class User {}` |
| `@PrimaryGeneratedColumn()` | Auto-increment primary key | `@PrimaryGeneratedColumn() id!: number` |
| `@Column({...})` | Column definition | `@Column({ type: "varchar", length: 255 })` |
| `@ManyToOne(() => Entity)` | Many-to-one relationship | `@ManyToOne(() => User, { onDelete: "CASCADE" })` |
| `@JoinColumn({ name })` | Foreign key column | `@JoinColumn({ name: "user_id" })` |

---

## 6. Dependency Injection

Zentify menggunakan sistem DI mirip NestJS. Semua service di-resolve secara otomatis melalui constructor injection.

### Pattern Dasar

```typescript
@Dependency()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
}
```

### Cara Kerja

1. Decorator `@Dependency()` mendaftarkan class ke DI container
2. Parameter constructor di-resolve secara otomatis berdasarkan type
3. `@InjectRepository(Entity)` menginject TypeORM repository
4. `@Inject(token)` untuk explicit token-based injection

### Injection Tokens yang Tersedia

| Token | Package | Fungsi |
|-------|---------|--------|
| `@InjectRepository(Entity)` | `@zentify/typeorm` | Inject TypeORM repository |
| `@Inject(REQUEST_CONTEXT)` | `@zentify/core` | Inject request context (per-request scope) |
| `@Inject(AuthManager)` | `@zentify/auth` | Inject auth manager |
| Class reference | `@zentify/core` | Auto-resolved by type (e.g., `AppConfig`) |

### Contoh: Service dengan Multiple Dependencies

```typescript
@Dependency()
export class HomeService {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {}

  async createUser({ name, email }: { name: string; email: string }) {
    return await this.authService.create({ name, email });
  }

  getConfigInfo() {
    return {
      appName: this.config.appName,
      port: this.config.port,
    };
  }
}
```

### Contoh: Request Context Service

```typescript
@Dependency()
export class RequestContextService {
  constructor(
    @Inject(REQUEST_CONTEXT)
    private readonly ctx: ZentifyHttpContextService,
  ) {}

  describe() {
    const { req } = this.ctx.current();
    return {
      method: req.method,
      url: req.url,
      hasBody: req.body !== undefined,
    };
  }
}
```

---

## 7. Routing

### Route Registration

Semua routes didaftarkan di `Routes/web.ts`:

```typescript
import { Route } from "@zentify/core";
import { HomeModule } from "../Modules/HomeModule.js";
import { UserModule } from "../Modules/UserModule.js";
import { TodoModule } from "../Modules/TodoModule.js";

Route.module(HomeModule)
Route.module(UserModule)
Route.module(TodoModule)
```

### Path Resolution

Full path = Controller prefix + Method path

| Controller | Method Decorator | Full Path |
|-----------|-----------------|-----------|
| `@Controller({ path: "/users" })` | `@Get("/")` | `GET /users/` |
| `@Controller({ path: "/users" })` | `@Post("/create")` | `POST /users/create` |
| `@Controller({ path: "/" })` | `@Get("/login")` | `GET /login` |
| `@Controller({ path: "/todos" })` | `@Post("/toggle")` | `POST /todos/toggle` |

### Route dengan Middleware

```typescript
// Route-level middleware
@Get("/me", [new AuthMiddleware({ guard: "web" })])
async me(@AuthUser("web") user: User | null) {
  return { user };
}

// Tanpa middleware
@Get("/public")
async publicRoute() {
  return { message: "Public data" };
}
```

---

## 8. Authentication & Guards

### Setup Guards (di `index.ts`)

```typescript
app.addAdapter(
  new ZentifyAuthAdapter({
    defaultGuard: "web",
    passwordHasher: "bcrypt",
    guards: {
      web: {
        driver: "session",
        provider: User,          // Entity class
      },
      admin: {
        driver: "session",
        provider: Admin,         // Entity class
      },
    },
  }),
);
```

### Entity harus implement `Authenticatable`

```typescript
import { Authenticatable } from "@zentify/core";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User implements Authenticatable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column({ name: "password", nullable: true, type: "varchar", length: 255 })
  password!: string;

  getAuthIdentifier() {
    return this.email;
  }

  getAuthPassword() {
    return this.password;
  }
}
```

### Login

```typescript
@Post("/login")
async login(@Body() body: any) {
  const { email, password } = body;
  const success = await this.authManager
    .guard("web")
    .attempt({ email, password });

  if (success) {
    return redirect("/dashboard");
  }
  return render("Login", { error: "Invalid credentials" });
}
```

### Register

```typescript
@Post("/register")
async register(@Body() body: any) {
  const { email, password } = body;
  const user = await this.userService.createUser({ name: email, email });
  user.password = await this.authManager.hashPassword(password);
  await this.userService.updateUser(user.id, {
    name: user.name,
    email: user.email,
    password: user.password,
  });
  return redirect("/login");
}
```

### Logout

```typescript
@Post("/logout")
async logout() {
  await this.authManager.guard("web").logout();
  return redirect("/login");
}
```

### 3 Cara Auth Check

**1. Module-level middleware (recommended untuk semua route):**
```typescript
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
```

**2. Route-level middleware:**
```typescript
@Get("/me", [new AuthMiddleware({ guard: "web" })])
async me(@AuthUser("web") user: User | null) {
  return { user };
}
```

**3. Manual check:**
```typescript
@Get("/")
async index(@AuthUser("web") user: User | null) {
  if (!user) return redirect("/login");
  const todos = await this.todoService.getUserTodos(user.id);
  return render("Todos/Index", { todos });
}
```

---

## 9. Database (TypeORM)

### Entity Definition

```typescript
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ name: "is_done", type: "boolean", default: false })
  isDone!: boolean;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
```

### Column Options

```typescript
@Column()                                    // Simple column
@Column({ type: "varchar", length: 255 })    // With type & length
@Column({ name: "is_done", type: "boolean" }) // Custom column name
@Column({ nullable: true })                   // Nullable
@Column({ default: false })                   // Default value
@Column({ type: "decimal", precision: 10, scale: 2 }) // Decimal
@Column({ type: "text" })                     // Text type
```

### Service dengan Repository

```typescript
@Dependency()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Find with pagination
  async getPaginated(page: number, limit: number) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "DESC" },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Find one
  async getById(id: number) {
    return await this.productRepository.findOneBy({ id });
  }

  // Create
  async create(data: Partial<Product>) {
    const product = this.productRepository.create(data);
    return await this.productRepository.save(product);
  }

  // Update
  async update(id: number, data: Partial<Product>) {
    await this.productRepository.update(id, data);
    return this.getById(id);
  }

  // Delete
  async delete(id: number) {
    return await this.productRepository.delete(id);
  }

  // Find with relation
  async getUserTodos(userId: number) {
    return await this.productRepository.find({
      where: { userId },
      order: { id: "DESC" },
    });
  }
}
```

### Migrations

**Buat migration:**
```bash
zentify make:migration CreateProductsTable
```

**Tulis SQL di `up()` dan `down()`:**
```typescript
export class CreateProductsTable1786800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "product",
                columns: [
                    new TableColumn({ name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" }),
                    new TableColumn({ name: "name", type: "varchar", length: "255" }),
                    new TableColumn({ name: "user_id", type: "int" }),
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey("product", new TableForeignKey({
            columnNames: ["user_id"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("product", true, true, true);
    }
}
```

**Jalankan:**
```bash
zentify migrate:run       # Run pending
zentify migrate:revert    # Revert terakhir
zentify migrate:fresh     # Drop semua + re-run
```

### Seeders

```typescript
import type { Zentify } from "@zentify/core";
import type { Seeder } from "@zentify/typeorm";
import { DataSource } from "typeorm";
import { Product } from "../../Models/Product.js";

export class ProductSeeder implements Seeder {
    public async run(app: Zentify): Promise<void> {
        const dataSource: DataSource = app.container.resolve(DataSource);
        const productRepo = dataSource.getRepository(Product);

        await productRepo.save([
            { name: "Product A", price: 100000, userId: 1 },
        ]);

        console.log("Seeding Product...");
    }
}
```

**Jalankan:**
```bash
zentify db:seed              # Semua seeder
zentify db:seed -c ProductSeeder  # Specific seeder
```

---

## 10. DTO Validation (Valibot)

### Pattern

Buat class dengan `static schema` menggunakan valibot:

```typescript
import * as v from "valibot";

export class UserDTO {
  static schema = v.object({
    name: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Name must be at least 3 characters long"),
    ),
    email: v.pipe(v.string(), v.email("Invalid email format"), v.trim()),
    password: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.minLength(6, "Password must be at least 6 characters long"),
      ),
    ),
  });

  name!: string;
  email!: string;
  password?: string;
}
```

### Cara Pakai di Controller

```typescript
@Post("/create")
async create(@Body() body: UserDTO) {
  // body sudah ter-validasi sesuai schema
  await this.userService.createUser(body);
  return redirect("/users");
}
```

### Valibot Common Validators

```typescript
v.string()                          // String
v.number()                          // Number
v.boolean()                         // Boolean
v.email()                           // Email format
v.minLength(3)                      // Min length
v.maxLength(100)                    // Max length
v.minValue(0)                       // Min value
v.maxValue(1000)                    // Max value
v.trim()                            // Trim whitespace
v.optional(v.string())              // Optional field
v.array(v.string())                 // Array of strings
v.union([v.string(), v.number()])   // Union types
v.literal("admin")                  // Literal value
```

### Contoh DTO Lain

```typescript
import * as v from "valibot";

export class ProductDTO {
  static schema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
    description: v.optional(v.string()),
    price: v.pipe(v.number(), v.minValue(0, "Price must be positive")),
    stock: v.optional(v.pipe(v.number(), v.minValue(0))),
  });

  name!: string;
  description?: string;
  price!: number;
  stock?: number;
}
```

---

## 11. Views (React + Vite)

### Setup

Client entry point di `Views/main.tsx`:

```tsx
import { createZentifyApp } from "@zentify/react";
import { createRoot } from "react-dom/client";
import "./global.css";

// Resolve pages using Vite Glob Import
const pages = (import.meta as any).glob("./Pages/**/*.tsx", { eager: true });

createZentifyApp({
  resolve: (name) => pages[`./Pages/${name}.tsx`],
});
```

### File Structure

```
Views/
├── main.tsx              ← Client entry (jangan diubah)
├── global.css            ← Global styles
└── Pages/
    ├── Index.tsx         ← Home page
    ├── Login.tsx
    ├── Register.tsx
    ├── About.tsx
    ├── Todos/
    │   └── Index.tsx     ← /todos route
    └── Users/
        └── Index.tsx     ← /users route
```

### Rendering dari Controller

```typescript
// Controller
@Get("/")
async index() {
  return render("Index", { title: "Home", user: "Zentify" });
}

@Get("/")
async index(@Query() query: any) {
  const page = parseInt(query.page || "1", 10);
  const users = await this.userService.getPaginatedUsers(page, 5);
  return render("Users/Index", {
    title: "User Management",
    ...users,  // data, total, page, limit, totalPages
  });
}
```

### Page Component Pattern

```tsx
import React from "react";
import { Link } from "@zentify/react/components";
import { useForm } from "@zentify/react/hooks";

interface PageProps {
  title: string;
  data: any[];
  // ... props lain dari controller
}

export default function Index({ title, data }: PageProps) {
  return (
    <div>
      <h1>{title}</h1>
      {/* Content */}
      <Link href="/">Back to Home</Link>
    </div>
  );
}
```

### `useForm` Hook (SPA-style Forms)

```tsx
import { useForm } from "@zentify/react/hooks";

export default function TodosIndex({ todos }: { todos: Todo[] }) {
  // Form dengan initial data
  const { data, setData, post, processing, errors } = useForm({ title: "" });

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.title.trim()) {
      post("/todos/create", {
        onSuccess: () => setData("title", ""),  // Reset form setelah sukses
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.title}
        onChange={(e) => setData("title", e.target.value)}
        placeholder="Add todo..."
      />
      {errors.title && <div>{errors.title}</div>}
      <button type="submit" disabled={processing}>
        {processing ? "..." : "Add"}
      </button>
    </form>
  );
}
```

### `useForm` untuk Delete

```tsx
const DeleteButton = ({ id }: { id: number }) => {
  const { post, processing } = useForm({ id });

  return (
    <button
      disabled={processing}
      onClick={() => {
        if (confirm("Delete?")) post("/todos/delete");
      }}
    >
      {processing ? "..." : "Delete"}
    </button>
  );
};
```

### `useForm` untuk Edit

```tsx
const { data, setValues, post } = useForm({ id: "", name: "", email: "" });

const handleEdit = (user: User) => {
  setValues({ id: user.id.toString(), name: user.name, email: user.email });
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  post("/users/update", {
    onSuccess: () => setValues({ id: "", name: "", email: "" }),
  });
};
```

### `useForm` API

| Property/Method | Fungsi |
|----------------|--------|
| `data` | Current form data object |
| `setData(key, value)` | Set single field value |
| `setValues(obj)` | Set multiple field values |
| `post(url, options?)` | Submit POST request |
| `processing` | Boolean, true sedang submit |
| `errors` | Object berisi validation errors |
| `clearErrors()` | Clear all errors |

**`post()` options:**
```typescript
post("/endpoint", {
  onSuccess: () => { /* callback setelah sukses */ },
});
```

### `Link` Component

```tsx
import { Link } from "@zentify/react/components";

<Link href="/users">Users</Link>
<Link href={`/users?page=${page + 1}`} className="btn">Next</Link>
```

---

## 12. Configuration

### Setup (di `app/Config/AppConfig.ts`)

```typescript
import { Configuration, Env } from "@zentify/core";

@Configuration()
export class AppConfig {
  @Env("APP_NAME") appName!: string;
  @Env("PORT") port!: number;

  @Env("DB_HOST") dbHost!: string;
  @Env("DB_PORT") dbPort!: number;
  @Env("DB_USERNAME") dbUsername!: string;
  @Env("DB_PASSWORD") dbPassword!: string;
  @Env("DB_DATABASE") dbName!: string;
}
```

### File `.env`

```env
APP_NAME=MyApp
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_DATABASE=mydb
```

### Inject Config ke Service

```typescript
@Dependency()
export class HomeService {
  constructor(
    private readonly config: AppConfig,  // Auto-resolved by type
  ) {}

  getConfigInfo() {
    return {
      appName: this.config.appName,
      port: this.config.port,
      database: this.config.dbHost,
    };
  }
}
```

### Inject Config ke Module

```typescript
@Module({
  controllers: [HomeController],
  providers: [HomeService, AuthService, AppConfig],  // Daftar AppConfig
  entities: [User],
})
export class HomeModule {}
```

### Type Declarations (opsional)

Buat `Views/env.d.ts` untuk TypeScript support di frontend:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 13. Contoh Lengkap: CRUD Feature

Mari buat fitur **Product** dari nol.

### Step 1: Generate Module

```bash
zentify make:module Product
```

Ini menghasilkan 4 file sekaligus:
- `app/Controllers/ProductController.ts`
- `app/Services/ProductService.ts`
- `app/Models/Product.ts`
- `app/Modules/ProductModule.ts`

### Step 2: Define Entity

Edit `app/Models/Product.ts`:

```typescript
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User.js";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "int", default: 0 })
  stock!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
```

### Step 3: Buat Migration

```bash
zentify make:migration CreateProductsTable
```

Edit file migration:

```typescript
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateProductsTable1786800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "product",
                columns: [
                    new TableColumn({ name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" }),
                    new TableColumn({ name: "name", type: "varchar", length: "255" }),
                    new TableColumn({ name: "description", type: "text", isNullable: true }),
                    new TableColumn({ name: "price", type: "decimal", precision: "10", scale: "2" }),
                    new TableColumn({ name: "stock", type: "int", default: "0" }),
                    new TableColumn({ name: "user_id", type: "int" }),
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey("product", new TableForeignKey({
            columnNames: ["user_id"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("product", true, true, true);
    }
}
```

### Step 4: Jalankan Migration

```bash
zentify migrate:run
```

### Step 5: Buat DTO

Buat `app/Controllers/dto/ProductDTO.ts`:

```typescript
import * as v from "valibot";

export class ProductDTO {
  static schema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
    description: v.optional(v.string()),
    price: v.pipe(v.number(), v.minValue(0, "Price must be positive")),
    stock: v.optional(v.pipe(v.number(), v.minValue(0))),
  });

  name!: string;
  description?: string;
  price!: number;
  stock?: number;
}
```

### Step 6: Implement Service

Edit `app/Services/ProductService.ts`:

```typescript
import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { Product } from "../Models/Product.js";

@Dependency()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getPaginated(page: number, limit: number) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "DESC" },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(userId: number, data: { name: string; description?: string; price: number; stock?: number }) {
    const product = this.productRepository.create({ ...data, userId });
    return await this.productRepository.save(product);
  }

  async update(id: number, userId: number, data: Partial<Product>) {
    const product = await this.productRepository.findOneBy({ id, userId });
    if (!product) return null;
    Object.assign(product, data);
    return await this.productRepository.save(product);
  }

  async remove(id: number, userId: number) {
    return await this.productRepository.delete({ id, userId });
  }
}
```

### Step 7: Implement Controller

Edit `app/Controllers/ProductController.ts`:

```typescript
import { Controller, Get, Post, Body, Query, render, redirect } from "@zentify/core";
import { AuthUser } from "@zentify/auth";
import { ProductService } from "../Services/ProductService.js";
import { ProductDTO } from "./dto/ProductDTO.js";
import { User } from "../Models/User.js";

@Controller({ path: "/products" })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get("/")
  async index(@Query() query: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");
    const page = parseInt(query.page || "1", 10);
    const products = await this.productService.getPaginated(page, 10);
    return render("Products/Index", { title: "Products", ...products });
  }

  @Post("/create")
  async create(@Body() body: ProductDTO, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");
    await this.productService.create(user.id, body);
    return redirect("/products");
  }

  @Post("/update")
  async update(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");
    const id = parseInt(body.id, 10);
    if (id) {
      await this.productService.update(id, user.id, {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        stock: parseInt(body.stock || "0"),
      });
    }
    return redirect("/products");
  }

  @Post("/delete")
  async destroy(@Body() body: any, @AuthUser("web") user: User | null) {
    if (!user) return redirect("/login");
    const id = parseInt(body.id, 10);
    if (id) {
      await this.productService.remove(id, user.id);
    }
    return redirect("/products");
  }
}
```

### Step 8: Register Module

Edit `app/Routes/web.ts`:

```typescript
import { Route } from "@zentify/core";
import { HomeModule } from "../Modules/HomeModule.js";
import { UserModule } from "../Modules/UserModule.js";
import { TodoModule } from "../Modules/TodoModule.js";
import { ProductModule } from "../Modules/ProductModule.js";

Route.module(HomeModule)
Route.module(UserModule)
Route.module(TodoModule)
Route.module(ProductModule)
```

### Step 9: Buat View

Buat `app/Views/Pages/Products/Index.tsx`:

```tsx
import React, { useState } from "react";
import { Link } from "@zentify/react/components";
import { useForm } from "@zentify/react/hooks";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface ProductsProps {
  title: string;
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
}

const DeleteButton = ({ id }: { id: number }) => {
  const { post, processing } = useForm({ id });
  return (
    <button
      disabled={processing}
      onClick={() => {
        if (confirm("Delete this product?")) post("/products/delete");
      }}
    >
      {processing ? "..." : "Delete"}
    </button>
  );
};

export default function ProductsIndex({ title, data, totalPages, page }: ProductsProps) {
  const [editing, setEditing] = useState<Product | null>(null);
  const { data: formData, setData, setValues, post, processing } = useForm({
    id: "", name: "", description: "", price: "", stock: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      post("/products/update", { onSuccess: () => setEditing(null) });
    } else {
      post("/products/create", { onSuccess: () => {
        setValues({ id: "", name: "", description: "", price: "", stock: "" });
      }});
    }
  };

  return (
    <div>
      <h1>{title}</h1>
      <Link href="/">Home</Link>

      <form onSubmit={handleSubmit}>
        <input value={formData.name} onChange={(e) => setData("name", e.target.value)} placeholder="Name" />
        <input value={formData.price} onChange={(e) => setData("price", e.target.value)} placeholder="Price" type="number" />
        <button type="submit" disabled={processing}>{editing ? "Update" : "Create"}</button>
      </form>

      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Price</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>
                <button onClick={() => {
                  setEditing(p);
                  setValues({ id: p.id.toString(), name: p.name, price: p.price.toString() });
                }}>Edit</button>
                <DeleteButton id={p.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div>
          <Link href={`/products?page=${page - 1}`}>Previous</Link>
          <span>Page {page} of {totalPages}</span>
          <Link href={`/products?page=${page + 1}`}>Next</Link>
        </div>
      )}
    </div>
  );
}
```

### Step 10: Jalankan

```bash
zentify dev
```

Buka `http://localhost:3000/products`

---

## 14. Tips & Best Practices

### Naming Conventions

| Component | Suffix | Contoh |
|-----------|--------|--------|
| Controller | `Controller` | `ProductController` |
| Service | `Service` | `ProductService` |
| Model/Entity | Tanpa suffix | `Product` (bukan `ProductModel`) |
| Module | `Module` | `ProductModule` |
| DTO | `DTO` | `ProductDTO` |
| Migration | `-` | `CreateProductsTable` |
| Seeder | `Seeder` | `ProductSeeder` |

### Checklist Membuat Feature Baru

1. [ ] `zentify make:module <Name>` (generate 4 file sekaligus)
2. [ ] Define entity columns di Model
3. [ ] `zentify make:migration <Name>` + tulis SQL
4. [ ] `zentify migrate:run`
5. [ ] Buat DTO untuk validation
6. [ ] Implement Service (business logic)
7. [ ] Implement Controller (route handlers)
8. [ ] Register module di `Routes/web.ts`
9. [ ] Buat View (React page)
10. [ ] Test di browser

### Service Rules

- **Selalu** pakai `@Dependency()` decorator
- Inject repository dengan `@InjectRepository(Entity)`
- Jangan lupa import dari package yang benar
- Gunakan typed returns untuk menghindari runtime errors

### Controller Rules

- Gunakan `@Controller({ path: "/prefix" })` untuk route prefix
- Route methods pakai `@Get` atau `@Post`
- Gunakan `@Body()` untuk request body, `@Query()` untuk query params
- Return `render("PageName", data)` untuk views
- Return `redirect("/path")` untuk redirects
- Return object `{...}` untuk JSON response

### Module Rules

- **Jangan lupa** register module di `Routes/web.ts` dengan `Route.module()`
- List semua controllers di `controllers: []`
- List semua providers/services di `providers: []`
- List semua entities di `entities: []`
- Tambah middleware di `middleware: []` jika perlu

### Auth Rules

- Entity harus implement `Authenticatable` interface
- Password di-hash dengan `this.authManager.hashPassword(password)`
- Login pakai `this.authManager.guard("web").attempt({ email, password })`
- Logout pakai `this.authManager.guard("web").logout()`

### File Safety

- CLI tidak akan overwrite file yang sudah ada (skip + warning)
- Selalu backup manual jika ragu
- Gunakan version control (git) sebelum perubahan besar

### Import Paths

Selalu gunakan `.js` extension di import paths (TypeScript requirement):

```typescript
// Benar
import { UserService } from "../Services/UserService.js";
import { User } from "../Models/User.js";

// Salah
import { UserService } from "../Services/UserService";
import { User } from "../Models/User";
```

### Error Handling

```typescript
import { UnauthorizedException } from "@zentify/core";

// Throw exception
if (!isAuthorized) {
  throw new UnauthorizedException("Not authorized");
}

// Controller akan otomatis handle exception dan return error response
```

---

## Cheat Sheet: Import Paths

```typescript
// Core
import { Controller, Get, Post, Body, Query, Res, render, redirect } from "@zentify/core";
import { Dependency, Inject, Module, Configuration, Env } from "@zentify/core";
import { Route, Zentify, REQUEST_CONTEXT } from "@zentify/core";
import { UnauthorizedException } from "@zentify/core";
import { ZentifyHttpContextService, Authenticatable } from "@zentify/core";

// Auth
import { AuthManager, AuthMiddleware, AuthUser } from "@zentify/auth";

// TypeORM
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";

// React
import { createZentifyApp } from "@zentify/react";
import { useForm } from "@zentify/react/hooks";
import { Link } from "@zentify/react/components";

// Validation
import * as v from "valibot";
```
