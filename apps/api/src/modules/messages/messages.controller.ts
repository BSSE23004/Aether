import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.svc.create(dto);
  }

  @Get('channel/:id')
  findByChannel(@Param('id') id: string) {
    return this.svc.findByChannel(id);
  }
}
