import { Controller, Get, Module } from "./decorators";
import { Route } from "./router/route";
import { Zify } from "./zify";

const app = new Zify({
    server: {
        port: 3002
    }
});

class AuthService{}

class HomeService{
    constructor(
        private readonly authService: AuthService
    ){}
}

@Controller({ path: "home" })
class HomeController {

    constructor(
        private readonly homeService: HomeService
    ){}
    
    @Get()
    home(req: Request, res: Response) {
        return "Home";
    }
}

@Module({
    controllers: [HomeController],
    providers: [],
})
class AppModule {}

Route.module(AppModule)
app.run();