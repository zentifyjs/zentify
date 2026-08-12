import { Controller, Get, render } from "@zify/core";

@Controller({path:"/"})
export class HomeController{

    @Get("/")
    async index(){
        return render("Index", { title: "Zify + React + Vite 🚀", user: "Raja" });
    }

    @Get("/about")
    async about(){
        return render("About", { title: "Tentang Kami", version: "1.0" });
    }
}