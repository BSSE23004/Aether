import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import type { JwtPayload } from '../auth/auth.jwt';
import { CommunitiesService } from './communities.service';
import { Roles } from './decorators/roles.decorator';
import { CreateCommunityDto } from './dto/create-community.dto';
import { ListCommunitiesQueryDto } from './dto/list-communities-query.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { RolesGuard } from './roles.guard';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Get()
  list(@Query() query: ListCommunitiesQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCommunityDto) {
    return this.service.create(user.sub!, dto);
  }

  @Get(':id/members')
  members(@Param('id') id: string, @Query() query: ListMembersQueryDto) {
    return this.service.listMembers(id, query);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard)
  join(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.join(id, user.sub!);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard)
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.leave(id, user.sub!);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.service.update(id, user.sub!, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
