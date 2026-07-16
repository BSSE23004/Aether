/**
 * IPFS Module
 * Handles IPFS file storage and CID management
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { IPFSController } from './ipfs.controller';
import { IPFSService } from './services/ipfs.service';
import { IPFSStorageService } from './services/ipfs-storage.service';
import { FileValidationService } from './services/file-validation.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, callback) => {
        // Allow all file types, validation happens in service
        callback(null, true);
      },
    }),
  ],
  controllers: [IPFSController],
  providers: [
    IPFSService,
    IPFSStorageService,
    FileValidationService,
  ],
  exports: [
    IPFSService,
    IPFSStorageService,
    FileValidationService,
  ],
})
export class IPFSModule {}