import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
