<div align="center">
  <h1>⚡ Zentify</h1>
  <p><strong>A Modern, Fullstack Node.js & TypeScript Framework</strong></p>
  <p>Built on raw <code>node:http</code> - zero overhead, decorator-based, blazing fast.</p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" />
    <img src="https://img.shields.io/badge/Node.js-22+-green?logo=node.js" />
    <img src="https://img.shields.io/badge/License-ISC-yellow" />
    <img src="https://img.shields.io/badge/version-1.0.6--rc--1-orange" />
  </p>
</div>

---

## 📖 Apa itu Zentify?

**Zentify** adalah framework _fullstack_ berbasis TypeScript yang dirancang untuk memberikan **Developer Experience (DX) kelas satu** - seperti Laravel atau NestJS - namun tetap sangat ringan dan cepat karena dibangun langsung di atas modul `node:http` bawaan Node.js.

Framework ini menggabungkan dua dunia dalam satu server:

- **Backend**: Decorator-based routing, Dependency Injection, Controllers, Services, dan Middleware Pipeline
- **Frontend**: Integrasi Vite dalam _middleware mode_ untuk Hot Module Replacement (HMR) dan React SPA - semuanya dari satu port, tanpa menjalankan dua proses terpisah.

> Zentify bukan wrapper di atas Express. Ia membangun HTTP server-nya sendiri, sehingga tidak ada overhead dari library routing eksternal yang tidak perlu.

---

## 🎯 Tujuan Utama

| Prinsip                           | Penjelasan                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Convention over Configuration** | Struktur direktori dan pola penamaan yang konsisten. Tidak perlu konfigurasi boilerplate yang rumit.                                           |
| **Clean Architecture**            | Mendukung pola arsitektur bersih via _Decorator-based routing_, _Dependency Injection (DI)_, serta pemisahan Controllers dan Services.         |
| **Modular & Agnostic**            | Inti framework (`@zentify/core`) dibuat murni. Integrasi React/Vite dipisah melalui _Adapter Pattern_ (`@zentify/vite`, `@zentify/react`).     |
| **Fullstack in One Server**       | Me-render halaman React dari Backend semudah memanggil `return render("Page", { props })`. Tidak ada double server, tidak ada CORS antar port. |
| **Performa Tinggi**               | Dibangun di atas `node:http` murni dengan `find-my-way` sebagai router (router yang sama dengan Fastify), sehingga overhead sangat minimal.    |

---

## 📦 Ekosistem Package

Zentify adalah **monorepo** dengan beberapa package yang saling melengkapi:

| Package          | Deskripsi                                                             |
| ---------------- | --------------------------------------------------------------------- |
| `@zentify/core`  | Inti framework: HTTP server, routing, decorators, DI container, CLI   |
| `@zentify/vite`  | Adapter Vite - mengintegrasikan Vite dev server dalam middleware mode |
| `@zentify/react` | Client runtime - SPA navigation (`navigate`, `<Link>`), app mounting  |

---

## ⚡ Quick Start

### Prasyarat

- **Node.js** >= 22
- **npm** >= 10

### 1. Buat Project Baru via CLI

```bash
npx @zentify/core new my-app
```

CLI akan menampilkan prompt interaktif untuk memilih tipe project:

```
? Select project type:
  ❯ API Only          - A lightweight Zentify application for REST APIs
    Fullstack (React) - Zentify backend with React + Vite frontend
```

### 2. Install & Jalankan

```bash
cd my-app
npm install
npm run dev
```

Server akan berjalan di `http://localhost:3000` dengan auto-reload saat file berubah.

---

## 📁 Struktur Direktori

### API Only

```
my-app/
├── app/
│   ├── Controllers/       # Endpoint & routing handler
│   │   └── UserController.ts
│   ├── Services/          # Logika bisnis & injectable dependencies
│   │   └── UserService.ts
│   ├── Modules/           # Grouping controller + provider
│   │   └── UserModule.ts
│   ├── Routes/            # Registrasi modul ke router global
│   │   └── web.ts
│   └── index.ts           # Entry point aplikasi
├── tsconfig.json
└── package.json
```

