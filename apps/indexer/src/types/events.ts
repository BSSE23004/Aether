/**
 * Event type definitions for blockchain events
 */

export enum EventType {
  COMMUNITY_CREATED = 'COMMUNITY_CREATED',
  COMMUNITY_UPDATED = 'COMMUNITY_UPDATED',
  COMMUNITY_DEACTIVATED = 'COMMUNITY_DEACTIVATED',
  COMMUNITY_ACTIVATED = 'COMMUNITY_ACTIVATED',
  COMMUNITY_ADMIN_ADDED = 'COMMUNITY_ADMIN_ADDED',
  COMMUNITY_ADMIN_REMOVED = 'COMMUNITY_ADMIN_REMOVED',
  COMMUNITY_VERIFICATION_REQUESTED = 'COMMUNITY_VERIFICATION_REQUESTED',
  COMMUNITY_VERIFIED = 'COMMUNITY_VERIFIED',
  COMMUNITY_STATS_UPDATED = 'COMMUNITY_STATS_UPDATED',
  
  MEMBERSHIP_MINTED = 'MEMBERSHIP_MINTED',
  MEMBERSHIP_BURNED = 'MEMBERSHIP_BURNED',
  MEMBERSHIP_PRICE_UPDATED = 'MEMBERSHIP_PRICE_UPDATED',
  TREASURY_UPDATED = 'TREASURY_UPDATED',
  MAX_SUPPLY_UPDATED = 'MAX_SUPPLY_UPDATED',
  MEMBERSHIP_EXTENDED = 'MEMBERSHIP_EXTENDED',
  
  PROPOSAL_CREATED = 'PROPOSAL_CREATED',
  VOTE_CAST = 'VOTE_CAST',
  PROPOSAL_EXECUTED = 'PROPOSAL_EXECUTED',
  PROPOSAL_CANCELED = 'PROPOSAL_CANCELED',
  MEMBERSHIP_CONTRACT_UPDATED = 'MEMBERSHIP_CONTRACT_UPDATED',
  VOTING_PARAMETERS_UPDATED = 'VOTING_PARAMETERS_UPDATED'
}

export interface CommunityEvent {
  communityId: number;
  name?: string;
  description?: string;
  metadataURI?: string;
  creator?: string;
  admin?: string;
  addedBy?: string;
  removedBy?: string;
  requester?: string;
  verifier?: string;
  memberCount?: number;
  channelCount?: number;
  messageCount?: number;
  timestamp: number;
}

export interface MembershipEvent {
  tokenId: number;
  member: string;
  price?: number;
  expiry?: number;
  timestamp: number;
}

export interface GovernanceEvent {
  proposalId: number;
  proposer?: string;
  voter?: string;
  support?: number;
  weight?: number;
  targets?: string[];
  values?: bigint[];
  calldatas?: string[];
  description?: string;
  timestamp: number;
}