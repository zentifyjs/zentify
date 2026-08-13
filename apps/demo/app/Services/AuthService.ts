import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { User } from "../Models/User.js";
import { Repository } from "typeorm";

@Dependency()
export class AuthService{
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ){}

    async authorize(){
        return true
    }

    async create({name, email}:{name:string, email:string}){
        const result = await this.userRepository.save({name, email})
        return result
    }
}