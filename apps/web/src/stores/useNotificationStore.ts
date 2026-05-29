/**
 * Notification store - toast/notification state
 */

import { create } from 'zustand';
import type { Notification } from '@/types';

export interface NotificationItem extends Notification {
  id: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    return id;
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
