import { motion } from 'motion/react';
import { Play, Activity, Scissors, Mic, ImageIcon, UploadCloud, ChevronRight, BarChart3, Clock } from 'lucide-react';

export function DemoSection() {
  return (
    <section className="py-32 relative px-6 overflow-hidden">
      {/* Background aurora */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Experience the Workflow</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Get a glimpse of the powerful dashboard and automation engine powering top creators.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Mock Dashboard Top Nav */}
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs">AI</div>
              <div className="h-4 w-32 rounded bg-white/5" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <div className="h-8 w-24 rounded-lg bg-white/5" />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-0">
            {/* Sidebar */}
            <div className="lg:col-span-2 border-r border-white/5 p-4 space-y-4 hidden lg:block">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-10 rounded-xl ${i === 1 ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5'}`} />
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-7 p-8 space-y-8">
              <div className="aspect-video rounded-3xl bg-black border border-white/5 relative overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000" 
                  className="w-full h-full object-cover opacity-60"
                  alt="Video Preview"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-20 h-20 rounded-full bg-indigo-600/90 flex items-center justify-center shadow-2xl backdrop-blur-sm cursor-pointer"
                  >
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </motion.div>
                </div>
                {/* Overlay Subtitle */}
                <div className="absolute bottom-8 left-0 w-full text-center px-12">
                  <motion.p 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] italic"
                  >
                    "The future of <span className="text-yellow-400">content creation</span> is here!"
                  </motion.p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <BarChart3 className="w-3 h-3" />
                    Engagement
                  </div>
                  <div className="text-xl font-bold text-white">+84%</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Time Saved
                  </div>
                  <div className="text-xl font-bold text-white">12.5h</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <Activity className="w-3 h-3" />
                    Status
                  </div>
                  <div className="text-xs font-bold text-emerald-400 uppercase">Active</div>
                </div>
              </div>
            </div>

            {/* Sidebar Right */}
            <div className="lg:col-span-3 border-l border-white/5 p-8 bg-black/20 space-y-8">
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">AI Pipeline</h4>
                <div className="space-y-4">
                  <PipelineItem label="Transcription" status="done" />
                  <PipelineItem label="Highlight Detection" status="done" />
                  <PipelineItem label="Dynamic Captions" status="loading" />
                  <PipelineItem label="B-Roll Overlay" status="pending" />
                  <PipelineItem label="Exporting" status="pending" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Thumbnail Preview</h4>
                <div className="aspect-square rounded-2xl bg-white/5 border border-white/5 overflow-hidden relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                     <ImageIcon className="w-8 h-8 text-neutral-800" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PipelineItem({ label, status }: { label: string; status: 'done' | 'loading' | 'pending' }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-medium ${status === 'pending' ? 'text-neutral-600' : 'text-neutral-300'}`}>{label}</span>
      {status === 'done' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
      {status === 'loading' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
      {status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />}
    </div>
  );
}
