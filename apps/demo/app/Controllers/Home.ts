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
        const result = await  this.homeService.createUser({
            name: body.name,
            email: body.email
        })
        
        return {msg:result}
    }
    
    @Get("/")
    async index(){
        return render("Index", { title: "Hii broo, Welcome to Zentify + React + Vite 🚀", user: "Zentify" });
    }

    @Get("/about")
    async about(){
        return render("About", { title: "Tentang Kami", version: "1.0" });
    }
}