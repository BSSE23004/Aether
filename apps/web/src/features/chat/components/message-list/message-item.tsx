/**
 * MessageItem - complete message item with header, bubble, and reactions
 */

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Message, MessageReaction } from '@/types';
import { MessageBubble } from './message-bubble';
import { MessageHeader } from './message-header';
import { MessageReactions } from './message-reactions';
import { isOwnMessage } from '../../utils';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  showHeader?: boolean;
  isOptimistic?: boolean;
  reactions?: MessageReaction[];
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  canReact?: boolean;
}

export const MessageItem = memo<MessageItemProps>(({
  message,
  currentUserId,
  showAvatar = true,
  showHeader = true,
  isOptimistic = false,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  canReact = true,
}) => {
  const isOwn = isOwnMessage(message, currentUserId);

  return (
    <div className={cn('group', isOwn ? 'ml-auto' : 'mr-auto', 'w-full max-w-[70%]')}>
      <MessageBubble
        message={message}
        currentUserId={currentUserId}
        showAvatar={showAvatar}
        showHeader={showHeader}
        isOptimistic={isOptimistic}
      />
      
      {reactions.length > 0 && (
        <div className={cn('mt-1', isOwn ? 'flex justify-end' : 'flex justify-start')}>
          <MessageReactions
            reactions={reactions}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
            canReact={canReact}
          />
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';