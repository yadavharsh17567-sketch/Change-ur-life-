import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, User, Folder, UploadCloud, LogOut, Sparkles, Video, Scissors, X, Activity, Youtube, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const links = [
    { icon: Home, label: 'Dashboard', path: '/app' },
    { icon: Zap, label: 'Automation', path: '/app/automation' },
    { icon: Scissors, label: 'Auto Clipper', path: '/app/clipper' },
    { icon: Activity, label: 'Pipeline', path: '/app/pipeline' },
    { icon: Youtube, label: 'YT Accounts', path: '/app/youtube-accounts' },
    { icon: Video, label: 'Video Editor', path: '/app/editor' },
    { icon: Folder, label: 'Projects', path: '/app/projects' },
    { icon: UploadCloud, label: 'Uploads', path: '/app/uploads' },
    { icon: User, label: 'Profile', path: '/app/profile' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "w-64 h-[100dvh] border-r border-white/5 bg-neutral-950/70 backdrop-blur-2xl flex flex-col fixed md:sticky top-0 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-20 flex shrink-0 items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white" onClick={onClose}>
            <img src="/logo.png" alt="CUL Logo" className="w-16 h-16 object-contain" />
            <span className="hidden lg:block md:hidden xl:block">CUL AI</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden -mr-2" onClick={onClose}>
            <X className="w-5 h-5 text-neutral-400" />
          </Button>
        </div>
        
        <div className="flex-1 py-8 px-4 flex flex-col gap-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 relative group",
                isActive 
                  ? "bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-indigo-400" : "text-neutral-500 group-hover:text-white"
              )} />
              {link.label}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Link>
      </div>
      </div>
    </>
  );
}
