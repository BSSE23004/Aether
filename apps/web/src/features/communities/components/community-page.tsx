import React from 'react';
import { useCommunity, useCommunityMembers } from '../hooks/use-communities';
import { ChannelsSidebar } from './channels-sidebar';
import { MembersList } from './members-list';
import { Settings, Users, Menu } from 'lucide-react';
import { useAccount } from 'wagmi';

interface CommunityPageProps {
  communityId: string;
  children: React.ReactNode;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ communityId, children }) => {
  const { data: community, isLoading, error } = useCommunity(communityId);
  const { data: members } = useCommunityMembers(communityId);
  const { address } = useAccount();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showMembers, setShowMembers] = React.useState(true);

  // Determine if the current user is an admin
  const currentUserMember = members?.find(
    m => m.user.walletAddress.toLowerCase() === address?.toLowerCase()
  );
  const isAdmin = currentUserMember?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-gray-950 text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Community Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          The community you are looking for does not exist or you don't have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar: Channels */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col w-64 bg-gray-50 dark:bg-[#1A1D21] border-r border-gray-200 dark:border-gray-800 shadow-xl md:shadow-none">
          {/* Community Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm z-10">
            <div className="flex items-center flex-1 min-w-0">
              {community.avatarUrl ? (
                <img 
                  src={community.avatarUrl} 
                  alt={community.name} 
                  className="w-8 h-8 rounded-md object-cover mr-3 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  {community.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="font-bold text-gray-900 dark:text-white truncate">{community.name}</h2>
            </div>
          </div>

          {/* Channels Sidebar component */}
          <div className="flex-1 overflow-hidden">
            <ChannelsSidebar communityId={communityId} isAdmin={isAdmin} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation / Mobile Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shadow-sm z-10">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-3 p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-gray-900 dark:text-white truncate">
              {/* Contextual title could go here if derived from child route */}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-md transition-colors ${
                showMembers 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
              title="Toggle Members List"
            >
              <Users className="w-5 h-5" />
            </button>
            
            {isAdmin && (
              <button 
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                title="Community Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Content & Right Sidebar Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (Chat/Forum/etc) */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 relative">
            {children}
          </main>

          {/* Right Sidebar: Members List */}
          {showMembers && (
            <div className="hidden lg:block h-full">
              <MembersList communityId={communityId} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
