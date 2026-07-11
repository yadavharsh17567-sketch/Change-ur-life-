import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Type, Image as ImageIcon, Sparkles, Layout, Layers, Search, Download, Settings2, Video, MousePointer2, Youtube, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function VideoEditor() {
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
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Video Editor</h1>
          <p className="text-neutral-400 text-sm">Project: Untitled_Video_01</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center">
          {ytStatus?.connected ? (
            <div className="flex items-center gap-3 bg-neutral-900/50 border border-white/5 rounded-lg p-1 pr-3">
              {ytStatus.channel?.thumbnail && (
                <img src={ytStatus.channel.thumbnail} alt="Channel" className="w-6 h-6 rounded-md" />
              )}
              <span className="text-xs font-medium">{ytStatus.channel?.title || 'Connected to YouTube'}</span>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={handleYoutubeConnect}>
              <Youtube className="w-4 h-4" />
              Connect YouTube
            </Button>
          )}

          <Button variant="outline" size="sm">Save Draft</Button>
          
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUploadToYoutube} 
          />
          <Button 
            size="sm" 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !ytStatus?.connected}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Uploading...' : 'Publish to YouTube'}
          </Button>
        </div>
      </div>
      
      {uploadSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-center justify-between text-sm">
          <span>Successfully published to YouTube!</span>
          <a href={`https://youtube.com/watch?v=${uploadSuccess}`} target="_blank" rel="noreferrer" className="underline font-medium hover:text-emerald-300">
            View Video
          </a>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-visible lg:overflow-hidden">
        
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-[500px] lg:min-h-0 lg:overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 min-h-[250px] bg-neutral-900/80 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative group">
            <div className="flex-1 flex items-center justify-center bg-black relative">
              <Video className="w-16 h-16 text-neutral-800" />
              
              {/* Simulated Subtitles */}
              {activeTab === 'subtitles' && (
                <div className="absolute bottom-16 inset-x-0 flex justify-center">
                  <span className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-lg font-medium border border-white/10">
                    Transform the way you build.
                  </span>
                </div>
              )}
              
              {/* Simulated Watermark */}
              {activeTab === 'watermark' && (
                <div className="absolute top-8 right-8 opacity-50">
                  <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white drop-shadow-md">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>ChangeYourLife</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Player Controls */}
            <div className="h-14 bg-neutral-950/80 backdrop-blur border-t border-white/5 flex items-center px-4 gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden relative cursor-pointer">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-indigo-500 rounded-full" />
              </div>
              <span className="text-xs font-medium font-mono text-neutral-400">00:45 / 02:15</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-48 shrink-0 bg-neutral-900/80 rounded-2xl border border-white/5 p-4 flex flex-col overflow-x-auto">
            <div className="min-w-[600px] flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Timeline</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="w-7 h-7"><MousePointer2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-1 relative">
                {/* Time markers */}
                <div className="h-6 border-b border-white/5 flex items-end px-2 mb-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex-1 border-l border-white/10 h-2 text-[10px] text-neutral-500 pl-1">
                      00:0{i}
                    </div>
                  ))}
                </div>
                
                {/* Tracks */}
                <div className="space-y-2">
                  <div className="h-8 bg-indigo-500/10 rounded-md border border-indigo-500/20 relative flex items-center px-2">
                    <Video className="w-3 h-3 text-indigo-400 mr-2 shrink-0" />
                    <span className="text-xs text-indigo-300">Video Track 1</span>
                    <div className="absolute inset-y-1 left-[10%] right-[20%] bg-indigo-500/30 rounded border border-indigo-500/50" />
                  </div>
                  <div className="h-8 bg-amber-500/10 rounded-md border border-amber-500/20 relative flex items-center px-2">
                    <Type className="w-3 h-3 text-amber-400 mr-2 shrink-0" />
                    <span className="text-xs text-amber-300">Subtitles</span>
                    <div className="absolute inset-y-1 left-[15%] right-[25%] bg-amber-500/30 rounded border border-amber-500/50" />
                  </div>
                </div>
                
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white z-10">
                  <div className="absolute -top-2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="w-full lg:w-80 shrink-0 bg-neutral-900/80 rounded-2xl border border-white/5 flex flex-col overflow-hidden min-h-[400px] lg:h-full lg:min-h-0">
          <div className="flex border-b border-white/5">
            {[
              { id: 'subtitles', icon: Type, label: 'Subs' },
              { id: 'branding', icon: Layout, label: 'Brand' },
              { id: 'watermark', icon: ImageIcon, label: 'Mark' },
              { id: 'seo', icon: Search, label: 'SEO' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'subtitles' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm mb-2">AI Subtitle Generation</h3>
                  <p className="text-xs text-neutral-400 mb-4">Automatically generate accurate subtitles using Gemini models.</p>
                  <Button className="w-full gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/20">
                    <Sparkles className="w-4 h-4" />
                    Auto-Generate
                  </Button>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-neutral-500 uppercase">Current Subtitles</h4>
                  {[
                    { time: '00:00 - 00:04', text: 'Welcome to the tutorial.' },
                    { time: '00:04 - 00:08', text: 'Today we will learn how to build apps.' },
                  ].map((sub, i) => (
                    <div key={i} className="bg-neutral-950 p-3 rounded-xl border border-white/5 group">
                      <div className="text-[10px] text-indigo-400 font-mono mb-1">{sub.time}</div>
                      <p className="text-sm text-neutral-200" contentEditable suppressContentEditableWarning>{sub.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm mb-4">Brand Kit</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-neutral-400 mb-2 block">Brand Colors</label>
                      <div className="flex gap-2">
                        {['#6366f1', '#a855f7', '#ec4899', '#ffffff', '#000000'].map(color => (
                          <button key={color} className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                        ))}
                        <button className="w-8 h-8 rounded-full border border-dashed border-white/20 flex items-center justify-center hover:bg-white/5">
                          <span className="text-neutral-400 pb-0.5">+</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 mb-2 block">Typography</label>
                      <select className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                        <option>Inter</option>
                        <option>Space Grotesk</option>
                        <option>JetBrains Mono</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'watermark' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm mb-4">Video Watermark</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-neutral-950 border border-white/5 rounded-xl">
                      <span className="text-sm">Enable Watermark</span>
                      <div className="w-10 h-5 bg-indigo-500 rounded-full p-1 cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-neutral-400 mb-2 block">Upload Logo</label>
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors">
                        <ImageIcon className="w-6 h-6 text-neutral-500 mb-2" />
                        <span className="text-sm text-neutral-300">Click to upload image</span>
                        <span className="text-xs text-neutral-500 mt-1">PNG or SVG, max 2MB</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-neutral-400 mb-2 block">Position</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6,7,8,9].map(i => (
                          <button key={i} className={`h-8 border border-white/10 rounded ${i === 3 ? 'bg-indigo-500/20 border-indigo-500/50' : 'hover:bg-white/5'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm mb-2">AI SEO Generator</h3>
                  <p className="text-xs text-neutral-400 mb-4">Generate optimized titles, descriptions, and tags for YouTube/Socials.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block">Video Topic / Description</label>
                      <textarea 
                        className="w-full h-20 bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="What is this video about?"
                        value={seoDescription}
                        onChange={e => setSeoDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 mb-1 block">Target Keywords (optional)</label>
                      <input 
                        className="w-full h-10 bg-neutral-950 border border-white/10 rounded-xl px-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="e.g. tutorial, react, 2026"
                        value={seoKeywords}
                        onChange={e => setSeoKeywords(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleGenerateSeo}
                      disabled={isGeneratingSeo || !seoDescription}
                    >
                      {isGeneratingSeo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
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
                    className="space-y-4 pt-4 border-t border-white/5"
                  >
                    <div>
                      <label className="text-xs text-indigo-400 font-medium mb-1 block">Optimized Title</label>
                      <div className="bg-neutral-950 border border-white/10 rounded-lg p-3 text-sm text-white">
                        {seoResult.title}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-indigo-400 font-medium mb-1 block">Description</label>
                      <div className="bg-neutral-950 border border-white/10 rounded-lg p-3 text-sm text-neutral-300 text-xs">
                        {seoResult.description}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-indigo-400 font-medium mb-1 block">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {seoResult.tags?.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-neutral-300">
                            #{tag.replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