### Fullstack (React + Vite)

```
my-app/
├── app/
│   ├── Controllers/
│   ├── Services/
│   ├── Modules/
│   ├── Routes/
│   ├── Views/
│   │   ├── Pages/         # Komponen React per halaman
│   │   │   ├── Index.tsx
│   │   │   └── About.tsx
│   │   ├── index.css
│   │   └── main.tsx       # Client entry point (Vite)
│   └── index.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🛠️ CLI Commands

Setelah instalasi, semua perintah dijalankan via `zentify`:

| Command                          | Deskripsi                                                        |
| -------------------------------- | ---------------------------------------------------------------- |
| `zentify new <name>`             | Buat project baru (interaktif: API Only / Fullstack)             |
| `zentify dev`                    | Start server development dengan TypeScript watch + Node.js watch |
| `zentify build`                  | Compile TypeScript ke JavaScript (production)                    |
| `zentify start`                  | Jalankan server production dari hasil build                      |
| `zentify make:controller <name>` | Generate file Controller baru                                    |
| `zentify make:service <name>`    | Generate file Service baru                                       |
| `zentify make:module <name>`     | Generate file Module baru                                        |

---

## 📦 Standalone Build (ala Next.js)

Mode **standalone** menghasilkan folder deployment yang **self-contained**: seluruh kode backend, `node_modules` yang benar-benar dibutuhkan (hasil *file tracing*), serta aset frontend — siap disalin ke server mana pun dan dijalankan tanpa `npm install`.

### Mengaktifkan

Tambahkan `"standalone": true` di `zentify.json`:

```json
{
  "entry": "app/index.ts",
  "outDir": "dist",
  "standalone": true
}
```

Atau lewati config dan jalankan langsung:

```bash
zentify build --standalone
```

### Hasil build

Output berada di dalam folder build, seperti `.next/standalone` di Next.js:

```
dist/standalone/
├── server.js                # entry point: jalankan `node server.js`
├── package.json             # { "type": "module", "private": true }
├── zentify.json             # agar resolveOutDir() = "dist"
├── node_modules/            # hanya paket yang ter-trace (react, typeorm, pg, @zentify/*, dst.)
└── dist/
    ├── app/                 # hasil kompilasi backend (tsc)
    ├── public/              # aset frontend (Vite client build)
    └── server/              # bundle SSR (Vite server build)
```

### Cara deploy

```bash
# build
npm run build

# salin folder standalone ke server (env di-set dari luar, .env TIDAK ikut tersalin)
cp -r dist/standalone /opt/my-app
cd /opt/my-app

