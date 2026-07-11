import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scissors, Youtube, Link as LinkIcon, Sparkles, Clock, TrendingUp, CheckCircle, Upload, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { Clip } from '../../types/pipeline';
import { useClipperStore } from '../../store/clipperStore';


export function AutoClipper() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<string>('');
  
  const { clips, videoInfo, setClips, setVideoInfo, clearClips } = useClipperStore();
  
  const [uploadingClips, setUploadingClips] = useState<{ [key: number]: boolean | string }>({});
  const [uploadedClips, setUploadedClips] = useState<{ [key: number]: boolean }>({});
  const [ytStatus, setYtStatus] = useState<{connected: boolean} | null>(null);
  const [apiError, setApiError] = useState<{
    stage: string;
    error: string;
    solution: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    console.log('[AutoClipper] Component mounted. Current clips count:', clips.length);
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(data => setYtStatus(data))
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!url) return;
    
    setIsProcessing(true);
    clearClips(); // Using store clear
    setUploadedClips({});
    setApiError(null);
    
    let isErrorHandled = false;
    try {
      setStep('Fetching livestream data...');
      
      const response = await fetch('/api/generate-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url }),
      });
      
      if (!response.ok) {
        let errPayload;
        try {
          errPayload = await response.json();
        } catch {
          throw new Error('Failed to parse system response.');
        }
        if (errPayload && errPayload.error) {
          setApiError({
            stage: errPayload.stage || 'Generator',
            error: errPayload.error,
            solution: errPayload.solution || 'Verify that the video is public and that your API keys are valid.',
            details: errPayload.details
          });
          isErrorHandled = true;
          throw new Error(errPayload.error);
        } else {
          throw new Error('An unknown pipeline error occurred.');
        }
      }

      setStep('Analyzing content with AI...');
      const data = await response.json();
      
      setTimeout(() => {
        setStep('Extracting viral moments...');
        setTimeout(() => {
          console.log('[AutoClipper] Clips generated:', data.clips.length);
          setVideoInfo(data.originalVideo);
          setClips(data.clips);
          setIsProcessing(false);
          setStep('');
        }, 1500);
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setIsProcessing(false);
      setStep('');
      if (!isErrorHandled) {
        setApiError({
          stage: 'Input Link Extraction',
          error: error.message || 'Error processing video link',
          solution: 'Ensure the link is valid, public, and that you have configured your Gemini API Key.'
        });
      }
    }
  };

  const handleClearClips = () => {
    console.log('[AutoClipper] User explicitly cleared clips.');
    clearClips();
    setUploadedClips({});
  };

  const handleUploadClip = async (index: number, clip: Clip) => {
    if (!ytStatus?.connected) {
      setApiError({
        stage: 'Export',
        error: 'YouTube Account Disconnected',
        solution: 'Connect your YouTube channel in Settings first to authorize direct exports.'
      });
      return;
    }

    setApiError(null);
    setUploadingClips(prev => ({ ...prev, [index]: 'Extracting Audio...' }));
    
    const progressSteps = [
      'Extracting Audio...', 
      'Generating AI Subtitles...', 
      'Rendering Animated Captions...', 
      'Exporting Final Video...', 
      'Uploading to YouTube...'
    ];
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      currentStep++;
      if (currentStep < progressSteps.length) {
          setUploadingClips(prev => {
             if (prev[index]) return { ...prev, [index]: progressSteps[currentStep] };
             return prev;
          });
      }
    }, 5000);

    try {
      const response = await fetch('/api/youtube/upload-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip, videoUrl: url }),
      });
      
      if (response.ok) {
        setUploadedClips(prev => ({ ...prev, [index]: true }));
      } else {
        let errPayload;
        try {
          errPayload = await response.json();
        } catch {
          throw new Error('Failed to parse error response from system.');
        }
        if (errPayload && errPayload.error) {
          setApiError({
            stage: errPayload.stage || 'Export',
            error: errPayload.error,
            solution: errPayload.solution || 'Verify your YouTube link settings or upload quotas.',
            details: errPayload.details
          });
        } else {
          throw new Error('YouTube export failed due to an unknown system error.');
        }
      }
    } catch (error: any) {
      console.error('Upload failed', error);
      if (!apiError) {
        setApiError({
          stage: 'Export',
          error: error.message || 'Failed to upload clip',
          solution: 'Ensure that the video isn\'t private or age-restricted, and try again.'
        });
      }
    } finally {
      clearInterval(progressInterval);
      setUploadingClips(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleYoutubeConnect = () => {
    window.location.href = '/api/auth/youtube';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Neural Clipper</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Automated Viral Moment Extraction
          </p>
        </div>
      </div>

      {ytStatus && !ytStatus.connected && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-amber-500/5"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black text-amber-500 tracking-tight">Sync Restricted</h3>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Connect YouTube node to enable direct broadcast</p>
            </div>
          </div>
          <Button onClick={handleYoutubeConnect} className="h-14 px-10 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all border-0 group">
            <Youtube className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            Initialize YouTube Link
          </Button>
        </motion.div>
      )}

      {apiError && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/5 backdrop-blur-xl border border-rose-500/20 rounded-[2.5rem] p-10 shadow-2xl shadow-rose-500/5 space-y-6 text-left"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner flex-shrink-0">
              <AlertCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <h3 className="text-xl font-black text-rose-500 tracking-tight uppercase">System Diagnostic Report</h3>
                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[9px] font-black tracking-widest uppercase flex-shrink-0 self-start">
                  STAGE: {apiError.stage}
                </span>
              </div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
                An exception occurred during pipeline execution
              </p>
              
              <div className="mt-6 space-y-4 text-left">
                <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-2">Error Message</h4>
                  <p className="text-white text-sm font-medium font-mono whitespace-pre-wrap">{apiError.error}</p>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2">Suggested Resolution</h4>
                  <p className="text-emerald-300 text-sm font-medium leading-relaxed">{apiError.solution}</p>
                </div>

                {apiError.details && (
                  <details className="group bg-neutral-950/40 border border-white/5 rounded-2xl p-6">
                    <summary className="text-[10px] font-black text-neutral-500 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">
                      <span>Show Technical Details (Stack Trace)</span>
                      <span className="text-neutral-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <pre className="mt-4 text-xs font-mono text-neutral-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                      {apiError.details}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              onClick={() => setApiError(null)}
              className="h-10 px-6 border-white/10 hover:bg-white/5 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl"
            >
              Dismiss Report
            </Button>
          </div>
        </motion.div>
      )}

      {/* Input Section */}
      <div className="bg-neutral-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-10 shadow-2xl shadow-indigo-500/10 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
            <Scissors className="w-10 h-10" />
          </div>
          
          <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">Feed the Neural Matrix</h2>
          <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">Universal Livestream & Video Moment Extraction</p>
          
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-600 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Universal Video Link (YouTube, Twitch, URL)..." 
                  className="w-full h-20 bg-neutral-950/60 border border-white/10 rounded-[1.75rem] pl-16 pr-6 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-lg shadow-inner"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
            <Button 
              size="lg" 
              className="h-20 px-12 gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 w-full group transition-all"
              onClick={handleGenerate}
              disabled={!url || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              )}
              {isProcessing ? 'Processing Matrix...' : 'Execute Viral Extraction'}
            </Button>
          </div>
          
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col items-center gap-6"
            >
              <div className="flex gap-4">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <div className="bg-indigo-500/10 px-6 py-2 rounded-full border border-indigo-500/20">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{step}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {clips.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/5 pb-10">
            <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-4 uppercase">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              Neural Output Hash
            </h3>
            
            <Button 
              variant="outline" 
              onClick={handleClearClips}
              className="h-10 px-6 border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Clear Clips
            </Button>
            {videoInfo && (
              <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  Source: <span className="text-white tracking-normal lowercase font-bold">{videoInfo.title}</span>
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-10">
            {clips.map((clip, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neutral-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-10 flex flex-col md:flex-row gap-10 shadow-2xl hover:border-white/10 transition-all group"
              >
                {/* Simulated Video Preview */}
                <div className="w-full md:w-80 aspect-[9/16] bg-black rounded-[2.5rem] border-2 border-white/5 relative overflow-hidden flex-shrink-0 group/preview shadow-2xl">
                  {videoInfo?.id ? (
                    <img 
                      src={`https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover opacity-40 group-hover/preview:opacity-60 transition-all duration-700 scale-110 group-hover/preview:scale-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="w-20 h-20 text-neutral-900" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-2xl group-hover/preview:scale-110 transition-transform duration-500">
                      <Scissors className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-xl px-4 py-3 rounded-2xl text-[10px] font-black font-mono tracking-widest border border-white/10 text-white text-center">
                    {clip.startTime} — {clip.endTime}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col py-4">
                  <div className="flex items-start justify-between gap-8 mb-8">
                    <div className="min-w-0">
                      <h4 className="text-2xl font-black text-white mb-4 tracking-tighter group-hover:text-indigo-400 transition-colors uppercase">{clip.title}</h4>
                      <p className="text-sm font-medium text-neutral-500 leading-relaxed max-w-xl">{clip.description}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] p-6 min-w-[7rem] shadow-xl shadow-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors">
                      <TrendingUp className="w-6 h-6 text-indigo-400 mb-2" />
                      <span className="text-2xl font-black text-white tracking-tighter">{clip.viralScore}</span>
                      <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">V-Score</span>
                    </div>
                  </div>
                  
                  <div className="mb-10 flex flex-wrap gap-3">
                    {clip.tags.map((tag, i) => (
                      <span key={i} className="px-4 py-2 bg-neutral-950/50 border border-white/5 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] hover:bg-indigo-500/10 transition-colors cursor-default">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/5">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] transition-all">Modify Meta</Button>
                    <Button 
                      className={cn(
                        "flex-1 h-14 gap-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl",
                        uploadedClips[idx] ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                      )}
                      onClick={() => handleUploadClip(idx, clip)}
                      disabled={!!uploadingClips[idx] || uploadedClips[idx]}
                    >
                      {uploadingClips[idx] ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : uploadedClips[idx] ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      {uploadingClips[idx] ? (typeof uploadingClips[idx] === 'string' ? uploadingClips[idx] : 'Processing...') : uploadedClips[idx] ? 'Published!' : 'Broadcast to YouTube'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
