import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, Type, Image as ImageIcon, 
  Sparkles, Layout, Layers, Search, Download, Settings2, Video, 
  MousePointer2, Youtube, Upload, CheckCircle2, Plus 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export function VideoEditor() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'subtitles' | 'branding' | 'watermark' | 'seo'>('subtitles');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // SEO State
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<{ title?: string, description?: string, tags?: string[] } | null>(null);

  // YouTube State
  const [ytStatus, setYtStatus] = useState<{connected: boolean, channel?: {title: string, thumbnail: string}} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(data => setYtStatus(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setProject(data);
        })
        .catch(console.error);
    }
  }, [id]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.00`;
  };

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: seoDescription, keywords: seoKeywords }),
      });
      const data = await response.json();
      setSeoResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleYoutubeConnect = () => {
    window.location.href = '/api/auth/youtube';
  };

  const handleUploadToYoutube = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append('video', e.target.files[0]);
    formData.append('title', seoResult?.title || 'Untitled Video');
    formData.append('description', seoResult?.description || '');
    if (seoResult?.tags) {
      formData.append('tags', JSON.stringify(seoResult.tags));
    }

    try {
      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadSuccess(data.videoId);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter truncate max-w-[200px] sm:max-w-xs">{project?.title || 'Untitled_Project_01'}</h1>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mt-1">Status: Production Mode</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {ytStatus?.connected ? (
            <div className="flex items-center gap-4 bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 pr-5 shadow-lg">
              {ytStatus.channel?.thumbnail && (
                <img src={ytStatus.channel.thumbnail} alt="Channel" className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10" />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-tight">{ytStatus.channel?.title || 'YouTube Linked'}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Sink</span>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 text-rose-400 border-rose-500/20 hover:bg-rose-500/10 rounded-2xl h-11 px-5" onClick={handleYoutubeConnect}>
              <Youtube className="w-4 h-4" />
              Sync YouTube
            </Button>
          )}

          <Button variant="outline" className="h-11 rounded-2xl border-white/10 hover:bg-white/5 px-6 font-black text-[10px] uppercase tracking-widest">Save Matrix</Button>
          
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUploadToYoutube} 
          />
          <Button 
            className="gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 h-11 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest group" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !ytStatus?.connected}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
            )}
            {isUploading ? 'Transferring...' : 'Deploy to YouTube'}
          </Button>
        </div>
      </div>
      
      {uploadSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-widest"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>Success: Broadcast initialized on YouTube Matrix</span>
          </div>
          <a href={`https://youtube.com/watch?v=${uploadSuccess}`} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-400 transition-colors">
            Stream Now
          </a>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto lg:overflow-hidden pb-10">
        
        {/* Left Side: 9:16 Phone Mockup Video Player */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col items-center justify-center gap-4 bg-neutral-900/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-6 shadow-2xl h-fit">
          {/* Phone Frame wrapper */}
          <div className="relative aspect-[9/16] w-full max-w-[260px] sm:max-w-[280px] bg-neutral-950 rounded-[2.5rem] border-[6px] border-neutral-800 shadow-2xl overflow-hidden flex flex-col group">
            {/* Camera notch for realism */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-black/80 mr-4" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
            </div>
            
            {/* The Video Display */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              {project?.fileUrl ? (
                <video 
                  ref={videoRef}
                  src={project.fileUrl} 
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-neutral-600">
                  <Video className="w-16 h-16" />
                  <span className="text-[9px] font-black tracking-widest uppercase text-neutral-500">NO MEDIA STREAM</span>
                </div>
              )}
              
              {/* Simulated Subtitles overlay */}
              {activeTab === 'subtitles' && (
                <div className="absolute bottom-12 inset-x-4 flex justify-center pointer-events-none z-10 text-center">
                  <span className="bg-black/80 backdrop-blur-xl text-yellow-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-tight border border-white/10 shadow-2xl uppercase [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                    ✨ INITIALIZING NEURAL BROADCAST ✨
                  </span>
                </div>
              )}

              {/* Watermark/Identity overlay */}
              <div className="absolute top-10 right-4 pointer-events-none z-10">
                <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase bg-black/20 backdrop-blur-sm px-2 py-1 rounded">@SNAP_HUTZ</span>
              </div>
            </div>
          </div>

          {/* Mini Play/Seek controls for the phone */}
          <div className="w-full max-w-[280px] bg-neutral-950/40 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white shrink-0">
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </Button>
            <div 
              className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative cursor-pointer group/seek"
              onClick={(e) => {
                if (videoRef.current && duration) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = percent * duration;
                }
              }}
            >
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-black text-white shrink-0">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Right Side: Timeline and Sidebar Tools (takes remaining space) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 lg:overflow-hidden">
          
          {/* Sidebar Tools as main top section on right */}
          <div className="flex-1 min-h-[350px] bg-neutral-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex border-b border-white/5 bg-white/5">
              {[
                { id: 'subtitles', icon: Type, label: 'Neural Subs' },
                { id: 'branding', icon: Layout, label: 'Brand Kit' },
                { id: 'watermark', icon: ImageIcon, label: 'Identity' },
                { id: 'seo', icon: Search, label: 'SEO Engine' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-6 flex flex-col items-center justify-center gap-2 border-b-2 transition-all ${
                    activeTab === tab.id 
                      ? 'border-indigo-500 text-white bg-indigo-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className={cn("w-5 h-5 transition-all", activeTab === tab.id ? "scale-110 text-indigo-400" : "")} />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'subtitles' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="font-black text-white tracking-tight uppercase text-xs mb-3">AI Subtitle Module</h3>
                        <p className="text-[10px] font-medium text-neutral-500 mb-6 leading-relaxed">Automatically generate accurate subtitles using high-bandwidth Gemini neural nodes.</p>
                        <Button className="w-full h-12 gap-3 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest group shadow-lg">
                          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          Execute Auto-Gen
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">Output Log</h4>
                        {[
                          { time: '00:00 - 00:04', text: 'Welcome to the tutorial.' },
                          { time: '00:04 - 00:08', text: 'Today we will learn how to build apps.' },
                        ].map((sub, i) => (
                          <div key={i} className="bg-neutral-950/50 p-5 rounded-[1.5rem] border border-white/5 group hover:border-indigo-500/30 transition-all">
                            <div className="text-[10px] text-indigo-400 font-black font-mono mb-2 tracking-tighter">{sub.time}</div>
                            <p className="text-sm text-neutral-300 font-medium leading-relaxed" contentEditable suppressContentEditableWarning>{sub.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'branding' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="font-black text-white tracking-tight uppercase text-xs mb-6">Neural Brand Kit</h3>
                        <div className="space-y-8">
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 block">Primary Palette</label>
                            <div className="flex flex-wrap gap-3">
                              {['#6366f1', '#a855f7', '#ec4899', '#ffffff', '#000000'].map(color => (
                                <button key={color} className="w-10 h-10 rounded-2xl border-2 border-white/5 shadow-lg transform hover:scale-110 transition-all" style={{ backgroundColor: color }} />
                              ))}
                              <button className="w-10 h-10 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-indigo-500/50 transition-all group">
                                <Plus className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 block">Typography Engine</label>
                            <select className="w-full bg-neutral-950 border border-white/5 rounded-2xl px-5 h-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black tracking-tight">
                              <option>Inter (Modern Sans)</option>
                              <option>Space Grotesk (Tech)</option>
                              <option>JetBrains Mono (Matrix)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'watermark' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="font-black text-white tracking-tight uppercase text-xs mb-8">Video Identity</h3>
                        <div className="space-y-8">
                          <div className="flex items-center justify-between p-6 bg-neutral-950/50 border border-white/5 rounded-[1.5rem]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Watermark</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-12 h-7 bg-neutral-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 block">Identity Assets</label>
                            <div className="border-2 border-dashed border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-indigo-500/30 transition-all group">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Load Brand Logo</span>
                              <span className="text-[9px] font-bold text-neutral-500 mt-2 uppercase tracking-widest opacity-50">PNG / SVG Matrix Only</span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 block">Position Matrix</label>
                            <div className="grid grid-cols-3 gap-3">
                              {[1,2,3,4,5,6,7,8,9].map(i => (
                                <button key={i} className={`h-12 border border-white/5 rounded-2xl transition-all ${i === 3 ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-neutral-950/50 hover:bg-white/5'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'seo' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="font-black text-white tracking-tight uppercase text-xs mb-3">AI SEO Generator</h3>
                        <p className="text-[10px] font-medium text-neutral-500 mb-8 leading-relaxed">Optimize your broadcast for maximum matrix discoverability.</p>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3 block">Video Narrative</label>
                            <textarea 
                              className="w-full h-32 bg-neutral-950/50 border border-white/5 rounded-[1.5rem] p-5 text-sm text-white resize-none focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-neutral-700" 
                              placeholder="What is the broadcast's intent?"
                              value={seoDescription}
                              onChange={e => setSeoDescription(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-3 block">Neural Keywords</label>
                            <input 
                              className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-neutral-700 font-medium" 
                              placeholder="tutorial, react, 2026..."
                              value={seoKeywords}
                              onChange={e => setSeoKeywords(e.target.value)}
                            />
                          </div>
                          
                          <Button 
                            className="w-full h-14 gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20" 
                            onClick={handleGenerateSeo}
                            disabled={isGeneratingSeo || !seoDescription}
                          >
                            {isGeneratingSeo ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                Generate Metadata
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {seoResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 pt-8 border-t border-white/5"
                        >
                          <div>
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 block">Optimized Title</label>
                            <div className="bg-neutral-950/50 border border-indigo-500/10 rounded-[1.25rem] p-5 text-sm text-white font-black tracking-tight leading-relaxed">
                              {seoResult.title}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 block">Matrix Description</label>
                            <div className="bg-neutral-950/50 border border-indigo-500/10 rounded-[1.25rem] p-5 text-[11px] text-neutral-400 font-medium leading-relaxed">
                              {seoResult.description}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 block">Neural Tags</label>
                            <div className="flex flex-wrap gap-2.5">
                              {seoResult.tags?.map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                  #{tag.replace(/\s+/g, '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Timeline Track underneath Sidebar Tools */}
          <div className="h-48 shrink-0 bg-neutral-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-6 flex flex-col overflow-x-auto shadow-2xl">
            <div className="min-w-[700px] flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Neural Timeline</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-indigo-500 hover:text-white transition-all"><MousePointer2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-indigo-500 hover:text-white transition-all"><Layers className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-1 relative">
                {/* Time markers */}
                <div className="h-6 border-b border-white/5 flex items-end px-4 mb-3">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex-1 border-l border-white/10 h-2.5 text-[9px] font-black font-mono text-neutral-600 pl-2">
                      00:{i < 10 ? `0${i}` : i}
                    </div>
                  ))}
                </div>
                
                {/* Tracks */}
                <div className="space-y-3">
                  <div className="h-10 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 relative flex items-center px-4 group">
                    <Video className="w-3.5 h-3.5 text-indigo-400 mr-3 shrink-0" />
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Source Stream</span>
                    <div className="absolute inset-y-1.5 left-[10%] right-[20%] bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)] group-hover:bg-indigo-500/30 transition-all" />
                  </div>
                  <div className="h-10 bg-purple-500/5 rounded-2xl border border-purple-500/10 relative flex items-center px-4 group">
                    <Type className="w-3.5 h-3.5 text-purple-400 mr-3 shrink-0" />
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Captions</span>
                    <div className="absolute inset-y-1.5 left-[15%] right-[25%] bg-purple-500/20 rounded-xl border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)] group-hover:bg-purple-500/30 transition-all" />
                  </div>
                </div>
                
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  <div className="absolute -top-2.5 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-white rounded shadow-lg" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
