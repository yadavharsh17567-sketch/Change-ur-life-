import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Video "SEO Guide 2026" processing completed.', time: '10 minutes ago', read: false },
    { id: 2, message: 'New subscriber on your YouTube channel!', time: '1 hour ago', read: false },
    { id: 3, message: 'Welcome to ChangeYourLife platform.', time: '1 day ago', read: true }
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search projects, files, and more..." 
            className="w-full h-10 bg-neutral-900/50 border border-white/5 rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-neutral-600"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            className={`relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showNotifications ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="text-xs font-semibold">{unreadCount}</span>
            )}
            {unreadCount === 0 && (
               <span className="text-xs font-medium">0</span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
               <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300" onClick={markAllRead}>Mark all read</span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-white/5 transition-colors cursor-pointer flex gap-3 ${notif.read ? 'opacity-60 hover:bg-white/5' : 'bg-indigo-500/5 hover:bg-indigo-500/10'}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                      <div>
                        <p className={`text-sm ${notif.read ? 'text-neutral-400' : 'text-neutral-200'}`}>{notif.message}</p>
                        <p className="text-xs text-neutral-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 cursor-pointer"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="w-full h-full rounded-full bg-neutral-900 border-2 border-neutral-900 overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=User&background=171717&color=a3a3a3" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/5">
                <p className="text-sm font-medium">Jane Doe</p>
                <p className="text-xs text-neutral-500 truncate">jane@example.com</p>
              </div>
              <div className="p-1">
                <Link 
                  to="/app/profile" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link 
                  to="/app/settings" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link 
                  to="/" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors mt-1 border-t border-white/5"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
