'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'ml-[70px]' : 'ml-64'
      }`}
    >
      {children}
    </main>
  );
}

