/**
 * IPFS Service
 * Main service for IPFS operations with database integration
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IPFSStorageService, IPFSUploadResult } from './ipfs-storage.service';
import { FileValidationService, FileValidationResult } from './file-validation.service';
import { UploadFileDto, FilePurpose } from '../dto/upload-file.dto';
import { IPFSUploadResponseDto, IPFSCIDInfoDto } from '../dto/ipfs-response.dto';

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);

  constructor(
    private prisma: PrismaService,
    private ipfsStorage: IPFSStorageService,
    private fileValidation: FileValidationService
  ) {}

  /**
   * Upload file to IPFS and store metadata in database
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    dto: UploadFileDto
  ): Promise<IPFSUploadResponseDto> {
    try {
      // Validate file
      const validation = this.fileValidation.validateFile(file, dto.purpose);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Upload to IPFS
      const uploadResult = await this.ipfsStorage.uploadFile(file, {
        pin: dto.pin !== false,
        metadata: dto.metadata
      });

      // Store file metadata in database
      const fileRecord = await this.prisma.file.create({
        data: {
          uploaderId: userId,
          filename: uploadResult.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          url: this.ipfsStorage.getGatewayUrl(uploadResult.cid),
          cid: uploadResult.cid,
          purpose: dto.purpose || FilePurpose.OTHER,
          description: dto.description,
          metadata: dto.metadata || {}
        }
      });

      this.logger.log(`File uploaded successfully. CID: ${uploadResult.cid}, File ID: ${fileRecord.id}`);

      return this.mapToUploadResponse(uploadResult, fileRecord.id);
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      throw error;
    }
  }

  /**
   * Upload metadata to IPFS
   */
  async uploadMetadata(
    metadata: Record<string, any>,
    userId: string,
    pin: boolean = true
  ): Promise<{ cid: string; gatewayUrl: string; uploadedAt: Date }> {
    try {
      const uploadResult = await this.ipfsStorage.uploadMetadata(metadata, { pin });

      this.logger.log(`Metadata uploaded successfully. CID: ${uploadResult.cid}`);

      return {
        cid: uploadResult.cid,
        gatewayUrl: this.ipfsStorage.getGatewayUrl(uploadResult.cid),
        uploadedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to upload metadata', error);
      throw error;
    }
  }

  /**
   * Upload directory to IPFS
   */
  async uploadDirectory(
    files: Express.Multer.File[],
    directoryName: string,
    userId: string,
    pin: boolean = true
  ): Promise<IPFSUploadResponseDto> {
    try {
      // Validate all files
      const validations = this.fileValidation.validateFiles(files);
      const invalidFiles = validations.filter(v => !v.valid);
      
      if (invalidFiles.length > 0) {
        throw new Error(
          `File validation failed for ${invalidFiles.length} files: ${invalidFiles.map(v => v.errors.join(', ')).join('; ')}`
        );
      }

      // Upload directory to IPFS
      const uploadResult = await this.ipfsStorage.uploadDirectory(files, directoryName, { pin });

      // Store directory metadata in database
      const fileRecord = await this.prisma.file.create({
        data: {
          uploaderId: userId,
          filename: uploadResult.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          url: this.ipfsStorage.getGatewayUrl(uploadResult.cid),
          cid: uploadResult.cid,
          purpose: FilePurpose.OTHER,
          description: `Directory: ${directoryName}`,
          metadata: {
            type: 'directory',
            fileCount: files.length,
            files: files.map(f => ({
              name: f.originalname,
              size: f.size,
              mimeType: f.mimetype
            }))
          }
        }
      });

      this.logger.log(`Directory uploaded successfully. CID: ${uploadResult.cid}, File ID: ${fileRecord.id}`);

      return this.mapToUploadResponse(uploadResult, fileRecord.id);
    } catch (error) {
      this.logger.error('Failed to upload directory', error);
      throw error;
    }
  }

  /**
   * Batch upload files
   */
  async batchUploadFiles(
    files: Express.Multer.File[],
    userId: string,
    dto: UploadFileDto
  ): Promise<{
    results: IPFSUploadResponseDto[];
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results: IPFSUploadResponseDto[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, userId, dto);
        results.push(result);
      } catch (error) {
        errors.push(`${file.originalname}: ${error.message}`);
      }
    }

    return {
      results,
      total: files.length,
      successful: results.length,
      failed: errors.length,
      errors
    };
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string, userId: string): Promise<any> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Check permission (only uploader can access file details)
      if (file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to access this file');
      }

      return file;
    } catch (error) {
      this.logger.error('Failed to get file', error);
      throw error;
    }
  }

  /**
   * Get file by CID
   */
  async getFileByCID(cid: string, userId: string): Promise<any> {
    try {
      const file = await this.prisma.file.findFirst({
        where: { cid },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Check permission
      if (file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to access this file');
      }

      return file;
    } catch (error) {
      this.logger.error('Failed to get file by CID', error);
      throw error;
    }
  }

  /**
   * Get CID information
   */
  async getCIDInfo(cid: string): Promise<IPFSCIDInfoDto> {
    try {
      const exists = await this.ipfsStorage.cidExists(cid);
      
      if (!exists) {
        throw new NotFoundException('CID not found on IPFS');
      }

      const info = await this.ipfsStorage.getCIDInfo(cid);

      return {
        cid: info.cid,
        size: info.size,
        cumulativeSize: info.cumulativeSize,
        blocks: info.blocks,
        exists: true
      };
    } catch (error) {
      this.logger.error('Failed to get CID info', error);
      throw error;
    }
  }

  /**
   * Pin CID
   */
  async pinCID(cid: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to pin this CID
      const file = await this.prisma.file.findFirst({
        where: { cid }
      });

      if (file && file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to pin this CID');
      }

      await this.ipfsStorage.pinCID(cid);
      this.logger.log(`CID pinned successfully: ${cid}`);
    } catch (error) {
      this.logger.error('Failed to pin CID', error);
      throw error;
    }
  }

  /**
   * Unpin CID
   */
  async unpinCID(cid: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to unpin this CID
      const file = await this.prisma.file.findFirst({
        where: { cid }
      });

      if (file && file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to unpin this CID');
      }

      await this.ipfsStorage.unpinCID(cid);
      this.logger.log(`CID unpinned successfully: ${cid}`);
    } catch (error) {
      this.logger.error('Failed to unpin CID', error);
      throw error;
    }
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      if (file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to delete this file');
      }

      // Soft delete by setting deletedAt
      await this.prisma.file.update({
        where: { id: fileId },
        data: { deletedAt: new Date() }
      });

      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error('Failed to delete file', error);
      throw error;
    }
  }

  /**
   * Get user's files
   */
  async getUserFiles(
    userId: string,
    options: {
      purpose?: FilePurpose;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<{ files: any[]; total: number }> {
    try {
      const { purpose, skip = 0, take = 20 } = options;

      const where: any = {
        uploaderId: userId,
        deletedAt: null
      };

      if (purpose) {
        where.purpose = purpose;
      }

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }),
        this.prisma.file.count({ where })
      ]);

      return { files, total };
    } catch (error) {
      this.logger.error('Failed to get user files', error);
      throw error;
    }
  }

  /**
   * Link file to community
   */
  async linkFileToCommunity(fileId: string, communityId: string, userId: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      if (file.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to link this file');
      }

      await this.prisma.file.update({
        where: { id: fileId },
        data: { communityId }
      });

      this.logger.log(`File linked to community: ${fileId} -> ${communityId}`);
    } catch (error) {
      this.logger.error('Failed to link file to community', error);
      throw error;
    }
  }

  /**
   * Map upload result to response DTO
   */
  private mapToUploadResponse(uploadResult: IPFSUploadResult, fileId: string): IPFSUploadResponseDto {
    return {
      id: fileId,
      cid: uploadResult.cid,
      size: uploadResult.size,
      name: uploadResult.name,
      mimeType: uploadResult.mimeType,
      gatewayUrl: this.ipfsStorage.getGatewayUrl(uploadResult.cid),
      fallbackUrls: [
        this.ipfsStorage.getGatewayUrl(uploadResult.cid, true),
        this.ipfsStorage.getGatewayUrl(uploadResult.cid, true)
      ],
      pinned: true,
      uploadedAt: new Date()
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; nodeId?: string }> {
    return {
      healthy: await this.ipfsStorage.healthCheck(),
      nodeId: undefined // Can be populated if needed
    };
  }
}