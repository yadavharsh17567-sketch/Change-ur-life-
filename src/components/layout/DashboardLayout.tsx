import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { ParticlesBackground } from '../landing/ParticlesBackground';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex relative overflow-hidden selection:bg-indigo-500/30">
      <ParticlesBackground />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
