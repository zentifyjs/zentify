import { Dependency } from "@zify/core";

@Dependency()
export class AuthService{
    constructor(){}

    async authorize(){
        return true
    }
}