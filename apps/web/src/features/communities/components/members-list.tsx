import React, { useMemo } from 'react';
import { useCommunityMembers } from '../hooks/use-communities';
import { Member } from '../types';
import { RoleBadge } from './role-badge';
import { Users, MoreVertical } from 'lucide-react';

interface MembersListProps {
  communityId: string;
  isAdmin?: boolean;
}

export const MembersList: React.FC<MembersListProps> = ({ communityId, isAdmin = false }) => {
  const { data: members, isLoading, error } = useCommunityMembers(communityId);

  const groupedMembers = useMemo(() => {
    if (!members) return { online: [], offline: [] };
    // In a real app, online status would come from presence system (e.g. Socket.io)
    // For now, we'll just put everyone in one list and group by role
    const admin = members.filter(m => m.role === 'ADMIN');
    const mod = members.filter(m => m.role === 'MODERATOR');
    const member = members.filter(m => m.role === 'MEMBER');

    return [
      { label: 'Admin', data: admin },
      { label: 'Moderators', data: mod },
      { label: 'Members', data: member },
    ].filter(group => group.data.length > 0);
  }, [members]);

  if (isLoading) {
    return (
      <div className="w-60 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800 p-4">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(group => (
            <div key={group} className="space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              {[1, 2].map(item => (
                <div key={item} className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-60 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-l border-gray-200 dark:border-gray-800 p-4 flex items-center justify-center text-center">
        <p className="text-sm text-red-500">Failed to load members.</p>
      </div>
    );
  }

  return (
    <div className="w-60 flex-shrink-0 bg-gray-50 dark:bg-[#1A1D21] border-l border-gray-200 dark:border-gray-800 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs tracking-wider">Members ({members?.length || 0})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {groupedMembers.length === 0 ? (
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No members found.</p>
          </div>
        ) : (
          groupedMembers.map((group) => (
            <div key={group.label}>
              <h4 className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.label} — {group.data.length}
              </h4>
              <div className="space-y-0.5">
                {group.data.map((member: Member) => (
                  <div 
                    key={member.id} 
                    className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center min-w-0">
                      <div className="relative mr-3 flex-shrink-0">
                        {member.user.avatarUrl ? (
                          <img 
                            src={member.user.avatarUrl} 
                            alt={member.user.username || member.user.walletAddress} 
                            className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-medium text-sm">
                            {(member.user.username || member.user.walletAddress).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {/* Status indicator (hardcoded to online for now) */}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1A1D21] rounded-full"></div>
                      </div>
                      
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {member.user.username || `${member.user.walletAddress.substring(0,6)}...${member.user.walletAddress.substring(38)}`}
                        </p>
                      </div>
                    </div>
                    
                    {isAdmin && member.role !== 'ADMIN' && (
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-all text-gray-500 dark:text-gray-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
