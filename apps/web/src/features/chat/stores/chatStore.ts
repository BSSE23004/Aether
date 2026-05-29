/**
 * Chat store
 */

import { create } from 'zustand';
import type { Message } from '@/types';

interface ChatStoreState {
  selectedCommunityId: string | null;
  messages: Message[];
  isTyping: Record<string, boolean>;
  setSelectedCommunity: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  selectedCommunityId: null,
  messages: [],
  isTyping: {},
  setSelectedCommunity: (id) => set({ selectedCommunityId: id }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setUserTyping: (userId, isTyping) =>
    set((state) => ({
      isTyping: { ...state.isTyping, [userId]: isTyping },
    })),
}));
