import { Dependency, UnauthorizedException } from "@zentify/core";
import { AuthService } from "./AuthService.js";
import { AppConfig } from "../Config/AppConfig.js";

@Dependency()
export class HomeService{
    constructor(
        private readonly authService: AuthService,
        private readonly config: AppConfig
    ){}

    async greetings(name: string){
        const isAuthorize = await this.authService.authorize();
        if (!isAuthorize) throw new UnauthorizedException("Not authorized");

        return `Hello ${name} from service`
    }

    async createUser({name,email}: {name: string, email: string}){
        const result = await this.authService.create({name, email})
        return result
    }

    getConfigInfo(){
        return {
            appName: this.config.appName,
            port: this.config.port,
            database: this.config.dbHost,
            testApiUrl: this.config.testApiUrl,
        };
    }
}