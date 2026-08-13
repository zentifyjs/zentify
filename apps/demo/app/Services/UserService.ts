import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { User } from "../Models/User.js";
import { UserDTO } from "../Controllers/dto/UserDTO.js";

@Dependency()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async getPaginatedUsers(page: number, limit: number) {
        const [data, total] = await this.userRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { id: "DESC" }
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getUserById(id: number) {
        return await this.userRepository.findOneBy({ id });
    }

    async createUser(data: UserDTO) {
        const user = this.userRepository.create(data);
        return await this.userRepository.save(user);
    }

    async updateUser(id: number, data: UserDTO) {
        await this.userRepository.update(id, data);
        return this.getUserById(id);
    }

    async deleteUser(id: number) {
        return await this.userRepository.delete(id);
    }
}
