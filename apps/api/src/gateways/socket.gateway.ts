import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyJwt } from '../modules/auth/auth.jwt';
import { MessagesService } from '../modules/messages/messages.service';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { CreateMessageDto } from '../modules/messages/dto/create-message.dto';
import { UpdateMessageDto } from '../modules/messages/dto/update-message.dto';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = verifyJwt(token);
      client.data.user = { id: payload.sub, address: payload.address };
      
      this.logger.log(`Client connected: ${client.id} (User: ${client.data.user.id})`);
    } catch (error: any) {
      this.logger.warn(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join_channel')
  handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    if (!data?.channelId) return;
    client.join(`channel_${data.channelId}`);
    this.logger.debug(`User ${client.data.user.id} joined channel_${data.channelId}`);
  }

  @SubscribeMessage('leave_channel')
  handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    if (!data?.channelId) return;
    client.leave(`channel_${data.channelId}`);
    this.logger.debug(`User ${client.data.user.id} left channel_${data.channelId}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    try {
      // 1. Save to database
      const message = await this.messagesService.create({
        channelId: data.channelId,
        content: data.content,
        authorId: client.data.user.id,
        metadata: data.metadata,
      });

      // 2. Broadcast to room
      this.server.to(`channel_${data.channelId}`).emit('new_message', message);
      
      return { status: 'success', data: message };
    } catch (error: any) {
      this.logger.error('Failed to send message', error);
      return { status: 'error', error: error.message };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('edit_message')
  async handleEditMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string; messageId: string } & UpdateMessageDto) {
    try {
      const updatedMessage = await this.messagesService.update(
        data.messageId,
        client.data.user.id,
        data.content,
        data.metadata
      );

      this.server.to(`channel_${data.channelId}`).emit('message_edited', updatedMessage);
      
      return { status: 'success', data: updatedMessage };
    } catch (error: any) {
      this.logger.error('Failed to edit message', error);
      return { status: 'error', error: error.message };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string; messageId: string }) {
    try {
      await this.messagesService.delete(data.messageId, client.data.user.id);
      
      this.server.to(`channel_${data.channelId}`).emit('message_deleted', {
        messageId: data.messageId,
        channelId: data.channelId,
        deletedAt: new Date().toISOString()
      });
      
      return { status: 'success', data: { messageId: data.messageId } };
    } catch (error: any) {
      this.logger.error('Failed to delete message', error);
      return { status: 'error', error: error.message };
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing_start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.to(`channel_${data.channelId}`).emit('user_typing', {
      userId: client.data.user.id,
      channelId: data.channelId,
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing_end')
  handleTypingEnd(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    client.to(`channel_${data.channelId}`).emit('user_stop_typing', {
      userId: client.data.user.id,
      channelId: data.channelId,
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('read_receipt')
  handleReadReceipt(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string; messageId: string }) {
    // Basic read receipt implementation (broadcasts to active users in room)
    client.to(`channel_${data.channelId}`).emit('message_read', {
      userId: client.data.user.id,
      messageId: data.messageId,
      channelId: data.channelId,
    });
  }
}
