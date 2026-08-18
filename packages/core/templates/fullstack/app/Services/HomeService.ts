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

    getConfigInfo(){
        return {
            appName: this.config.appName,
            port: this.config.port,
            databaseUrl: this.config.databaseUrl,
            testApiUrl: this.config.testApiUrl,
        };
    }
}