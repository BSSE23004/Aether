import { Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';

@Injectable()
export class CommunitiesService {
  async create(dto: CreateCommunityDto) {
    return { id: 'comm-1', ...dto };
  }

  async findOne(id: string) {
    return { id, name: 'Aether Test Community' };
  }
}
