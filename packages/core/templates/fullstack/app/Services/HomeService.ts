import { Dependency, UnauthorizedException } from "@zify/core";
import { AuthService } from "./AuthService.js";

@Dependency()
export class HomeService{
    constructor(
        private readonly authService: AuthService
    ){}

    async greetings(name: string){
        const isAuthorize = await this.authService.authorize();
        if (!isAuthorize) throw new UnauthorizedException("Not authorized");

        return `Hello ${name} from service`
    }
}