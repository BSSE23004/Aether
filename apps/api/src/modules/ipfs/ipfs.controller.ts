/**
 * IPFS Controller
 * Handles HTTP requests for IPFS operations
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { IPFSService } from './services/ipfs.service';
import {
  UploadFileDto,
  UploadMetadataDto,
  UploadDirectoryDto,
  PinCIDDto,
  UnpinCIDDto,
  GetFileDto,
  FilePurpose
} from './dto/upload-file.dto';
import {
  IPFSUploadResponseDto,
  IPFSMetadataResponseDto,
  IPFSCIDInfoDto,
  IPFSHealthResponseDto,
  BatchUploadResponseDto
} from './dto/ipfs-response.dto';

@ApiTags('IPFS')
@Controller('ipfs')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class IPFSController {
  constructor(private readonly ipfsService: IPFSService) {}

  /**
   * Upload single file to IPFS
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload single file to IPFS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: IPFSUploadResponseDto })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body() dto: UploadFileDto
  ): Promise<IPFSUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return await this.ipfsService.uploadFile(file, userId, dto);
  }

  /**
   * Upload metadata to IPFS
   */
  @Post('upload/metadata')
  @ApiOperation({ summary: 'Upload metadata to IPFS' })
  @ApiResponse({ status: 201, type: IPFSMetadataResponseDto })
  async uploadMetadata(
    @Body() dto: UploadMetadataDto,
    @CurrentUser('id') userId: string
  ): Promise<IPFSMetadataResponseDto> {
    const result = await this.ipfsService.uploadMetadata(
      dto.metadata,
      userId,
      dto.pin !== false
    );

    return {
      cid: result.cid,
      gatewayUrl: result.gatewayUrl,
      pinned: dto.pin !== false,
      uploadedAt: result.uploadedAt
    };
  }

  /**
   * Upload directory to IPFS
   */
  @Post('upload/directory')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload directory to IPFS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: IPFSUploadResponseDto })
  async uploadDirectory(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadDirectoryDto,
    @CurrentUser('id') userId: string
  ): Promise<IPFSUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    return await this.ipfsService.uploadDirectory(
      files,
      dto.directoryName,
      userId,
      dto.pin !== false
    );
  }

  /**
   * Batch upload files
   */
  @Post('upload/batch')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiOperation({ summary: 'Batch upload files to IPFS' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: BatchUploadResponseDto })
  async batchUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @Body() dto: UploadFileDto
  ): Promise<BatchUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    return await this.ipfsService.batchUploadFiles(files, userId, dto);
  }

  /**
   * Get file by ID
   */
  @Get('file/:id')
  @ApiOperation({ summary: 'Get file by ID' })
  async getFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<any> {
    return await this.ipfsService.getFile(id, userId);
  }

  /**
   * Get file by CID
   */
  @Get('cid/:cid')
  @ApiOperation({ summary: 'Get file by CID' })
  async getFileByCID(
    @Param('cid') cid: string,
    @CurrentUser('id') userId: string
  ): Promise<any> {
    return await this.ipfsService.getFileByCID(cid, userId);
  }

  /**
   * Get CID information
   */
  @Get('info/:cid')
  @Public()
  @ApiOperation({ summary: 'Get CID information' })
  @ApiResponse({ status: 200, type: IPFSCIDInfoDto })
  async getCIDInfo(@Param('cid') cid: string): Promise<IPFSCIDInfoDto> {
    return await this.ipfsService.getCIDInfo(cid);
  }

  /**
   * Pin CID
   */
  @Post('pin')
  @ApiOperation({ summary: 'Pin CID to IPFS' })
  async pinCID(
    @Body() dto: PinCIDDto,
    @CurrentUser('id') userId: string
  ): Promise<{ message: string }> {
    await this.ipfsService.pinCID(dto.cid, userId);
    return { message: `CID ${dto.cid} pinned successfully` };
  }

  /**
   * Unpin CID
   */
  @Delete('pin')
  @ApiOperation({ summary: 'Unpin CID from IPFS' })
  async unpinCID(
    @Body() dto: UnpinCIDDto,
    @CurrentUser('id') userId: string
  ): Promise<{ message: string }> {
    await this.ipfsService.unpinCID(dto.cid, userId);
    return { message: `CID ${dto.cid} unpinned successfully` };
  }

  /**
   * Delete file
   */
  @Delete('file/:id')
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<{ message: string }> {
    await this.ipfsService.deleteFile(id, userId);
    return { message: 'File deleted successfully' };
  }

  /**
   * Get user's files
   */
  @Get('files')
  @ApiOperation({ summary: 'Get user files' })
  async getUserFiles(
    @CurrentUser('id') userId: string,
    @Query('purpose') purpose?: FilePurpose,
    @Query('skip', ParseIntPipe) skip: number = 0,
    @Query('take', ParseIntPipe) take: number = 20
  ): Promise<{ files: any[]; total: number }> {
    return await this.ipfsService.getUserFiles(userId, { purpose, skip, take });
  }

  /**
   * Link file to community
   */
  @Put('file/:id/community/:communityId')
  @ApiOperation({ summary: 'Link file to community' })
  async linkFileToCommunity(
    @Param('id') id: string,
    @Param('communityId') communityId: string,
    @CurrentUser('id') userId: string
  ): Promise<{ message: string }> {
    await this.ipfsService.linkFileToCommunity(id, communityId, userId);
    return { message: 'File linked to community successfully' };
  }

  /**
   * Health check
   */
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'IPFS health check' })
  @ApiResponse({ status: 200, type: IPFSHealthResponseDto })
  async healthCheck(): Promise<IPFSHealthResponseDto> {
    const health = await this.ipfsService.healthCheck();
    
    return {
      healthy: health.healthy,
      nodeId: health.nodeId,
      gateway: {
        url: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
        fallbackUrls: [
          'https://gateway.pinata.cloud/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/',
          'https://ipfs.fleek.co/ipfs/'
        ]
      }
    };
  }
}