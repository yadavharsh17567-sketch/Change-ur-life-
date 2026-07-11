import { Folder, Play, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function Projects() {
  const projects = [
    { id: 1, name: 'SEO Guide 2026', date: '2 hours ago', status: 'Completed', duration: '10:45' },
    { id: 2, name: 'Untitled_Video_01', date: '1 day ago', status: 'Draft', duration: '02:15' },
    { id: 3, name: 'My Vlog Ep 5', date: '3 days ago', status: 'Exported', duration: '15:20' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Project Archive</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Storage & Production History
          </p>
        </div>
        <Link to="/app/editor">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-8 group">
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <motion.div 
            key={project.id} 
            whileHover={{ y: -5 }}
            className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all group cursor-pointer shadow-2xl"
          >
            <div className="aspect-video bg-neutral-950 flex items-center justify-center relative overflow-hidden">
              {/* Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Folder className="w-16 h-16 text-neutral-900 group-hover:text-indigo-500/20 transition-all duration-500 transform group-hover:scale-110" />
              
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-white/5">
                {project.duration}
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <h3 className="font-black text-white mb-2 truncate tracking-tight text-lg group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <span>{project.date}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    <span className={cn(
                      "tracking-[0.1em]",
                      project.status === 'Completed' ? 'text-emerald-400' : 
                      project.status === 'Draft' ? 'text-amber-400' : 
                      'text-indigo-400'
                    )}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 -mr-3 text-neutral-600 hover:text-white hover:bg-white/5 rounded-2xl">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Placeholder / Empty State CTA */}
        <Link to="/app/editor" className="group">
          <div className="h-full min-h-[300px] rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-indigo-500/30 bg-neutral-900/10 transition-all flex flex-col items-center justify-center gap-4 group-hover:bg-indigo-500/5">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] group-hover:text-indigo-400">Initialize New Project</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
