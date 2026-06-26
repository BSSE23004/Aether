import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessagesModule } from '../modules/messages/messages.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [MessagesModule, DatabaseModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class GatewaysModule {}
