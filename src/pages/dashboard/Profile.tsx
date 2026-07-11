import { motion } from 'motion/react';
import { Button } from '../../components/ui/Button';

export function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter">Identity Module</h1>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
          Personal Bio-Data & Authentication
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[2.5rem] border border-white/5 bg-neutral-900/40 backdrop-blur-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-10 border-b border-white/5 bg-white/5">
          <div className="flex flex-col sm:flex-row items-center gap-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-2xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.75rem] bg-neutral-900 border-4 border-neutral-950 overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=User&background=171717&color=a3a3a3&size=150" alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-indigo-500 transition-colors shadow-xl">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-black text-white tracking-tight">Jane Doe</h2>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-1.5">Alpha Access Personnel</p>
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-4">
                <Button size="sm" variant="outline" className="rounded-xl px-6 h-10 border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">Update Signature</Button>
                <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-xl px-6 h-10 text-[10px] font-black uppercase tracking-widest">Purge Avatar</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Given Name</label>
              <input type="text" defaultValue="Jane" className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium shadow-inner" />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Family Name</label>
              <input type="text" defaultValue="Doe" className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium shadow-inner" />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Communication Channel</label>
            <input type="email" defaultValue="jane@example.com" disabled className="w-full h-14 bg-neutral-950/30 border border-white/5 rounded-2xl px-6 text-neutral-600 cursor-not-allowed font-medium" />
            <p className="text-[10px] text-neutral-600 italic ml-1">Primary identity remains locked to verified email.</p>
          </div>

          <div className="pt-6 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-10 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              Update Identity
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
