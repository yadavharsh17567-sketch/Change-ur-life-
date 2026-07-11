import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, FileText, Video, Mic, BarChart3, Image as ImageIcon, UploadCloud, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Content */}
        <div className="text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-widest"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Next-Gen AI Video Automation
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Create Viral Shorts <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Automatically
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-xl leading-relaxed"
          >
            Paste a YouTube Live Stream or Video Link and let AI download, edit, subtitle, optimize, generate SEO, create thumbnails, and upload to your YouTube channel automatically.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link to="/register">
              <Button size="lg" className="px-8 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 gap-2 group">
                🚀 Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="glass" className="px-8 h-14 rounded-2xl border-white/10 hover:border-white/20 gap-2">
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </Button>
            <Button variant="ghost" className="text-neutral-400 hover:text-white gap-2">
              <FileText className="w-5 h-5" />
              Documentation
            </Button>
          </motion.div>

          {/* Floating Feature Cards (Left) */}
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:block space-y-6">
            <FloatingCard icon={Video} label="AI Video Editor" delay={0} />
            <FloatingCard icon={Mic} label="AI Subtitles" delay={1.5} />
            <FloatingCard icon={BarChart3} label="SEO Optimizer" delay={3} />
          </div>
        </div>

        {/* Right Side: Dashboard Preview & AI Orb */}
        <div className="relative flex justify-center items-center h-[500px]">
          {/* Animated AI Orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-80 h-80">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-indigo-500/20 shadow-[0_0_80px_rgba(99,102,241,0.2)]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-purple-500/20"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-12 h-12 text-indigo-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Live Dashboard Simulation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative z-20 w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Active Workflow
              </div>
            </div>

            <div className="space-y-6">
              <WorkflowStep label="Downloading..." progress={100} delay={0} />
              <WorkflowStep label="Generating AI Subtitles..." progress={65} delay={1} />
              <WorkflowStep label="Generating Thumbnail..." progress={80} delay={2} />
              <WorkflowStep label="Generating SEO..." progress={100} delay={3} />
              <WorkflowStep label="Uploading to YouTube..." progress={40} delay={4} />
            </div>

            {/* Glowing accents */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-[60px]" />
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 blur-[60px]" />
          </motion.div>

          {/* Floating Feature Cards (Right) */}
          <div className="absolute -right-12 top-1/4 hidden xl:block">
            <FloatingCard icon={ImageIcon} label="Thumbnail Gen" delay={0.7} />
          </div>
          <div className="absolute -right-24 bottom-1/4 hidden xl:block">
            <FloatingCard icon={UploadCloud} label="Auto Upload" delay={2.2} />
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowStep({ label, progress, delay }: { label: string; progress: number; delay: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400 font-medium">{label}</span>
        <span className="text-white font-bold">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
        />
      </div>
    </div>
  );
}

function FloatingCard({ icon: Icon, label, delay }: { icon: any; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      className="flex items-center gap-3 px-4 py-3 bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl hover:border-white/10 transition-colors cursor-default"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <span className="text-xs font-bold text-neutral-300">{label}</span>
    </motion.div>
  );
}
