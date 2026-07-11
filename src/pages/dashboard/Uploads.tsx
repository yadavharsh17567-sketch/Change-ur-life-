import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, FileVideo, HardDrive, Loader2, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function Uploads() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchUploads = async () => {
    try {
      const res = await fetch('/api/uploads');
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      fetchUploads();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const importToEditor = async (upload: any) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Project: ${upload.title}`,
          status: 'Draft',
          progress: 0,
          fileUrl: upload.fileUrl
        })
      });
      const data = await res.json();
      navigate(`/app/editor/${data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Media Repository</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Raw Assets & Distributed Storage
          </p>
        </div>
        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleUpload} 
        />
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-8 group"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
          )}
          {isUploading ? 'Uploading...' : 'Initialize Upload'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {uploads.length === 0 && !isUploading && (
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-12 text-center text-neutral-500 font-bold uppercase tracking-widest text-sm">
              No uploads found. Initialize upload to begin.
            </div>
          )}
          {uploads.map((upload, i) => (
            <motion.div 
              key={upload.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all group shadow-xl"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <FileVideo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors truncate max-w-[200px] sm:max-w-xs">{upload.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1.5">
                    Uploaded {new Date(upload.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => importToEditor(upload)}
                className="rounded-xl px-4 py-2 bg-white/5 hover:bg-indigo-500/10 text-neutral-400 hover:text-indigo-400 transition-all font-black text-[10px] uppercase tracking-widest gap-2 w-full sm:w-auto"
              >
                <Play className="w-3 h-3" />
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
                <span className="text-2xl font-black text-white tracking-tighter">{(uploads.length * 0.1).toFixed(1)} <span className="text-sm font-bold text-neutral-500">GB</span></span>
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pb-1">100 GB Quota</span>
              </div>
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, uploads.length * 2)}%` }}
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
