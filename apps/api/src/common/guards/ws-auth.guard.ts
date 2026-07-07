import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../database/prisma.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const userId = client.data?.user?.id;

    if (!userId) {
      throw new WsException('Unauthorized: No user found on socket');
    }

    const channelId = data?.channelId;
    if (!channelId) {
      // If no channelId in payload, we let it pass or fail depending on strictness.
      // For chat operations, channelId is required. Let's assume it's required if hitting protected events.
      throw new WsException('Bad Request: channelId is missing');
    }

    // Verify channel membership
    const membership = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership || !membership.isActive || membership.deletedAt !== null) {
      this.logger.warn(`User ${userId} attempted to access channel ${channelId} without permission.`);
      throw new WsException('Forbidden: You are not a member of this channel');
    }

    return true;
  }
}
