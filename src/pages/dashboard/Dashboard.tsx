import { motion } from 'motion/react';
import { UploadCloud, Youtube, Activity, Zap, Scissors, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function Dashboard() {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-neutral-400 text-sm mt-1">Welcome to Change Ur Life Automation.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to="/app/clipper">
            <Button className="flex-1 sm:flex-none gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Youtube className="w-4 h-4" />
              New Auto Clip
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-neutral-500">{stat.trend}</span>
            </div>
            <p className="text-sm text-neutral-400 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-semibold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900/50 border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Auto Clips</h3>
            <Link to="/app/clipper">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentClips.map((clip, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-indigo-400 transition-colors">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm group-hover:text-white transition-colors">{clip.name}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{clip.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300">
                    {clip.status}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5"
        >
          <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/app/settings" className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-white/5 hover:bg-neutral-800 hover:border-white/10 transition-all text-sm font-medium text-left text-neutral-300 hover:text-white group">
              Configure OAuth & API
              <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
            </Link>
            <Link to="/app/clipper" className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-white/5 hover:bg-neutral-800 hover:border-white/10 transition-all text-sm font-medium text-left text-neutral-300 hover:text-white group">
              Create New Shorts
              <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
            </Link>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-white/5 hover:bg-neutral-800 hover:border-white/10 transition-all text-sm font-medium text-left text-neutral-300 hover:text-white group">
              View Analytics
              <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
