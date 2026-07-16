/**
 * IPFS Storage Service
 * Handles file uploads to IPFS and CID management
 */

import { Injectable, Logger } from '@nestjs/common';
import { create } from 'ipfs-http-client';
import { Readable } from 'stream';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  name: string;
  mimeType: string;
}

export interface IPFSGatewayConfig {
  url: string;
  fallbackUrls: string[];
}

@Injectable()
export class IPFSStorageService {
  private readonly logger = new Logger(IPFSStorageService.name);
  private ipfs: any;
  private gatewayConfig: IPFSGatewayConfig;

  constructor() {
    this.initializeIPFS();
    this.gatewayConfig = {
      url: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
      fallbackUrls: [
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://ipfs.fleek.co/ipfs/'
      ]
    };
  }

  /**
   * Initialize IPFS client
   */
  private initializeIPFS(): void {
    try {
      const ipfsUrl = process.env.IPFS_API_URL || 'http://localhost:5001';
      this.ipfs = create({ url: ipfsUrl });
      this.logger.log(`IPFS client initialized with URL: ${ipfsUrl}`);
    } catch (error) {
      this.logger.error('Failed to initialize IPFS client', error);
      throw new Error('IPFS initialization failed');
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: {
      pin?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<IPFSUploadResult> {
    try {
      this.logger.log(`Uploading file to IPFS: ${file.originalname}`);

      const { cid } = await this.ipfs.add(file.buffer, {
        pin: options?.pin || true,
        cidVersion: 0
      });

      const result: IPFSUploadResult = {
        cid: cid.toString(),
        size: file.size,
        name: file.originalname,
        mimeType: file.mimetype
      };

      this.logger.log(`File uploaded successfully. CID: ${result.cid}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to upload file to IPFS', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(
    metadata: Record<string, any>,
    options?: {
      pin?: boolean;
    }
  ): Promise<IPFSUploadResult> {
    try {
      this.logger.log('Uploading metadata to IPFS');

      const metadataString = JSON.stringify(metadata);
      const buffer = Buffer.from(metadataString);

      const { cid } = await this.ipfs.add(buffer, {
        pin: options?.pin || true,
        cidVersion: 0
      });

      const result: IPFSUploadResult = {
        cid: cid.toString(),
        size: buffer.length,
        name: 'metadata.json',
        mimeType: 'application/json'
      };

      this.logger.log(`Metadata uploaded successfully. CID: ${result.cid}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to upload metadata to IPFS', error);
      throw new Error(`IPFS metadata upload failed: ${error.message}`);
    }
  }

  /**
   * Upload directory to IPFS
   */
  async uploadDirectory(
    files: Express.Multer.File[],
    directoryName: string,
    options?: {
      pin?: boolean;
    }
  ): Promise<IPFSUploadResult> {
    try {
      this.logger.log(`Uploading directory to IPFS: ${directoryName}`);

      // Create directory structure for IPFS
      const directory: any = {};
      
      for (const file of files) {
        directory[file.originalname] = {
          content: file.buffer,
          mode: 0o644
        };
      }

      const { cid } = await this.ipfs.add(directory, {
        pin: options?.pin || true,
        cidVersion: 0,
        wrapWithDirectory: true
      });

      const result: IPFSUploadResult = {
        cid: cid.toString(),
        size: files.reduce((acc, f) => acc + f.size, 0),
        name: directoryName,
        mimeType: 'directory'
      };

      this.logger.log(`Directory uploaded successfully. CID: ${result.cid}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to upload directory to IPFS', error);
      throw new Error(`IPFS directory upload failed: ${error.message}`);
    }
  }

  /**
   * Pin CID to IPFS
   */
  async pinCID(cid: string): Promise<void> {
    try {
      this.logger.log(`Pinning CID: ${cid}`);
      await this.ipfs.pin.add(cid);
      this.logger.log(`CID pinned successfully: ${cid}`);
    } catch (error) {
      this.logger.error(`Failed to pin CID: ${cid}`, error);
      throw new Error(`IPFS pin failed: ${error.message}`);
    }
  }

  /**
   * Unpin CID from IPFS
   */
  async unpinCID(cid: string): Promise<void> {
    try {
      this.logger.log(`Unpinning CID: ${cid}`);
      await this.ipfs.pin.rm(cid);
      this.logger.log(`CID unpinned successfully: ${cid}`);
    } catch (error) {
      this.logger.error(`Failed to unpin CID: ${cid}`, error);
      throw new Error(`IPFS unpin failed: ${error.message}`);
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(cid: string): Promise<Buffer> {
    try {
      this.logger.log(`Fetching file from IPFS: ${cid}`);
      
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      this.logger.log(`File fetched successfully. Size: ${buffer.length}`);
      
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to fetch file from IPFS: ${cid}`, error);
      throw new Error(`IPFS fetch failed: ${error.message}`);
    }
  }

  /**
   * Get gateway URL for CID
   */
  getGatewayUrl(cid: string, useFallback: boolean = false): string {
    if (useFallback && this.gatewayConfig.fallbackUrls.length > 0) {
      const fallbackIndex = Math.floor(Math.random() * this.gatewayConfig.fallbackUrls.length);
      return this.gatewayConfig.fallbackUrls[fallbackIndex] + cid;
    }
    return this.gatewayConfig.url + cid;
  }

  /**
   * Check if CID exists on IPFS
   */
  async cidExists(cid: string): Promise<boolean> {
    try {
      await this.ipfs.stat(cid);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get CID information
   */
  async getCIDInfo(cid: string): Promise<{
    cid: string;
    size: number;
    cumulativeSize: number;
    blocks: number;
  }> {
    try {
      const stat = await this.ipfs.stat(cid);
      return {
        cid: stat.cid.toString(),
        size: stat.size,
        cumulativeSize: stat.cumulativeSize,
        blocks: stat.blocks
      };
    } catch (error) {
      this.logger.error(`Failed to get CID info: ${cid}`, error);
      throw new Error(`IPFS stat failed: ${error.message}`);
    }
  }

  /**
   * Health check for IPFS connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const id = await this.ipfs.id();
      this.logger.log(`IPFS node ID: ${id.id}`);
      return true;
    } catch (error) {
      this.logger.error('IPFS health check failed', error);
      return false;
    }
  }
}