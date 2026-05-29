/**
 * Governance (Proposals & Voting) feature types
 */

import type { Proposal } from '@/types';

export interface CreateProposalInput {
  title: string;
  description: string;
}

export interface VoteInput {
  proposalId: string;
  vote: 'for' | 'against';
}
