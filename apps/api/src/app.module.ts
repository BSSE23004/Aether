/**
 * AppModule - Root application module
 *
 * Imports:
 * - Config module (environment validation)
 * - Database module (Prisma)
 * - Feature modules (auth, users, communities, etc.)
 * - Gateway modules (WebSocket)
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Core modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';

// Common modules
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Feature modules (scaffolded)
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { FilesModule } from './modules/files/files.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { IPFSModule } from './modules/ipfs/ipfs.module';

// Gateway modules
import { GatewaysModule } from './gateways/gateways.module';

@Module({
  imports: [
    // Configuration
    AppConfigModule,

    // NestJS environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Infrastructure
    DatabaseModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    CommunitiesModule,
    ChannelsModule,
    MessagesModule,
    FilesModule,
    GovernanceModule,
    BlockchainModule,
    NotificationsModule,
    IndexerModule,
    IPFSModule,

    // Gateways
    GatewaysModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Response interceptor (applied first, wraps all responses)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
