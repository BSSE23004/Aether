/**
 * DTOs for IPFS file upload operations
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, IsObject } from 'class-validator';

export enum FilePurpose {
  AVATAR = 'avatar',
  COMMUNITY = 'community',
  ATTACHMENT = 'attachment',
  METADATA = 'metadata',
  OTHER = 'other'
}

export class UploadFileDto {
  @ApiProperty({
    description: 'Purpose of the file upload',
    enum: FilePurpose,
    default: FilePurpose.OTHER
  })
  @IsEnum(FilePurpose)
  @IsOptional()
  purpose?: FilePurpose;

  @ApiPropertyOptional({
    description: 'Optional description for the file',
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether to pin the file on IPFS',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  pin?: boolean;

  @ApiPropertyOptional({
    description: 'Optional metadata to store with the file',
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UploadMetadataDto {
  @ApiProperty({
    description: 'Metadata object to upload to IPFS',
    type: 'object'
  })
  @IsObject()
  metadata: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether to pin the metadata on IPFS',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  pin?: boolean;
}

export class UploadDirectoryDto {
  @ApiProperty({
    description: 'Name of the directory',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  directoryName: string;

  @ApiPropertyOptional({
    description: 'Whether to pin the directory on IPFS',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  pin?: boolean;

  @ApiPropertyOptional({
    description: 'Optional metadata to store with the directory',
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PinCIDDto {
  @ApiProperty({
    description: 'CID to pin'
  })
  @IsString()
  cid: string;
}

export class UnpinCIDDto {
  @ApiProperty({
    description: 'CID to unpin'
  })
  @IsString()
  cid: string;
}

export class GetFileDto {
  @ApiProperty({
    description: 'CID of the file to retrieve'
  })
  @IsString()
  cid: string;

  @ApiPropertyOptional({
    description: 'Whether to use fallback gateway',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  useFallback?: boolean;
}

export class BatchUploadDto {
  @ApiProperty({
    description: 'Purpose of the batch upload',
    enum: FilePurpose,
    default: FilePurpose.OTHER
  })
  @IsEnum(FilePurpose)
  @IsOptional()
  purpose?: FilePurpose;

  @ApiPropertyOptional({
    description: 'Whether to pin all files',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  pin?: boolean;

  @ApiPropertyOptional({
    description: 'Optional metadata for all files',
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}