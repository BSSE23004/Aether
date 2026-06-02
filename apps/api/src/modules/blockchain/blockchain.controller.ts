import { Controller, Get } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly svc: BlockchainService) {}

  @Get('status')
  status() {
    return this.svc.getStatus();
  }
}
