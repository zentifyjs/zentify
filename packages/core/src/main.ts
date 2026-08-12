import { Controller, Get, Module, Dependency, Req } from "./decorators";
import { Route } from "./router/route";
import { Middleware, ZRequest, ZResponse } from "./types";
import { Zentify } from "./zentify";

const app = new Zentify({
    server: {
        port: 3002
    }
});

class HomeMiddleware implements Middleware{
    async handle(req: ZRequest, res: ZResponse, next: Function) {
        console.log("Home Middleware")
        await next()
    }
}

@Dependency()
class AuthService{
    async auth(){
        return true;
    }
}

@Dependency()
class HomeService{
    constructor(
        private readonly authService: AuthService
    ){}

    async greeting(name: string){
        const authorize = await this.authService.auth()
        if (authorize){
            return `${name} welcome`
        }

        return "Not Authorized"
    }
}

@Controller({ path: "home" })
class HomeController {

    constructor(
        private readonly homeService: HomeService
    ){}
    
    @Get()
    async home() {
        return await this.homeService.greeting("Raja")
    }

    @Get(":id")
    async homeID(@Req() req: ZRequest){
        return await this.homeService.greeting(req.params.id)
    }
}

@Module({
    controllers: [HomeController],
    providers: [
        HomeService,
        AuthService,
    ],
    middleware: [
        {
            middlewares: [new HomeMiddleware()],
            excludeRoutes: [
                {
                    path: "/home/:id",
                    method: "GET"
                }
            ],
            includeRoutes: [
                {
                    path: "/home",
                    method: "GET",
                }
            ]
        }
    ]
})
class AppModule {}

Route.module(AppModule)
app.run();