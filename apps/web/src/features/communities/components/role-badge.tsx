import React from 'react';
import { Shield, ShieldAlert, User } from 'lucide-react';
import { CommunityRole } from '../types';

interface RoleBadgeProps {
  role: CommunityRole;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const roleConfig: Record<CommunityRole, { label: string; color: string; icon: React.ReactNode }> = {
    ADMIN: {
      label: 'Admin',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
      icon: <ShieldAlert className="w-3 h-3 mr-1" />,
    },
    MODERATOR: {
      label: 'Moderator',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: <Shield className="w-3 h-3 mr-1" />,
    },
    MEMBER: {
      label: 'Member',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      icon: <User className="w-3 h-3 mr-1" />,
    },
  };

  const config = roleConfig[role] || roleConfig.MEMBER;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};
