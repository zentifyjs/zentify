import { Dependency } from "@zentify/core";
import { InjectRepository } from "@zentify/typeorm";
import { Repository } from "typeorm";
import { UserDTO } from "../Controllers/dto/UserDTO.js";
import { Admin } from "../Models/Admin.js";

@Dependency()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async getPaginatedUsers(page: number, limit: number) {
    const [data, total] = await this.adminRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "DESC" },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: number) {
    return await this.adminRepository.findOneBy({ id });
  }

  async createUser(data: UserDTO) {
    const user = this.adminRepository.create(data);
    return await this.adminRepository.save(user);
  }

  async updateUser(id: number, data: UserDTO) {
    await this.adminRepository.update(id, data);
    return this.getUserById(id);
  }

  async deleteUser(id: number) {
    return await this.adminRepository.delete(id);
  }
}
