import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Youtube, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical,
  ExternalLink,
  Users,
  Layout,
  Settings2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { YouTubeAccount } from '../../types/youtube';

export function YouTubeAccounts() {
  const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/youtube/accounts');
      const data = await res.json();
      setAccounts(data.accounts);
      setActiveAccountId(data.activeAccountId);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/auth/youtube';
  };

  const handleSwitch = async (id: string) => {
    try {
      await fetch('/api/youtube/accounts/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setActiveAccountId(id);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to switch account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await fetch(`/api/youtube/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account');
    }
  };

  const handleRename = async (id: string) => {
    const nickname = prompt('Enter a nickname for this account:');
    if (nickname === null) return;
    try {
      await fetch('/api/youtube/accounts/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nickname })
      });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to rename account');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">YouTube Matrix</h1>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
            Multi-Channel Management System
          </p>
        </div>
        <Button 
          onClick={handleConnect}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Connect New Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-8 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden group ${
                  activeAccountId === account.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' 
                    : 'bg-neutral-900/40 backdrop-blur-xl border-white/5 hover:border-white/10'
                }`}
              >
                {/* Background Glow */}
                {activeAccountId === account.id && (
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-[60px] pointer-events-none" />
                )}

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img 
                        src={account.thumbnail} 
                        alt={account.name} 
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10 shadow-xl"
                      />
                      {account.status === 'connected' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-neutral-950 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                        {account.nickname || account.name}
                      </h3>
                      <p className="text-sm text-neutral-500 font-medium">{account.handle}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     {activeAccountId !== account.id && (
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => handleSwitch(account.id)}
                         className="text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                         title="Switch to this channel"
                       >
                         <RefreshCcw className="w-4 h-4" />
                       </Button>
                     )}
                   <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-neutral-500 hover:text-white hover:bg-white/5"
                          onClick={() => setMenuOpenId(menuOpenId === account.id ? null : account.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {menuOpenId === account.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-neutral-900 border border-white/5 rounded-2xl shadow-2xl z-50">
                            <button 
                              onClick={() => {
                                handleRename(account.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 flex items-center gap-3"
                            >
                              <Settings2 className="w-4 h-4" />
                              Edit Nickname
                            </button>
                            <button 
                              onClick={() => {
                                handleDelete(account.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-3 border-t border-white/5"
                            >
                              <Trash2 className="w-4 h-4" />
                              Disconnect
                            </button>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Network
                      </div>
                      <div className="text-xl font-black text-white tracking-tighter">
                        {parseInt(account.subscriberCount || '0').toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined
                      </div>
                      <div className="text-sm font-black text-white tracking-tight">
                        {new Date(account.connectedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {activeAccountId === account.id ? (
                    <div className="py-3.5 px-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center gap-3 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Layout className="w-4 h-4 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      Active Matrix
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleSwitch(account.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 group"
                    >
                      Connect Destination
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 rounded-[3rem] bg-neutral-900/20 border border-dashed border-white/10">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
            <Youtube className="w-12 h-12 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">No Channels Detected</h2>
            <p className="text-neutral-500 max-w-sm mt-3 font-medium">Connect your YouTube accounts to initialize the multi-channel automation engine.</p>
          </div>
          <Button 
            onClick={handleConnect}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/30"
          >
            Connect Your First Channel
          </Button>
        </div>
      )}
    </div>
  );
}
