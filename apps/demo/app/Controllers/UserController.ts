import { Body, Controller, Get, Post, Query, Res, render } from "@zentify/core";
import { UserService } from "../Services/UserService.js";
import { UserDTO } from "./dto/UserDTO.js";

@Controller({ path: "/users" })
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    @Get("/")
    async index(@Query() query: any) {
        const page = parseInt(query.page || "1", 10);
        const limit = parseInt(query.limit || "5", 10);
        const paginated = await this.userService.getPaginatedUsers(page, limit);
        
        return render("Users/Index", { 
            title: "User Management (CRUD & Pagination)",
            ...paginated
        });
    }

    @Post("/create")
    async create(@Body() body: UserDTO, @Res() res: any) {
        await this.userService.createUser(body);
        res.writeHead(302, { Location: "/users" });
        res.end();
    }

    @Post("/update")
    async update(@Body({raw: true}) body: any, @Res() res: any) {
        const id = parseInt(body.id, 10);
        if (id) {
            await this.userService.updateUser(id, { name: body.name, email: body.email });
        }
        res.writeHead(302, { Location: "/users" });
        res.end();
    }

    @Post("/delete")
    async destroy(@Body({raw:true}) body: any, @Res() res: any) {
        const id = parseInt(body.id, 10);
        if (id) {
            await this.userService.deleteUser(id);
        }
        res.writeHead(302, { Location: "/users" });
        res.end();
    }
}
