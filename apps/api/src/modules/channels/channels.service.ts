import { Injectable } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  async create(dto: CreateChannelDto) {
    return { id: 'chan-1', ...dto };
  }

  async findOne(id: string) {
    return { id, name: 'general' };
  }
}
