import { Body, Controller, Get, Post } from "@zentify/core";
import { HomeService } from "../Services/HomeService.js";
import { HomeDTO } from "./dto/HomeDTO.js";

@Controller({path:"/"})
export class HomeController{
    constructor(
        private readonly homeService: HomeService
    ){}


    @Post("/api/greetings")
    async greeting(@Body() body: HomeDTO){
        const result = await  this.homeService.greetings(body.name)
        
        return {msg:result}
    }
    
    @Get("/")
    async index(){
        return { title: "Hii broo, Welcome to Zentify 🚀", user: "Zentify", ...this.homeService.getConfigInfo() }
    }

    @Get("/about")
    async about(){
        return { title: "Tentang Kami", version: "1.0", ...this.homeService.getConfigInfo() }
    }

    @Get("/api/config")
    async config(){
        return this.homeService.getConfigInfo()
    }
}