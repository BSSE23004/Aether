/**
 * Attachment Service
 * Handles file attachments for messages and other entities
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IPFSService } from './ipfs.service';
import { FilePurpose } from '../dto/upload-file.dto';

export interface CreateAttachmentDto {
  messageId?: string;
  channelId?: string;
  communityId?: string;
  filename: string;
  mimeType: string;
  size: number;
  cid: string;
  url: string;
  description?: string;
}

export interface AttachmentResult {
  id: string;
  cid: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private prisma: PrismaService,
    private ipfsService: IPFSService
  ) {}

  /**
   * Create attachment for message
   */
  async createMessageAttachment(
    messageId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<AttachmentResult> {
    try {
      // Verify user has access to the message
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          channel: {
            include: {
              community: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.channel.community.members.length === 0) {
        throw new ForbiddenException('You do not have access to this message');
      }

      // Upload file to IPFS
      const uploadResult = await this.ipfsService.uploadFile(file, userId, {
        purpose: FilePurpose.ATTACHMENT,
        pin: true
      });

      // Create attachment record
      const attachment = await this.prisma.file.create({
        data: {
          uploaderId: userId,
          messageId,
          channelId: message.channelId,
          communityId: message.channel.communityId,
          filename: uploadResult.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          url: uploadResult.gatewayUrl,
          cid: uploadResult.cid,
          purpose: FilePurpose.ATTACHMENT,
          pinned: true
        }
      });

      this.logger.log(`Message attachment created: ${attachment.id} for message ${messageId}`);

      return {
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      };
    } catch (error) {
      this.logger.error('Failed to create message attachment', error);
      throw error;
    }
  }

  /**
   * Create attachment for channel
   */
  async createChannelAttachment(
    channelId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<AttachmentResult> {
    try {
      // Verify user has access to the channel
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          community: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!channel) {
        throw new NotFoundException('Channel not found');
      }

      if (channel.community.members.length === 0) {
        throw new ForbiddenException('You do not have access to this channel');
      }

      // Upload file to IPFS
      const uploadResult = await this.ipfsService.uploadFile(file, userId, {
        purpose: FilePurpose.ATTACHMENT,
        pin: true
      });

      // Create attachment record
      const attachment = await this.prisma.file.create({
        data: {
          uploaderId: userId,
          channelId,
          communityId: channel.communityId,
          filename: uploadResult.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          url: uploadResult.gatewayUrl,
          cid: uploadResult.cid,
          purpose: FilePurpose.ATTACHMENT,
          pinned: true
        }
      });

      this.logger.log(`Channel attachment created: ${attachment.id} for channel ${channelId}`);

      return {
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      };
    } catch (error) {
      this.logger.error('Failed to create channel attachment', error);
      throw error;
    }
  }

  /**
   * Create attachment for community
   */
  async createCommunityAttachment(
    communityId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<AttachmentResult> {
    try {
      // Verify user has access to the community
      const community = await this.prisma.community.findUnique({
        where: { id: communityId },
        include: {
          members: {
            where: { userId }
          }
        }
      });

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      if (community.members.length === 0) {
        throw new ForbiddenException('You do not have access to this community');
      }

      // Upload file to IPFS
      const uploadResult = await this.ipfsService.uploadFile(file, userId, {
        purpose: FilePurpose.ATTACHMENT,
        pin: true
      });

      // Create attachment record
      const attachment = await this.prisma.file.create({
        data: {
          uploaderId: userId,
          communityId,
          filename: uploadResult.name,
          mimeType: uploadResult.mimeType,
          size: uploadResult.size,
          url: uploadResult.gatewayUrl,
          cid: uploadResult.cid,
          purpose: FilePurpose.ATTACHMENT,
          pinned: true
        }
      });

      this.logger.log(`Community attachment created: ${attachment.id} for community ${communityId}`);

      return {
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      };
    } catch (error) {
      this.logger.error('Failed to create community attachment', error);
      throw error;
    }
  }

  /**
   * Get attachments for message
   */
  async getMessageAttachments(messageId: string, userId: string): Promise<AttachmentResult[]> {
    try {
      // Verify user has access to the message
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          channel: {
            include: {
              community: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.channel.community.members.length === 0) {
        throw new ForbiddenException('You do not have access to this message');
      }

      const attachments = await this.prisma.file.findMany({
        where: {
          messageId,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      });

      return attachments.map(attachment => ({
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      }));
    } catch (error) {
      this.logger.error('Failed to get message attachments', error);
      throw error;
    }
  }

  /**
   * Get attachments for channel
   */
  async getChannelAttachments(channelId: string, userId: string): Promise<AttachmentResult[]> {
    try {
      // Verify user has access to the channel
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          community: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!channel) {
        throw new NotFoundException('Channel not found');
      }

      if (channel.community.members.length === 0) {
        throw new ForbiddenException('You do not have access to this channel');
      }

      const attachments = await this.prisma.file.findMany({
        where: {
          channelId,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      });

      return attachments.map(attachment => ({
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      }));
    } catch (error) {
      this.logger.error('Failed to get channel attachments', error);
      throw error;
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    try {
      const attachment = await this.prisma.file.findUnique({
        where: { id: attachmentId }
      });

      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }

      // Check permission
      if (attachment.uploaderId !== userId) {
        throw new ForbiddenException('You do not have permission to delete this attachment');
      }

      // Soft delete
      await this.prisma.file.update({
        where: { id: attachmentId },
        data: { deletedAt: new Date() }
      });

      this.logger.log(`Attachment deleted: ${attachmentId}`);
    } catch (error) {
      this.logger.error('Failed to delete attachment', error);
      throw error;
    }
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId: string, userId: string): Promise<AttachmentResult> {
    try {
      const attachment = await this.prisma.file.findUnique({
        where: { id: attachmentId },
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

      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }

      // Check permission based on attachment context
      if (attachment.uploaderId !== userId) {
        // If not uploader, check if user has access to the related entity
        if (attachment.messageId) {
          const message = await this.prisma.message.findUnique({
            where: { id: attachment.messageId },
            include: {
              channel: {
                include: {
                  community: {
                    include: {
                      members: {
                        where: { userId }
                      }
                    }
                  }
                }
              }
            }
          });

          if (!message || message.channel.community.members.length === 0) {
            throw new ForbiddenException('You do not have permission to access this attachment');
          }
        } else if (attachment.channelId) {
          const channel = await this.prisma.channel.findUnique({
            where: { id: attachment.channelId },
            include: {
              community: {
                include: {
                  members: {
                    where: { userId }
                  }
                }
              }
            }
          });

          if (!channel || channel.community.members.length === 0) {
            throw new ForbiddenException('You do not have permission to access this attachment');
          }
        } else if (attachment.communityId) {
          const community = await this.prisma.community.findUnique({
            where: { id: attachment.communityId },
            include: {
              members: {
                where: { userId }
              }
            }
          });

          if (!community || community.members.length === 0) {
            throw new ForbiddenException('You do not have permission to access this attachment');
          }
        } else {
          throw new ForbiddenException('You do not have permission to access this attachment');
        }
      }

      return {
        id: attachment.id,
        cid: attachment.cid,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      };
    } catch (error) {
      this.logger.error('Failed to get attachment', error);
      throw error;
    }
  }
}