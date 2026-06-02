import { Controller, Get, Param, Post } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly svc: FilesService) {}

  @Post('upload')
  upload() {
    return { message: 'upload endpoint - implement multipart handling' };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}
