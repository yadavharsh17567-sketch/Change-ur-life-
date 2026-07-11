import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCcw, 
  XCircle, 
  ChevronRight, 
  Terminal,
  BarChart3,
  Video,
  Scissors,
  Sparkles,
  Music,
  Youtube,
  CloudDownload,
  Mic,
  Type,
  Layout,
  Music2,
  Image as ImageIcon,
  Tag,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PipelineTask, PipelineStep, PipelineStatus } from '../../types/pipeline';
import { cn } from '../../lib/utils';

const STEP_ICONS: Record<string, any> = {
  'download': CloudDownload,
  'extract-audio': Mic,
  'transcribe': Type,
  'subtitles': Activity,
  'clip-detect': Scissors,
  'edit': Video,
  'effects': Sparkles,
  'music': Music,
  'thumbnail': ImageIcon,
  'seo-title': Type,
  'description': Terminal,
  'tags': Tag,
  'render': Rocket,
  'upload': Youtube,
};

function StatusBadge({ status }: { status: PipelineStatus }) {
  const configs: Record<PipelineStatus, { color: string; icon: any; label: string; animate?: boolean }> = {
    waiting: { color: 'text-neutral-500 bg-neutral-500/10', icon: Clock, label: 'Waiting' },
    starting: { color: 'text-blue-400 bg-blue-400/10', icon: RefreshCcw, label: 'Starting', animate: true },
    processing: { color: 'text-indigo-400 bg-indigo-400/10', icon: Activity, label: 'Processing', animate: true },
    completed: { color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2, label: 'Completed' },
    failed: { color: 'text-rose-400 bg-rose-400/10', icon: AlertCircle, label: 'Failed' },
    retrying: { color: 'text-amber-400 bg-amber-400/10', icon: RefreshCcw, label: 'Retrying', animate: true },
    cancelled: { color: 'text-neutral-500 bg-neutral-500/10', icon: XCircle, label: 'Cancelled' },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </div>
  );
}

