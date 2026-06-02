import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  async create(dto: CreateMessageDto) {
    return { id: 'msg-1', ...dto };
  }

  async findByChannel(channelId: string) {
    return [{ id: 'msg-1', channelId, content: 'hello' }];
  }
}
