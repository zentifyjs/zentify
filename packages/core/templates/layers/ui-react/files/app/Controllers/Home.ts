import { Body, Controller, Get, Post, render } from "@zentify/core";
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
        return render("Index", { title: "Hii broo, Welcome to Zentify + React + Vite 🚀", user: "Zentify" });
    }

    @Get("/about")
    async about(){
        const info = this.homeService.getConfigInfo();
        return render("About", { title: "Tentang Kami", version: "1.0", ...info });
    }

    @Get("/api/config")
    async config(){
        return this.homeService.getConfigInfo();
    }
}