/**
 * Chat feature types
 */

import type { Message } from '@/types';

export interface ChatState {
  selectedCommunityId: string | null;
  messages: Message[];
  isLoading: boolean;
}

export interface SendMessagePayload {
  content: string;
}
