import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMessageDto & { authorId: string }) {
    try {
      const message = await this.prisma.message.create({
        data: {
          content: dto.content,
          channelId: dto.channelId,
          authorId: dto.authorId,
          // Optional metadata support (e.g. attachments, mentions)
          metadata: dto.metadata ? dto.metadata : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              wallets: {
                where: { isPrimary: true },
                select: { address: true }
              }
            }
          }
        }
      });
      return message;
    } catch (error) {
      this.logger.error(`Failed to create message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByChannel(channelId: string, limit = 50, cursor?: string) {
    return this.prisma.message.findMany({
      where: { channelId, deletedAt: null },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true }
            }
          }
        }
      }
    });
  }

  async update(messageId: string, authorId: string, content: string, metadata?: any) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt !== null) {
      throw new Error('Message not found');
    }
    if (message.authorId !== authorId) {
      throw new Error('Unauthorized to edit this message');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        metadata: metadata ? metadata : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true }
            }
          }
        }
      }
    });
  }

  async delete(messageId: string, authorId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt !== null) {
      throw new Error('Message not found');
    }
    if (message.authorId !== authorId) {
      throw new Error('Unauthorized to delete this message');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}
