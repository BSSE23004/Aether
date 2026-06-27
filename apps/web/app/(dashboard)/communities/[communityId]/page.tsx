/**
 * Community detail page - redirects to first channel or shows community info
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCommunityChannels } from '@/features/communities/hooks/use-communities';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.communityId as string;

  const { data: channels, isLoading } = useCommunityChannels(communityId);

  useEffect(() => {
    if (!isLoading && channels && channels.length > 0) {
      // Redirect to the first channel
      router.replace(`/communities/${communityId}/channels/${channels[0].id}`);
    }
  }, [channels, isLoading, communityId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No channels in this community yet</p>
      </div>
    );
  }

  return null; // Will redirect
}