import React from 'react';
import { Hash, Lock, Plus, Settings } from 'lucide-react';
import { useCommunityChannels } from '../hooks/use-communities';
import { Channel } from '../types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ChannelsSidebarProps {
  communityId: string;
  isAdmin?: boolean;
}

export const ChannelsSidebar: React.FC<ChannelsSidebarProps> = ({ communityId, isAdmin = false }) => {
  const { data: channels, isLoading, error } = useCommunityChannels(communityId);
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 h-full flex flex-col">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 h-full flex items-center justify-center">
        <p className="text-sm text-red-500">Failed to load channels.</p>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1D21] h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs tracking-wider">Channels</h3>
        {isAdmin && (
          <button className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {channels?.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No channels yet.</p>
          </div>
        ) : (
          channels?.map((channel: Channel) => {
            const isActive = pathname.includes(`/channels/${channel.id}`);
            return (
              <Link
                key={channel.id}
                href={`/communities/${communityId}/channels/${channel.id}`}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center truncate">
                  {channel.isPrivate ? (
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0 opacity-70" />
                  ) : (
                    <Hash className="w-4 h-4 mr-2 flex-shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </div>
                {isAdmin && (
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-all">
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
