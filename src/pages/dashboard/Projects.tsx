import { Folder, Play, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export function Projects() {
  const projects = [
    { id: 1, name: 'SEO Guide 2026', date: '2 hours ago', status: 'Completed', duration: '10:45' },
    { id: 2, name: 'Untitled_Video_01', date: '1 day ago', status: 'Draft', duration: '02:15' },
    { id: 3, name: 'My Vlog Ep 5', date: '3 days ago', status: 'Exported', duration: '15:20' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage and edit your video projects.</p>
        </div>
        <Link to="/app/editor">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Play className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors group cursor-pointer">
            <div className="aspect-video bg-neutral-950 flex items-center justify-center relative">
              <Folder className="w-10 h-10 text-neutral-800 group-hover:text-neutral-700 transition-colors" />
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono font-medium">
                {project.duration}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white mb-1 truncate">{project.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{project.date}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                    <span className={project.status === 'Completed' ? 'text-emerald-400' : project.status === 'Draft' ? 'text-amber-400' : 'text-indigo-400'}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 -mr-2 text-neutral-500 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