# jalankan
node server.js
```

> `server.js` otomatis men-set `NODE_ENV=production` dan men-selaraskan seluruh resolusi path ke dalam folder standalone.

### Apa saja yang dimasukkan

- Dependency **ditelusuri** dari entry backend + bundle SSR menggunakan file tracing (`@vercel/nft`), ditambah *safety net*: semua dependency eksplisit di `package.json` ikut disalin.
- Paket dev-only (`vite`, `@vitejs/*`, `esbuild`, `@swc/*`, `rollup`, `tsx`, `@inquirer/*`) **tidak** ikut, karena hanya dibutuhkan saat development/build.
- `.env` sengaja **tidak** disalin — environment variable disediakan oleh platform deploy.



## 🧱 Konsep & Cara Penggunaan

### Entry Point (`app/index.ts`)

```typescript
import { Zentify } from "@zentify/core";
import "./Routes/web.js";

const app = new Zentify({
  server: { port: 3000, host: "0.0.0.0" },
});

app.run();
```

### Route Registration (`app/Routes/web.ts`)

```typescript
import { Route } from "@zentify/core";
import { UserModule } from "../Modules/UserModule.js";

Route.module(UserModule);
```

---

### Module (`app/Modules/UserModule.ts`)

Module adalah unit pengelompokan antara Controllers dan Services (providers). Semua dependency injection di-resolve secara otomatis di dalam scope module.

```typescript
import { Module } from "@zentify/core";
import { UserController } from "../Controllers/UserController.js";
import { UserService } from "../Services/UserService.js";

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

---

### Controller (`app/Controllers/UserController.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@zentify/core";
import { UserService } from "../Services/UserService.js";
import { CreateUserDTO } from "./dto/CreateUserDTO.js";

@Controller({ path: "/users" })
export class UserController {
  constructor(
    private readonly userService: UserService, // Di-inject otomatis
  ) {}

  @Get("/")
  async index(@Query() query: any) {
    return this.userService.findAll(query);
  }

  @Get("/:id")
  async show(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  @Post("/")
  async create(@Body() body: CreateUserDTO) {
    return this.userService.create(body);
  }

  @Put("/:id")
  async update(@Param("id") id: string, @Body() body: CreateUserDTO) {
    return this.userService.update(id, body);
  }

  @Delete("/:id")
  async destroy(@Param("id") id: string) {
    return this.userService.delete(id);
  }
}
```

---

### Service (`app/Services/UserService.ts`)

Service adalah tempat logika bisnis. Tandai dengan `@Dependency()` agar bisa di-inject ke Controller atau Service lain.

```typescript
import { Dependency, NotFoundException } from "@zentify/core";

@Dependency()
export class UserService {
  private users = [{ id: "1", name: "Raja" }];

  async findAll(query: any) {
    return this.users;
  }

  async findById(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async create(data: any) {
    const user = { id: Date.now().toString(), ...data };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: any) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1)
      throw new NotFoundException(`User with id ${id} not found`);
    this.users[index] = { ...this.users[index], ...data };
    return this.users[index];
  }

  async delete(id: string) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1)
      throw new NotFoundException(`User with id ${id} not found`);
    this.users.splice(index, 1);
    return { deleted: true };
  }
}
```

---

### Route Manual (Tanpa Controller)

Untuk endpoint sederhana, bisa langsung daftar route tanpa membuat Controller:

```typescript
import { Route } from "@zentify/core";

// GET /health
Route.get("/health", async (req, res) => {
  res.json({ status: "ok" });
});

// Route group dengan prefix
Route.group("/api/v1", () => {
  Route.get("/ping", async (req, res) => {
    res.json({ pong: true });
  });
});
```

---

## 🎯 Parameter Decorators

| Decorator     | Deskripsi                                    | Contoh                        |
| ------------- | -------------------------------------------- | ----------------------------- |
| `@Body()`     | Parse & validasi request body via DTO schema | `@Body() body: CreateUserDTO` |
| `@Param(key)` | Ambil route parameter                        | `@Param("id") id: string`     |
| `@Query()`    | Ambil query string sebagai object            | `@Query() query: any`         |
| `@Req()`      | Raw request object (`ZRequest`)              | `@Req() req: ZRequest`        |
| `@Res()`      | Raw response object (`ZResponse`)            | `@Res() res: ZResponse`       |

---

## ✅ Validasi DTO dengan Valibot

Zentify mengintegrasikan [Valibot](https://valibot.dev) untuk validasi body request secara otomatis. Jika validasi gagal, framework otomatis mengembalikan response `422 Unprocessable Entity`.

```typescript
import * as v from "valibot";

export class CreateUserDTO {
  static schema = v.object({
    name: v.pipe(v.string(), v.minLength(3)),
    email: v.pipe(v.string(), v.email()),
    age: v.optional(v.number()),
  });

  name!: string;
  email!: string;
  age?: number;
}
```

```typescript
@Post("/")
async create(@Body() body: CreateUserDTO) {
  // body sudah tervalidasi sebelum sampai sini
  return this.userService.create(body);
}
```

Response ketika validasi gagal:

```json
{
  "message": "Invalid request body",
  "details": [...]
}
```

---

## 🚨 HTTP Exceptions

Zentify menyediakan kelas exception bawaan yang otomatis dikonversi ke response JSON:

```typescript
import {
  HttpException,
  BadRequestException,          // 400
  UnauthorizedException,        // 401
  ForbiddenException,           // 403
  NotFoundException,            // 404
  InternalServerErrorException, // 500
} from "@zentify/core";

@Get("/:id")
async show(@Param("id") id: string) {
  const user = await this.userService.findById(id);
  if (!user) throw new NotFoundException("User not found");
  return user;
}

// Custom exception dengan status code bebas
throw new HttpException({ message: "Too many requests", statusCode: 429 });
```

Response otomatis:

```json
{
  "message": "User not found"
}
```

---

## 🔗 Middleware

### Global Middleware

```typescript
import { Zentify, Middleware } from "@zentify/core";

class LoggerMiddleware implements Middleware {
  async handle(req, res, next) {
    console.log(`[${req.method}] ${req.url}`);
    await next();
  }
}

const app = new Zentify({ server: { port: 3000 } });
app.addMiddleware(new LoggerMiddleware());
```

### Route-level Middleware

```typescript
@Get("/admin", [new AuthMiddleware()])
async adminDashboard() {
  return { secret: true };
}
```

### Module-level Middleware

```typescript
@Module({
  controllers: [AdminController],
  providers: [AdminService],
  middleware: [
    {
      middlewares: [new AuthMiddleware()],
      includeRoutes: [{ method: "REQ_METHOD_ALL", path: "/admin/*" }],
    },
  ],
})
export class AdminModule {}
```

---

## 🌐 Fullstack Mode (React + Vite)

Untuk project fullstack, tambahkan Vite Adapter ke entry point:

```typescript
import { Zentify } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite";
import "./Routes/web.js";

const app = new Zentify({ server: { port: 3000 } });

app.addAdapter(
  new ZentifyViteAdapter({
    entry: "app/Views/main.tsx",
  }),
);

app.useStatic("dist/public");
app.run();
```

**Render halaman React dari Controller:**

```typescript
import { render } from "@zentify/core";

@Get("/")
async index() {
  return render("Index", { title: "Zentify", user: "Raja" });
}
```

**Client entry (`app/Views/main.tsx`):**

```tsx
import { createZentifyApp } from "@zentify/react";
import { createRoot } from "react-dom/client";

const pages = (import.meta as any).glob("./Pages/**/*.tsx", { eager: true });

