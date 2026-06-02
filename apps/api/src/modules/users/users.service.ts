import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto) {
    // Use Prisma client in real implementation
    return { id: 'tmp-id', ...dto };
  }

  async findOne(id: string) {
    return { id, username: 'alice' };
  }

  async update(id: string, dto: UpdateUserDto) {
    return { id, ...dto };
  }
}
