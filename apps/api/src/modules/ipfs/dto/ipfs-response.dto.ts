/**
 * Response DTOs for IPFS operations
 */

import { ApiProperty } from '@nestjs/swagger';

export class IPFSUploadResponseDto {
  @ApiProperty({
    description: 'Database ID of the file record',
    example: 'clxxxxxxxxxxxxxxx'
  })
  id: string;

  @ApiProperty({
    description: 'IPFS CID of the uploaded file',
    example: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  cid: string;

  @ApiProperty({
    description: 'Size of the uploaded file in bytes',
    example: 1024
  })
  size: number;

  @ApiProperty({
    description: 'Original name of the file',
    example: 'image.png'
  })
  name: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png'
  })
  mimeType: string;

  @ApiProperty({
    description: 'Gateway URL to access the file',
    example: 'https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  gatewayUrl: string;

  @ApiProperty({
    description: 'Fallback gateway URLs',
    example: ['https://gateway.pinata.cloud/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX']
  })
  fallbackUrls: string[];

  @ApiProperty({
    description: 'Whether the file is pinned',
    example: true
  })
  pinned: boolean;

  @ApiProperty({
    description: 'Timestamp of upload',
    example: '2024-01-01T00:00:00.000Z'
  })
  uploadedAt: Date;
}

export class IPFSMetadataResponseDto {
  @ApiProperty({
    description: 'IPFS CID of the uploaded metadata',
    example: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  cid: string;

  @ApiProperty({
    description: 'Gateway URL to access the metadata',
    example: 'https://ipfs.io/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  gatewayUrl: string;

  @ApiProperty({
    description: 'Whether the metadata is pinned',
    example: true
  })
  pinned: boolean;

  @ApiProperty({
    description: 'Timestamp of upload',
    example: '2024-01-01T00:00:00.000Z'
  })
  uploadedAt: Date;
}

export class IPFSCIDInfoDto {
  @ApiProperty({
    description: 'IPFS CID',
    example: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  cid: string;

  @ApiProperty({
    description: 'Size of the content in bytes',
    example: 1024
  })
  size: number;

  @ApiProperty({
    description: 'Cumulative size including DAG structure',
    example: 2048
  })
  cumulativeSize: number;

  @ApiProperty({
    description: 'Number of blocks in the DAG',
    example: 1
  })
  blocks: number;

  @ApiProperty({
    description: 'Whether the CID exists on the IPFS node',
    example: true
  })
  exists: boolean;
}

export class IPFSHealthResponseDto {
  @ApiProperty({
    description: 'Whether IPFS service is healthy',
    example: true
  })
  healthy: boolean;

  @ApiProperty({
    description: 'IPFS node ID',
    example: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX'
  })
  nodeId?: string;

  @ApiProperty({
    description: 'Gateway configuration',
    type: 'object'
  })
  gateway: {
    url: string;
    fallbackUrls: string[];
  };
}

export class BatchUploadResponseDto {
  @ApiProperty({
    description: 'Array of upload results',
    type: [IPFSUploadResponseDto]
  })
  results: IPFSUploadResponseDto[];

  @ApiProperty({
    description: 'Total number of files uploaded',
    example: 5
  })
  total: number;

  @ApiProperty({
    description: 'Number of successful uploads',
    example: 5
  })
  successful: number;

  @ApiProperty({
    description: 'Number of failed uploads',
    example: 0
  })
  failed: number;

  @ApiProperty({
    description: 'Errors from failed uploads',
    example: []
  })
  errors: string[];
}