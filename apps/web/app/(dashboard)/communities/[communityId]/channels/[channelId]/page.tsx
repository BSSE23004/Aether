/**
 * Channel page - displays chat for a specific channel
 */

'use client';

import { useParams } from 'next/navigation';
import { CommunityPage } from '@/features/communities/components/community-page';
import { ChatContainer } from '@/features/chat/components/chat-container';
import { ChatHeader } from '@/features/chat/components/chat-header';
import { useCommunityChannels } from '@/features/communities/hooks/use-communities';

export default function ChannelPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const channelId = params.channelId as string;

  const { data: channels } = useCommunityChannels(communityId);
  const currentChannel = channels?.find(c => c.id === channelId);

  return (
    <CommunityPage communityId={communityId}>
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <ChatHeader
          channelName={currentChannel?.name || 'Channel'}
          channelDescription={currentChannel?.description}
          memberCount={0} // Would be fetched from API
        />

        {/* Chat Container */}
        <ChatContainer channelId={channelId} communityId={communityId} />
      </div>
    </CommunityPage>
  );
}