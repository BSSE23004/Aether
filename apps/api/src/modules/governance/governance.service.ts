import { Injectable } from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class GovernanceService {
  async createProposal(dto: CreateProposalDto) {
    return { id: 'prop-1', ...dto };
  }

  async getProposal(id: string) {
    return { id, title: 'Seed Proposal' };
  }
}
