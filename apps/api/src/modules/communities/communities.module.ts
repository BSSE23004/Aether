import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { RolesGuard } from './roles.guard';

@Module({
	controllers: [CommunitiesController],
	providers: [CommunitiesService, RolesGuard],
	exports: [CommunitiesService],
})
export class CommunitiesModule {}
