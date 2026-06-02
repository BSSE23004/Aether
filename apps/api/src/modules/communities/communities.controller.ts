import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Post()
  create(@Body() dto: CreateCommunityDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
