import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly svc: GovernanceService) {}

  @Post('proposals')
  createProposal(@Body() dto: CreateProposalDto) {
    return this.svc.createProposal(dto);
  }

  @Get('proposals/:id')
  getProposal(@Param('id') id: string) {
    return this.svc.getProposal(id);
  }
}
