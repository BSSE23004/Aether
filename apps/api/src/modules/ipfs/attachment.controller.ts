/**
 * Attachment Controller
 * Handles HTTP requests for file attachments
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { AttachmentService, AttachmentResult } from './services/attachment.service';

@ApiTags('Attachments')
@Controller('attachments')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  /**
   * Upload attachment for message
   */
  @Post('message/:messageId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload attachment for message' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: AttachmentResult })
  async uploadMessageAttachment(
    @Param('messageId') messageId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.attachmentService.createMessageAttachment(messageId, file, userId);
  }

  /**
   * Upload attachment for channel
   */
  @Post('channel/:channelId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload attachment for channel' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: AttachmentResult })
  async uploadChannelAttachment(
    @Param('channelId') channelId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.attachmentService.createChannelAttachment(channelId, file, userId);
  }

  /**
   * Upload attachment for community
   */
  @Post('community/:communityId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload attachment for community' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: AttachmentResult })
  async uploadCommunityAttachment(
    @Param('communityId') communityId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.attachmentService.createCommunityAttachment(communityId, file, userId);
  }

  /**
   * Get attachments for message
   */
  @Get('message/:messageId')
  @ApiOperation({ summary: 'Get attachments for message' })
  @ApiResponse({ status: 200, type: [AttachmentResult] })
  async getMessageAttachments(
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult[]> {
    return await this.attachmentService.getMessageAttachments(messageId, userId);
  }

  /**
   * Get attachments for channel
   */
  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get attachments for channel' })
  @ApiResponse({ status: 200, type: [AttachmentResult] })
  async getChannelAttachments(
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult[]> {
    return await this.attachmentService.getChannelAttachments(channelId, userId);
  }

  /**
   * Get attachment by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  @ApiResponse({ status: 200, type: AttachmentResult })
  async getAttachment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<AttachmentResult> {
    return await this.attachmentService.getAttachment(id, userId);
  }

  /**
   * Delete attachment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete attachment' })
  async deleteAttachment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<{ message: string }> {
    await this.attachmentService.deleteAttachment(id, userId);
    return { message: 'Attachment deleted successfully' };
  }
}