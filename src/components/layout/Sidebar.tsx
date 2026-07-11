import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, User, Folder, UploadCloud, LogOut, Sparkles, Video, Scissors, X } from 'lucide-react';
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
    { icon: Video, label: 'Video Editor', path: '/app/editor' },
    { icon: Scissors, label: 'Auto Clipper', path: '/app/clipper' },
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
        "w-64 h-[100dvh] border-r border-white/5 bg-neutral-950 flex flex-col fixed md:sticky top-0 z-50 transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex shrink-0 items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 font-bold text-lg tracking-tight" onClick={onClose}>
            <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center bg-white/5">
              <img 
                src="/logo.png" 
                alt="CUL Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-indigo-500 font-bold">CUL</span>';
                }}
              />
            </div>
            <span className="hidden lg:block md:hidden xl:block">Change Ur Life</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden -mr-2" onClick={onClose}>
            <X className="w-5 h-5 text-neutral-400" />
          </Button>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Link>
      </div>
      </div>
    </>
  );
}
