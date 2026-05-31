/**
 * AppController - Root application controller
 *
 * Public endpoints:
 * - GET /health - System health check
 * - GET /info - API information
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('info')
  @Public()
  getInfo() {
    return this.appService.getInfo();
  }
}
