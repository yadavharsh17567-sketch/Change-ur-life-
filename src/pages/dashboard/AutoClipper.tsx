import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scissors, Youtube, Link as LinkIcon, Sparkles, Clock, TrendingUp, CheckCircle, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Clip {
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  endTime: string;
  viralScore: number;
}

export function AutoClipper() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<string>('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [videoInfo, setVideoInfo] = useState<{ title: string; id: string } | null>(null);
  const [uploadingClips, setUploadingClips] = useState<{ [key: number]: boolean | string }>({});
  const [uploadedClips, setUploadedClips] = useState<{ [key: number]: boolean }>({});
  const [ytStatus, setYtStatus] = useState<{connected: boolean} | null>(null);

  useEffect(() => {
    fetch('/api/youtube/status')
      .then(res => res.json())
      .then(data => setYtStatus(data))
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!url) return;
    
    setIsProcessing(true);
    setClips([]);
    setVideoInfo(null);
    setUploadedClips({});
    
    try {
      setStep('Fetching livestream data...');
      
      const response = await fetch('/api/generate-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      setStep('Analyzing content with AI...');
      const data = await response.json();
      
      setTimeout(() => {
        setStep('Extracting viral moments...');
        setTimeout(() => {
          setVideoInfo(data.originalVideo);
          setClips(data.clips);
          setIsProcessing(false);
          setStep('');
        }, 1500);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setStep('');
      alert('Error processing video');
    }
  };

  const handleUploadClip = async (index: number, clip: Clip) => {
    if (!ytStatus?.connected) {
      alert('Please connect your YouTube channel first.');
      return;
    }

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
        const errorData = await response.json();
        alert('Upload failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload clip');
    } finally {
      clearInterval(progressInterval);
      setUploadingClips(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleYoutubeConnect = () => {
    window.location.href = '/api/auth/youtube';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auto Clipper</h1>
        <p className="text-neutral-400 text-sm mt-1">Turn long livestreams into viral Shorts automatically.</p>
      </div>

      {ytStatus && !ytStatus.connected && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-500">YouTube Channel Not Connected</h3>
              <p className="text-sm text-neutral-400">Connect your channel to publish auto-generated clips directly.</p>
            </div>
          </div>
          <Button onClick={handleYoutubeConnect} className="bg-amber-600 hover:bg-amber-700 text-white border-0">
            <Youtube className="w-4 h-4 mr-2" />
            Connect YouTube
          </Button>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-6">
            <Scissors className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Paste livestream link</h2>
          <p className="text-neutral-400 text-sm mb-8">We'll find the most engaging moments, crop them perfectly, and generate SEO.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input 
                type="text" 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full h-14 bg-neutral-950 border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <Button 
              size="lg" 
              className="h-14 px-8 gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
              onClick={handleGenerate}
              disabled={!url || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Generate Clips'}
            </Button>
          </div>
          
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col items-center gap-3"
            >
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm font-medium text-indigo-400">{step}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {clips.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Generated Clips
            </h3>
            {videoInfo && (
              <span className="text-sm text-neutral-400">
                From: <span className="text-white font-medium">{videoInfo.title}</span>
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {clips.map((clip, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6"
              >
                {/* Simulated Video Preview */}
                <div className="w-full md:w-64 aspect-[9/16] bg-black rounded-xl border border-white/10 relative overflow-hidden flex-shrink-0 group">
                  {videoInfo?.id ? (
                    <img 
                      src={`https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="w-12 h-12 text-neutral-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white border border-white/20">
                      <Scissors className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono font-medium border border-white/10">
                    {clip.startTime} - {clip.endTime}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">{clip.title}</h4>
                      <p className="text-sm text-neutral-400 leading-relaxed">{clip.description}</p>
                    </div>
                    <div className="flex flex-col items-center bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 min-w-[4rem]">
                      <TrendingUp className="w-4 h-4 text-indigo-400 mb-1" />
                      <span className="text-lg font-bold text-indigo-400">{clip.viralScore}</span>
                    </div>
                  </div>
                  
                  <div className="mb-6 flex flex-wrap gap-2">
                    {clip.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-neutral-300">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                    <Button variant="outline" className="flex-1">Edit Clip</Button>
                    <Button 
                      className={`flex-1 gap-2 ${uploadedClips[idx] ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      onClick={() => handleUploadClip(idx, clip)}
                      disabled={!!uploadingClips[idx] || uploadedClips[idx]}
                    >
                      {uploadingClips[idx] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : uploadedClips[idx] ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploadingClips[idx] ? (typeof uploadingClips[idx] === 'string' ? uploadingClips[idx] : 'Processing...') : uploadedClips[idx] ? 'Published!' : 'Publish to YouTube'}
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
