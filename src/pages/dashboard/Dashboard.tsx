import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Youtube, Activity, Zap, Scissors, ArrowUpRight, Clock, CheckCircle2, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function Dashboard() {
  const [ytStatus, setYtStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(setYtStatus);
  }, []);

  const stats = [
    { label: 'Clips Generated', value: '12', icon: Scissors, trend: '+2 this week' },
    { label: 'Active Tasks', value: '1', icon: Activity, trend: 'Processing' },
    { label: 'Storage Used', value: '4.2 GB', icon: Zap, trend: '45% of quota' },
  ];

  const recentClips = [
    { name: 'Motivational Speech - Part 1', date: '2 hours ago', status: 'Uploaded to YT' },
    { name: 'Podcast Highlights - SEO', date: '1 day ago', status: 'Downloaded' },
    { name: 'Funny Moment Stream', date: '3 days ago', status: 'Processing' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Overview</h1>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
            Premium AI Automation Engine
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Link to="/app/clipper" className="flex-1 sm:flex-none">
            <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 group">
              <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
              New Auto Clip
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Status Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden group h-full shadow-[0_0_50px_rgba(99,102,241,0.05)]"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-40 h-40 text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Activity className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Live Pipeline Status</h3>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">1 active task</p>
                </div>
              </div>
              <Link to="/app/pipeline">
                <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 group">
                  Details
                  <ArrowUpRight className="ml-2 w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4 mt-auto">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-400 font-bold uppercase tracking-widest">
                  Step: <span className="text-indigo-400">AI Video Editing</span>
                </span>
                <span className="text-white font-black">85%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                />
              </div>
              <div className="flex items-center gap-6 text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-500" /> ~45s remaining</span>
                <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-purple-500" /> 2.4x Speed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* YouTube Channel Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8 rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group h-full"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Youtube className="w-40 h-40 text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <Youtube className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Active Channel</h3>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Primary Destination</p>
                </div>
              </div>
              <Link to="/app/youtube-accounts">
                <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 group">
                  Switch
                  <ArrowUpRight className="ml-2 w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>

            {ytStatus?.connected ? (
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img 
                      src={ytStatus.channel?.thumbnail} 
                      alt="Channel" 
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-neutral-950 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xl leading-tight tracking-tight">
                      {ytStatus.channel?.nickname || ytStatus.channel?.title}
                    </h4>
                    <p className="text-sm text-neutral-500 font-medium">{ytStatus.channel?.handle}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        Online ●
                      </span>
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">
                        {ytStatus.accountCount} Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest mb-6">No YouTube Access</p>
                <Link to="/app/youtube-accounts">
                  <Button className="bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20">
                    Connect Channel
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
            className="p-8 rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-neutral-400 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all duration-300">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg">{stat.trend}</span>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2 p-8 rounded-[2rem] bg-neutral-900/40 backdrop-blur-xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Recent Auto Clips</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">AI Generated Shorts</p>
            </div>
            <Link to="/app/clipper">
              <Button variant="ghost" size="sm" className="text-[10px]">View all</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentClips.map((clip, i) => (
              <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">{clip.name}</h4>
                    <p className="text-xs text-neutral-500 font-medium mt-1">{clip.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-400 border border-white/5 group-hover:border-indigo-500/30 transition-all">
                    {clip.status}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.05)]"
        >
          <h3 className="text-xl font-black text-white tracking-tight mb-8">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Pipeline Dashboard', path: '/app/pipeline', icon: Activity },
              { label: 'OAuth & API Config', path: '/app/settings', icon: Settings },
              { label: 'Create New Shorts', path: '/app/clipper', icon: ArrowUpRight },
              { label: 'View Analytics', path: '/app/projects', icon: ArrowUpRight },
            ].map((action, i) => (
              <Link 
                key={i}
                to={action.path} 
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-neutral-950/50 border border-white/5 hover:bg-neutral-900 hover:border-indigo-500/30 transition-all text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-white group"
              >
                {action.label}
                <action.icon className="w-4 h-4 text-neutral-600 group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
