import { UploadCloud, FileVideo, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function Uploads() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Uploads</h1>
          <p className="text-neutral-400 text-sm mt-1">Your raw video files and assets.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <UploadCloud className="w-4 h-4" />
          Upload Files
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-neutral-900 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Raw_Footage_0{i}.mp4</h3>
                  <p className="text-xs text-neutral-500 mt-1">Uploaded Oct 1{i}, 2026 • {120 + i * 45} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                Use in Editor
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Storage Usage</h3>
                <p className="text-xs text-neutral-400">Pro Plan</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-medium">
                <span>45.5 GB</span>
                <span className="text-neutral-500">100 GB</span>
              </div>
              <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[45%]" />
              </div>
            </div>
            
            <Button variant="outline" className="w-full text-xs">Upgrade Storage</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