export function Pipeline() {
  const [tasks, setTasks] = useState<PipelineTask[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ytStatus, setYtStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(setYtStatus);

    const fetchData = async () => {
      try {
        const [tasksRes, statsRes] = await Promise.all([
          fetch('/api/pipeline/tasks'),
          fetch('/api/pipeline/stats')
        ]);
        const tasksData = await tasksRes.json();
        const statsData = await statsRes.json();
        setTasks(tasksData);
        setStats(statsData);
        if (tasksData.length > 0 && !selectedTaskId) {
          setSelectedTaskId(tasksData[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch pipeline data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [selectedTaskId]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Pipeline Engine</h1>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
            Real-time Automation Matrix
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {ytStatus?.connected && (
            <div className="px-5 py-3 rounded-[1.25rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex items-center gap-4 shadow-xl">
              <div className="relative">
                <img src={ytStatus.channel?.thumbnail} className="w-10 h-10 rounded-xl ring-2 ring-white/10" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-neutral-950 shadow-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Active Stream</span>
                <span className="text-sm font-black text-white leading-tight">
                  {ytStatus.channel?.nickname || ytStatus.channel?.title}
                </span>
              </div>
            </div>
          )}
          <div className="px-5 py-3 rounded-[1.25rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center gap-4 shadow-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">System Matrix</span>
              <span className="text-sm font-black text-indigo-400 flex items-center gap-2 justify-end">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                OPERATIONAL
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Task List / Queue */}
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tasks.map(task => (
              <motion.div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={cn(
                  "p-5 rounded-3xl border transition-all duration-300 cursor-pointer group",
                  selectedTaskId === task.id 
                    ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]" 
                    : "bg-neutral-900/40 backdrop-blur-xl border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-950 shrink-0 overflow-hidden ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all">
                    {task.thumbnail ? (
                      <img src={task.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate tracking-tight">{task.videoTitle}</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{task.startTime}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span className="text-neutral-500 font-black uppercase tracking-[0.2em]">Progress</span>
                    <span className="text-white font-black">{task.overallProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.overallProgress}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/20 rounded-[3rem] border border-dashed border-white/10">
                <Activity className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Queue is currently empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Left Column: Pipeline Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-10 rounded-[2.5rem] bg-neutral-900/40 backdrop-blur-2xl border border-white/5 relative overflow-hidden shadow-2xl"
          >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-16 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Activity className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedTask?.videoTitle || 'Select a Task'}</h2>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">ID: {selectedTask?.id?.split('-')[0]}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Started: {selectedTask?.startTime}</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-4xl font-black text-white tracking-tighter">{selectedTask?.overallProgress}%</div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mt-1.5">Matrix Progress</div>
              </div>
            </div>

            {/* The Pipeline Visualization */}
            <div className="relative flex flex-col gap-10">
              {selectedTask?.steps?.map((step, idx) => {
                const Icon = STEP_ICONS[step.id] || ChevronRight;
                const isLast = idx === selectedTask.steps.length - 1;
                const isProcessing = step.status === 'processing';
                const isCompleted = step.status === 'completed';

                return (
                  <div key={step.id} className="relative flex items-start gap-10 group">
                    {/* Connection Line */}
                    {!isLast && (
                      <div className="absolute left-7 top-14 bottom-[-40px] w-0.5 bg-neutral-800">
                        {isCompleted && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            className="w-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                          />
                        )}
                        {isProcessing && (
                          <div className="w-full h-full bg-neutral-800 overflow-hidden">
                             <motion.div 
                                animate={{ y: [0, 80] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-full h-16 bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent"
                             />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Icon Node */}
                    <div className="relative shrink-0">
                      <motion.div 
                        animate={isProcessing ? { 
                          scale: [1, 1.15, 1],
                          boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 30px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)']
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                          "w-14 h-14 rounded-[1.25rem] flex items-center justify-center border-2 transition-all duration-500 z-10 relative",
                          isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                          isProcessing ? "bg-indigo-600 border-indigo-500 text-white" :
                          "bg-neutral-900 border-white/5 text-neutral-500"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        {isCompleted && (
                          <div className="absolute -right-1.5 -top-1.5 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Step Details Card */}
                    <div className={cn(
                      "flex-1 p-6 rounded-[1.5rem] border transition-all duration-500",
                      isProcessing ? "bg-indigo-600/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10" : 
                      isCompleted ? "bg-white/5 border-white/5" :
                      "bg-transparent border-white/5 opacity-40"
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-sm text-white tracking-tight uppercase">{step.label}</span>
                        <StatusBadge status={step.status} />
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${step.progress}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Logs & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 shadow-xl">
              <BarChart3 className="w-5 h-5 text-indigo-400 mb-3" />
              <div className="text-2xl font-black text-white tracking-tighter">{stats?.processedToday || 0}</div>
              <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Processed</div>
            </div>
            <div className="p-6 rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 shadow-xl">
              <RefreshCcw className="w-5 h-5 text-emerald-400 mb-3" />
              <div className="text-2xl font-black text-white tracking-tighter">{stats?.successRate || 100}%</div>
              <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Matrix Yield</div>
            </div>
          </div>

          {/* Activity Log */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.5 }}
             className="flex flex-col h-[500px] rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Activity Log</h3>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4 scrollbar-hide">
              {selectedTask?.logs?.map((log, i) => (
                <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-neutral-600 font-bold shrink-0">[{log.timestamp}]</span>
                  <span className={cn(
                    "font-medium",
                    log.type === 'error' ? 'text-rose-400' : 
                    log.type === 'success' ? 'text-emerald-400' : 
                    'text-neutral-300'
                  )}>
                    {log.type === 'success' && '✓ '}
                    {log.type === 'error' && '✖ '}
                    {log.message}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 text-indigo-400/30 italic font-black uppercase tracking-widest animate-pulse text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                Syncing with Core Matrix...
              </div>
            </div>
          </motion.div>

          {/* Current Queue Card */}
          <div className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] animate-pulse" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">Processing Metrics</h3>
            <div className="space-y-5">
              {[
                { label: 'Neural Speed', value: '2.4x Real-time', color: 'text-indigo-400' },
                { label: 'Matrix ETA', value: '~45 seconds', color: 'text-purple-400' },
                { label: 'Active Workers', value: '3 Nodes', color: 'text-emerald-400' },
              ].map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{metric.label}</span>
                  <span className={cn("text-xs font-black uppercase tracking-widest", metric.color)}>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
