import { Dependency } from "@zentify/core";

@Dependency()
export class AuthService{
    constructor(){}

    async authorize(){
        return true
    }
}