/**
 * Chat store
 */

import { create } from 'zustand';
import type { Message } from '@/types';

interface ChatStoreState {
  selectedCommunityId: string | null;
  selectedChannelId: string | null;
  messages: Record<string, Message[]>; // messages by channel ID
  isTyping: Record<string, boolean>;
  isConnected: boolean;
  setSelectedCommunity: (id: string | null) => void;
  setSelectedChannel: (id: string | null) => void;
  addMessage: (channelId: string, message: Message) => void;
  setMessages: (channelId: string, messages: Message[]) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  getChannelMessages: (channelId: string) => Message[];
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  selectedCommunityId: null,
  selectedChannelId: null,
  messages: {},
  isTyping: {},
  isConnected: false,
  setSelectedCommunity: (id) => set({ selectedCommunityId: id }),
  setSelectedChannel: (id) => set({ selectedChannelId: id }),
  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), message],
      },
    })),
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages },
    })),
  setUserTyping: (userId, isTyping) =>
    set((state) => ({
      isTyping: { ...state.isTyping, [userId]: isTyping },
    })),
  setConnected: (isConnected) => set({ isConnected }),
  getChannelMessages: (channelId) => get().messages[channelId] || [],
}));
