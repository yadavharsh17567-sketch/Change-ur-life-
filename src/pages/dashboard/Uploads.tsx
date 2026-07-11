import { motion } from 'motion/react';
import { UploadCloud, FileVideo, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function Uploads() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Media Repository</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Raw Assets & Distributed Storage
          </p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-8 group">
          <UploadCloud className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
          Initialize Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex items-center justify-between hover:border-white/10 transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <FileVideo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">Raw_Footage_0{i}.mp4</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1.5">
                    Uploaded Oct 1{i}, 2026 <span className="mx-2 opacity-20">|</span> {120 + i * 45} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl px-4 py-2 bg-white/5 hover:bg-indigo-500/10 text-neutral-400 hover:text-indigo-400 transition-all font-black text-[10px] uppercase tracking-widest">
                Import to Editor
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] animate-pulse" />
            
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.25rem] flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                <HardDrive className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-white tracking-tight text-lg">Storage Matrix</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Neural Pro Plan</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-white tracking-tighter">45.5 <span className="text-sm font-bold text-neutral-500">GB</span></span>
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pb-1">100 GB Quota</span>
              </div>
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45.5%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full" 
                />
              </div>
            </div>
            
            <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em]">Scale Storage Capacity</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
