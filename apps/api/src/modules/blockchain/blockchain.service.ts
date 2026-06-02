import { Injectable } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  getStatus() {
    return { network: process.env.BLOCKCHAIN_NETWORK || 'base-sepolia' };
  }
}
