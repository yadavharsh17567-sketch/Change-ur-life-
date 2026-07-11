import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, Activity, Youtube, Settings, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function BottomNav() {
  const location = useLocation();

  const links = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Zap, label: 'Auto', path: '/app/automation' },
    { icon: Scissors, label: 'Clipper', path: '/app/clipper' },
    { icon: Activity, label: 'Pipeline', path: '/app/pipeline' },
    { icon: Youtube, label: 'YouTube', path: '/app/youtube-accounts' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-neutral-950/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative px-4",
              isActive ? "text-indigo-400" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-active"
                className="absolute -top-1 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            )}
            <div className={cn(
              "p-2 rounded-2xl transition-all",
              isActive ? "bg-indigo-500/10 scale-110" : "scale-100"
            )}>
              <link.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter transition-all",
              isActive ? "opacity-100 translate-y-0" : "opacity-70 translate-y-0.5"
            )}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
