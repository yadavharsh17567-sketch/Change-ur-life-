import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, Settings, User, Youtube, ChevronDown, CheckCircle2, RefreshCcw, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';

interface TopNavProps {
  onMenuClick?: () => void;
}

interface YTAccount {
  id: string;
  name: string;
  handle: string;
  thumbnail: string;
  nickname?: string;
  status: string;
}

interface YTStatus {
  connected: boolean;
  channel?: {
    id: string;
    title: string;
    handle: string;
    thumbnail: string;
    nickname?: string;
  };
  accountCount: number;
  accounts: YTAccount[];
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [ytStatus, setYtStatus] = useState<YTStatus | null>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Video "SEO Guide 2026" processing completed.', time: '10 minutes ago', read: false },
    { id: 2, message: 'New subscriber on your YouTube channel!', time: '1 hour ago', read: false },
    { id: 3, message: 'Welcome to ChangeYourLife platform.', time: '1 day ago', read: true }
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const fetchYtStatus = async () => {
    try {
      const res = await fetch('/api/youtube/status');
      const data = await res.json();
      setYtStatus(data);
    } catch (err) {
      console.error('Failed to fetch YouTube status');
    }
  };

  useEffect(() => {
    fetchYtStatus();
    const interval = setInterval(fetchYtStatus, 15000); // Poll less frequently
    return () => clearInterval(interval);
  }, []);

  const handleSwitchChannel = async (id: string) => {
    try {
      const res = await fetch('/api/youtube/accounts/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchYtStatus();
        setShowChannelMenu(false);
      }
    } catch (err) {
      console.error('Failed to switch channel');
    }
  };

  const handleConnectNew = () => {
    window.location.href = '/api/auth/youtube';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (channelRef.current && !channelRef.current.contains(event.target as Node)) {
        setShowChannelMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 md:h-20 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden text-neutral-400 hover:text-white" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/app" className="hidden md:flex items-center gap-2">
          <img src="/logo.png" alt="CUL Logo" className="w-14 h-14 object-contain" />
        </Link>
        <div className="relative w-full max-w-md hidden lg:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects, files, and more..." 
            className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-neutral-600 focus:bg-neutral-900"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        {/* YouTube Channel Selector */}
        <div className="relative" ref={channelRef}>
          {ytStatus?.connected ? (
            <button 
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-900 hover:border-white/10 transition-all group"
            >
              <div className="relative">
                <img 
                  src={ytStatus.channel?.thumbnail} 
                  alt="Channel" 
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {ytStatus.channel?.nickname || ytStatus.channel?.title}
                </p>
                <p className="text-[10px] text-neutral-500 font-medium truncate max-w-[100px]">
                  {ytStatus.channel?.handle}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-500 group-hover:text-white transition-transform ${showChannelMenu ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <Link to="/app/youtube-accounts">
              <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5 border border-dashed border-white/10">
                <Youtube className="w-4 h-4 mr-2" />
                Connect YouTube
              </Button>
            </Link>
          )}

          {showChannelMenu && (
            <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-80 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[1.75rem] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Broadcasting Node</p>
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                     Live
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={ytStatus?.channel?.thumbnail} className="w-12 h-12 rounded-xl object-cover shadow-2xl ring-1 ring-white/10" />
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-indigo-500 p-0.5 rounded-full shadow-lg shadow-indigo-500/50">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate leading-none mb-1">{ytStatus?.channel?.nickname || ytStatus?.channel?.title}</p>
                    <p className="text-[10px] text-neutral-500 font-bold tracking-tight">{ytStatus?.channel?.handle}</p>
                  </div>
                </div>
              </div>
              
              <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
                {ytStatus?.accounts.filter(a => a.id !== ytStatus.channel?.id).map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => handleSwitchChannel(acc.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={acc.thumbnail} className="w-8 h-8 rounded-lg object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="text-left min-w-0">
                        <p className="text-[11px] font-black text-neutral-400 group-hover:text-white transition-colors truncate">{acc.nickname || acc.name}</p>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-tight">{acc.handle}</p>
                      </div>
                    </div>
                    <RefreshCcw className="w-3.5 h-3.5 text-neutral-600 group-hover:text-indigo-400 transition-all group-hover:rotate-180 duration-500" />
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-white/5 bg-black/20">
                <button 
                  onClick={handleConnectNew}
                  className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  Initialize New Node
                </button>
                <Link 
                  to="/app/youtube-accounts" 
                  onClick={() => setShowChannelMenu(false)}
                  className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                    <Settings className="w-4 h-4" />
                  </div>
                  Manage All Channels
                </Link>
              </div>
            </div>
          )}
        </div>
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

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-20 md:top-auto md:mt-4 w-auto md:w-96 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between px-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Activity Logs</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Purge Unread
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto px-2 py-2 space-y-1">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-4 group ${notif.read ? 'opacity-40 hover:opacity-100 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10 shadow-lg shadow-black/20'}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${notif.read ? 'bg-neutral-900 border-white/5' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                            {notif.message.includes('completed') ? (
                              <CheckCircle2 className={`w-5 h-5 ${notif.read ? 'text-neutral-500' : 'text-emerald-400'}`} />
                            ) : notif.message.includes('subscriber') ? (
                              <Youtube className={`w-5 h-5 ${notif.read ? 'text-neutral-500' : 'text-rose-400'}`} />
                            ) : (
                              <Bell className={`w-5 h-5 ${notif.read ? 'text-neutral-500' : 'text-indigo-400'}`} />
                            )}
                          </div>
                          {!notif.read && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-neutral-950" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold leading-snug ${notif.read ? 'text-neutral-400' : 'text-white'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-neutral-600" />
                      </div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Quiet on the front</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-black/20 border-t border-white/5 mt-1 rounded-b-[1.75rem]">
                  <Link 
                    to="/app/settings" 
                    className="flex items-center justify-center gap-2 p-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all"
                  >
                    Notification Preferences
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
