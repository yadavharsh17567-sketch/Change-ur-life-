import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Youtube, 
  Video, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Globe, 
  Zap,
  Sparkles,
  RefreshCw,
  Loader2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

interface ScheduledTask {
  id: string;
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  scheduledTime: string;
  status: 'pending' | 'processing' | 'downloading' | 'uploading' | 'completed' | 'failed';
  youtubeAccountId: string;
  videoId?: string;
  error?: string;
  createdAt: string;
}

export function Automation() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rules'>('tasks');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeoLoading, setIsSeoLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for Task
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [youtubeAccountId, setYoutubeAccountId] = useState('');

  // Form state for Rules
  const [ruleName, setRuleName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [descTemplate, setDescTemplate] = useState('');
  const [checkFreq, setCheckFreq] = useState('120'); // minutes
  const [privacy, setPrivacy] = useState('private');
  const [maxVideos, setMaxVideos] = useState('4');
  const [ruleTags, setRuleTags] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchTasks = async (showNotifications = false) => {
    try {
      const res = await fetch('/api/automation/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        if (showNotifications && tasks.length > 0) {
          data.forEach((task: any) => {
            const oldTask = tasks.find(ot => ot.id === task.id);
            if (oldTask && oldTask.status !== task.status) {
              if (task.status === 'completed') {
                showToast(`Video uploaded successfully: ${task.title}`, 'success');
              } else if (task.status === 'failed') {
                showToast(`Upload failed: ${task.title}`, 'error');
              }
            }
          });
        }
        setTasks(data);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      return [];
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/automation/rules');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRules(data);
      }
    } catch (err) {
      console.error('Failed to fetch rules', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/youtube/accounts');
      const data = await res.json();
      const accs = data.accounts || [];
      setAccounts(accs);
      if (accs.length > 0 && !youtubeAccountId) {
        setYoutubeAccountId(data.activeAccountId || accs[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchAccounts(), fetchRules()]);
      if (mounted) setIsLoading(false);
    };
    init();

    const intervalId = setInterval(() => {
      if (mounted) {
        fetchTasks(true);
        fetchRules();
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [tasks]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !title || !scheduledTime) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/automation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          title,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          scheduledTime: new Date(scheduledTime).toISOString(),
          youtubeAccountId
        })
      });
      if (res.ok) {
        showToast('Task scheduled successfully!', 'success');
        setShowAddForm(false);
        setVideoUrl('');
        setTitle('');
        setDescription('');
        setTags('');
        setScheduledTime('');
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to schedule task', 'error');
      console.error('Failed to schedule task', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !sourceUrl) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ruleName,
          channelUrl: sourceUrl,
          prefix: titlePrefix,
          suffix: titleSuffix,
          descriptionTemplate: descTemplate,
          intervalMinutes: parseInt(checkFreq),
          privacyStatus: privacy,
          maxVideos: parseInt(maxVideos),
          tags: ruleTags.split(',').map(t => t.trim()).filter(t => t),
          youtubeAccountId
        })
      });
      if (res.ok) {
        showToast('Rule established successfully!', 'success');
        setShowAddForm(false);
        setRuleName('');
        setSourceUrl('');
        setTitlePrefix('');
        setTitleSuffix('');
        setDescTemplate('');
        setCheckFreq('120');
        setMaxVideos('4');
        setRuleTags('');
        fetchRules();
      }
    } catch (err) {
      showToast('Failed to create rule', 'error');
      console.error('Failed to create rule', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await fetch(`/api/automation/rules/${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/automation/task/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleOptimizeSeo = async () => {
    if (!videoUrl && !title) return;
    setIsSeoLoading(true);
    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: title || 'Video content', 
          keywords: tags 
        })
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(data.tags.join(', '));
    } catch (err) {
      console.error('SEO optimization failed', err);
    } finally {
      setIsSeoLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'processing': 
      case 'downloading':
      case 'uploading': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={cn(
              "px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl border flex items-center gap-3 min-w-[300px] border-white/10",
              toast.type === 'success' ? "bg-emerald-500/20 text-emerald-400" :
              toast.type === 'error' ? "bg-rose-500/20 text-rose-400" :
              "bg-indigo-500/20 text-indigo-400"
            )}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
              <span className="text-sm font-black tracking-tight">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-500" />
            CUL Scheduler
          </h1>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
            End-to-End Video Automation Engine
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 group h-12 px-6"
        >
          {showAddForm ? 'Close Form' : (
            <>
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              New {activeTab === 'tasks' ? 'Automation Task' : 'Scheduler Rule'}
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-4">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'tasks' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-500 hover:text-white"
          )}
        >
          Scheduled Tasks
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'rules' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-neutral-500 hover:text-white"
          )}
        >
          Automation Rules
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 rounded-[2.5rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 space-y-8">
              {activeTab === 'tasks' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Remote Video URL
                      </label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Target Time
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                          <input 
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Destination Channel
                        </label>
                        <div className="relative">
                          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                          <select 
                            value={youtubeAccountId}
                            onChange={(e) => setYoutubeAccountId(e.target.value)}
                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium appearance-none"
                          >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.nickname || acc.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleOptimizeSeo}
                        disabled={isSeoLoading || (!videoUrl && !title)}
                        className="w-full h-14 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 group"
                      >
                        {isSeoLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Optimize with Gemini AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Video Title
                      </label>
                      <input 
                        type="text"
                        placeholder="Catchy, viral title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Description
                      </label>
                      <textarea 
                        placeholder="Add value, links, and keywords..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Tags (comma separated)
                      </label>
                      <input 
                        type="text"
                        placeholder="seo, viral, tech, trending..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-[12px]">
                      Create Auto Ingest Rule
                    </h3>
                    <button onClick={() => setShowAddForm(false)} className="text-neutral-500 hover:text-white transition-colors">
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Rule Name *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Ingest Nature Channel"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Source YouTube Channel URL *
                      </label>
                      <div className="relative group">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input 
                          type="url"
                          placeholder="https://www.youtube.com/channel/UC..."
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Title Prefix (Optional)
                        </label>
                        <input 
                          type="text"
                          placeholder="[LIVESTREAM]"
                          value={titlePrefix}
                          onChange={(e) => setTitlePrefix(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Title Suffix (Optional)
                        </label>
                        <input 
                          type="text"
                          placeholder="- 2026 Repost"
                          value={titleSuffix}
                          onChange={(e) => setTitleSuffix(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Upload To Account *
                      </label>
                      <div className="relative">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <select 
                          value={youtubeAccountId}
                          onChange={(e) => setYoutubeAccountId(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium appearance-none"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.nickname || acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Description Template
                      </label>
                      <textarea 
                        placeholder="Add custom footnotes or template metadata..."
                        value={descTemplate}
                        onChange={(e) => setDescTemplate(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Check Freq (Min)
                        </label>
                        <input 
                          type="number"
                          value={checkFreq}
                          onChange={(e) => setCheckFreq(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Default Privacy
                        </label>
                        <select 
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium appearance-none"
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                          <option value="unlisted">Unlisted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                          Max Videos (1-15)
                        </label>
                        <input 
                          type="number"
                          value={maxVideos}
                          onChange={(e) => setMaxVideos(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">
                        Video Tags (Comma Separated)
                      </label>
                      <input 
                        type="text"
                        placeholder="auto-upload, republisher, archive"
                        value={ruleTags}
                        onChange={(e) => setRuleTags(e.target.value)}
                        className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                       <Button 
                        onClick={() => setShowAddForm(false)}
                        variant="ghost"
                        className="flex-1 h-14 text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateRule}
                        disabled={isSubmitting || !ruleName || !sourceUrl}
                        className="flex-1 h-14 bg-white text-black hover:bg-neutral-200 shadow-2xl font-black"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Establish Rule'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button 
                    onClick={handleSchedule}
                    disabled={isSubmitting || !videoUrl || !title || !scheduledTime}
                    className="h-14 px-10 bg-white text-black hover:bg-neutral-200 shadow-2xl group"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Schedule Matrix Task
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {activeTab === 'tasks' ? 'Active Automation Queue' : 'Configured Scheduler Rules'}
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-neutral-900/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'tasks' ? (
          tasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 shrink-0 group-hover:border-indigo-500/30 transition-colors">
                          <Video className="w-6 h-6 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-white tracking-tight">{task.title}</h3>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5",
                              getStatusColor(task.status)
                            )}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 line-clamp-1 max-w-xl font-medium">
                            {task.videoUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {task.status === 'completed' && task.videoId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://youtube.com/watch?v=${task.videoId}`, '_blank')}
                            className="text-neutral-400 hover:text-white hover:bg-white/5 h-10 px-4"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(task.id)}
                          className="text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 rounded-[3rem] bg-neutral-900/20 border border-dashed border-white/10">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-neutral-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter">Queue is Empty</h3>
                <p className="text-neutral-500 max-w-xs mt-2 font-medium">Your automated video matrix will appear here once scheduled.</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-white h-12 px-8"
              >
                Start Automation
              </Button>
            </div>
          )
        ) : rules.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {rules.map((rule) => (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 shrink-0 group-hover:border-indigo-500/30 transition-colors">
                        <Zap className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-white tracking-tight">{rule.title}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-1 max-w-xl font-medium">
                          Monitoring: {rule.channelUrl}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                             <Clock className="w-3 h-3" />
                             Every {rule.intervalMinutes} Mins
                           </div>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                             <Globe className="w-3 h-3" />
                             {rule.privacyStatus}
                           </div>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                             <Youtube className="w-3 h-3" />
                             {accounts.find(a => a.id === rule.youtubeAccountId)?.nickname || 'Primary Channel'}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 h-10 w-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 rounded-[3rem] bg-neutral-900/20 border border-dashed border-white/10">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 flex items-center justify-center">
              <Zap className="w-10 h-10 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter">No Scheduler Rules</h3>
              <p className="text-neutral-500 max-w-xs mt-2 font-medium">Define rules to automatically fetch and upload content from other channels.</p>
            </div>
            <Button 
              onClick={() => {
                setActiveTab('rules');
                setShowAddForm(true);
              }}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white h-12 px-8"
            >
              Add Rule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