createZentifyApp({
  resolve: (name) => pages[`./Pages/${name}.tsx`],
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
});
```

**SPA Navigation dengan `<Link>`:**

```tsx
import { Link } from "@zentify/react";

export default function Index({
  title,
  user,
}: {
  title: string;
  user: string;
}) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Hello, {user}!</p>
      <Link href="/about">Tentang Kami</Link>
    </div>
  );
}
```

> `<Link>` melakukan client-side navigation via `X-Zentify-Bridge` header - server hanya membalas JSON, bukan full HTML reload.

---

## ⚙️ tsconfig.json yang Diperlukan

Pastikan `tsconfig.json` mengaktifkan decorator metadata:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "outDir": "./dist"
  }
}
```

---

## 🏎️ Hasil Benchmark (REST API)

Benchmark dijalankan pada hardware nyata untuk skenario **REST API murni** - tanpa database, tanpa middleware tambahan, tanpa autentikasi - menggunakan [autocannon](https://github.com/mcollina/autocannon).

### Environment

| Spesifikasi      | Detail                          |
| ---------------- | ------------------------------- |
| Node.js          | v22.22.0                        |
| OS               | Windows 10 (build 26200)        |
| CPU              | AMD Ryzen 5 7520U (8 cores)     |
| RAM              | 13.83 GB                        |
| Durasi benchmark | 10 detik per skenario           |
| Warmup           | 5 detik                         |
| Tool             | autocannon (keep-alive enabled) |
| Zentify version  | 1.0.0                           |
| Fastify version  | 5.11.3                          |

Fastify dipilih sebagai pembanding utama karena merupakan salah satu framework Node.js tercepat. Kolom RPS adalah nilai **median** dari seluruh run.

---

### 📊 Static Route - `GET /hello`

| Connections | Zentify RPS | Fastify RPS |  Selisih  |
| :---------: | :---------: | :---------: | :-------: |
|      1      |  **5,742**  |    3,965    | +44.8% ✅ |
|     10      | **10,335**  |    8,552    | +20.8% ✅ |
|     100     | **10,981**  |    6,213    | +76.7% ✅ |

---

### 📊 Dynamic Route - `GET /users/:id`

| Connections | Zentify RPS | Fastify RPS |  Selisih  |
| :---------: | :---------: | :---------: | :-------: |
|      1      |  **6,078**  |    5,061    | +20.1% ✅ |
|     10      | **12,962**  |    7,113    | +82.2% ✅ |
|     100     | **11,023**  |    6,797    | +62.2% ✅ |

---

### 📊 Multi-param Route - `GET /users/:id/posts/:postId`

| Connections | Zentify RPS | Fastify RPS |  Selisih   |
| :---------: | :---------: | :---------: | :--------: |
|      1      |  **6,683**  |    3,271    | +104.3% ✅ |
|     10      | **11,107**  |    7,970    | +39.4% ✅  |
|     100     |    8,048    |  **7,917**  |  ~Setara   |

---

### 📊 Query String - `GET /users?name=john`

| Connections | Zentify RPS | Fastify RPS |  Selisih  |
| :---------: | :---------: | :---------: | :-------: |
|      1      |  **7,739**  |    5,853    | +32.2% ✅ |
|     10      | **12,064**  |   11,409    | +5.7% ✅  |
|     100     | **10,868**  |    8,637    | +25.8% ✅ |

---

### 📊 JSON Body - `POST /users`

| Connections | Zentify RPS | Fastify RPS |  Selisih  |
| :---------: | :---------: | :---------: | :-------: |
|      1      |  **3,469**  |    2,180    | +59.1% ✅ |
|     10      |  **6,405**  |    5,126    | +24.9% ✅ |
|     100     |  **5,252**  |    3,414    | +53.8% ✅ |

---

### Mengapa Zentify Cepat?

1. **Zero Overhead HTTP Layer** - Tidak ada middleware pipeline dari library eksternal. Request langsung masuk ke handler.
2. **`find-my-way` Router** - Router berbasis Radix tree yang sama dengan Fastify, matching O(1).
3. **Route Table Pre-compilation** - Semua route di-resolve saat inisialisasi, bukan per-request.
4. **No Unnecessary Abstraction** - Tidak ada layer Express-style wrapping yang membengkakkan overhead.
5. **Vite Middleware Mode** - Beban kompilasi Frontend diserahkan ke proses Vite terpisah, tidak memblok event loop utama.

> ⚠️ **Catatan**: Hasil benchmark ini spesifik pada hardware, versi Node.js, dan kondisi pengujian yang tercantum. Hasil aktual dapat bervariasi tergantung lingkungan deployment.

---

## 🗺️ Roadmap

- [ ] Authentication middleware bawaan (JWT, Session)
- [ ] WebSocket support
- [ ] Database adapter (`@zentify/prisma`, `@zentify/mongoose`)
- [ ] Testing utilities (`@zentify/testing`)
- [ ] Vue.js adapter (`@zentify/vue`)
- [ ] CLI: `zentify make:dto <name>`
- [ ] OpenAPI / Swagger documentation generator

---

## 📄 Lisensi

ISC License.
