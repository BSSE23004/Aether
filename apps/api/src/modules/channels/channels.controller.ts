import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly svc: ChannelsService) {}

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.svc.create(dto);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
