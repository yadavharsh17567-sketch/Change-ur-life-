import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';

export function Settings() {
  const isMaster = localStorage.getItem('isMaster') === 'true';
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [automationGeminiApiKey, setAutomationGeminiApiKey] = useState('');
  const [ytdlCookies, setYtdlCookies] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [assemblyAiApiKey, setAssemblyAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('groq');
  const [captionStyle, setCaptionStyle] = useState('mrbeast');
  const [emojiEnabled, setEmojiEnabled] = useState(false);
  const [aiSubtitlesEnabled, setAiSubtitlesEnabled] = useState(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState('auto');
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState(false);

  useEffect(() => {
    fetch('/api/settings/global')
      .then(res => res.json())
      .then(data => {
        setGeminiApiKey(data.geminiApiKey || '');
        setAutomationGeminiApiKey(data.automationGeminiApiKey || '');
        setYtdlCookies(data.ytdlCookies || '');
        setGroqApiKey(data.groqApiKey || '');
        setOpenaiApiKey(data.openaiApiKey || '');
        setDeepgramApiKey(data.deepgramApiKey || '');
        setAssemblyAiApiKey(data.assemblyAiApiKey || '');
        setAiProvider(data.aiProvider || 'groq');
        setCaptionStyle(data.captionStyle || 'mrbeast');
        setEmojiEnabled(data.emojiEnabled || false);
        setAiSubtitlesEnabled(data.aiSubtitlesEnabled || false);
        setSubtitleLanguage(data.subtitleLanguage || 'auto');
      })
      .catch(console.error);

    if (isMaster) {
      fetch('/api/settings/oauth')
        .then(res => res.json())
        .then(data => {
          setClientId(data.clientId || '');
          setClientSecret(data.clientSecret || '');
        })
        .catch(console.error);
    }
  }, [isMaster]);

  const handleSaveGlobal = async () => {
    setIsSavingGlobal(true);
    try {
      await fetch('/api/settings/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          geminiApiKey, automationGeminiApiKey, ytdlCookies, groqApiKey, 
          openaiApiKey, deepgramApiKey, assemblyAiApiKey, 
          aiProvider, captionStyle, emojiEnabled, 
          aiSubtitlesEnabled, subtitleLanguage 
        }),
      });
      alert('Global settings saved successfully!');
    } catch (error) {
      alert('Failed to save global settings.');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleTestProvider = async () => {
    let keyToTest = '';
    let testUrl = '';
    let headers: any = {};
    
    if (aiProvider === 'groq') {
      keyToTest = groqApiKey;
      testUrl = 'https://api.groq.com/openai/v1/models';
      headers = { 'Authorization': `Bearer ${keyToTest}` };
    } else if (aiProvider === 'openai') {
      keyToTest = openaiApiKey;
      testUrl = 'https://api.openai.com/v1/models';
      headers = { 'Authorization': `Bearer ${keyToTest}` };
    } else if (aiProvider === 'deepgram') {
      keyToTest = deepgramApiKey;
      testUrl = 'https://api.deepgram.com/v1/projects';
      headers = { 'Authorization': `Token ${keyToTest}` };
    } else if (aiProvider === 'assemblyai') {
      keyToTest = assemblyAiApiKey;
      testUrl = 'https://api.assemblyai.com/v2/transcript';
      headers = { 'Authorization': keyToTest };
    }

    if (!keyToTest) {
      alert(`Please enter a valid API Key for ${aiProvider}.`);
      return;
    }
    setIsTestingProvider(true);
    try {
      const res = await fetch(testUrl, { headers });
      if (res.ok || res.status === 405) { // 405 might happen on AssemblyAI GET instead of POST, but auth succeeded
        alert(`${aiProvider.toUpperCase()} API Key is valid!`);
      } else {
        alert(`Invalid API Key or network error for ${aiProvider}.`);
      }
    } catch (err) {
      alert('Error testing API key.');
    } finally {
      setIsTestingProvider(false);
    }
  };

  const handleSaveOauth = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      alert('OAuth credentials saved successfully!');
    } catch (error) {
      alert('Failed to save OAuth credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter">System Configuration</h1>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
          Global Parameters & Neural Integrations
        </p>
      </div>

      {isMaster && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2.5rem] border border-indigo-500/30 bg-neutral-900/40 backdrop-blur-2xl overflow-hidden relative shadow-2xl"
        >
          <div className="absolute top-0 right-0 px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-[1.5rem]">
            Root Access
          </div>
          <div className="p-10 border-b border-white/5 bg-indigo-500/5">
            <h2 className="text-xl font-black text-white tracking-tight">Matrix Core Settings</h2>
            <p className="text-sm text-neutral-500 font-medium mt-1">Initialize backend neural pathways (Google OAuth).</p>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Google Matrix Client ID</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm shadow-inner"
                  placeholder="Paste Client ID..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Google Matrix Client Secret</label>
                <input 
                  type="password" 
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm shadow-inner"
                  placeholder="Paste Client Secret..."
                />
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveOauth} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-8">
                  {isSaving ? 'Initializing...' : 'Save Core Credentials'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-[2.5rem] border border-white/5 bg-neutral-900/40 backdrop-blur-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-10 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-black text-white tracking-tight">External Neural Nodes</h2>
          <p className="text-sm text-neutral-500 font-medium mt-1">Configure Gemini LLM and high-bandwidth video processors.</p>
        </div>
        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Gemini API Access Token (Global)</label>
              <input 
                type="password" 
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                placeholder="Paste Gemini Token..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Gemini API Access Token (Automation Only)</label>
              <input 
                type="password" 
                value={automationGeminiApiKey}
                onChange={(e) => setAutomationGeminiApiKey(e.target.value)}
                className="w-full h-14 bg-neutral-950/50 border border-indigo-500/10 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                placeholder="Paste separate Gemini Token for CUL..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Authentication Cookies (Netscape)</label>
              <textarea 
                value={ytdlCookies}
                onChange={(e) => setYtdlCookies(e.target.value)}
                className="w-full h-40 bg-neutral-950/50 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm resize-y"
                placeholder="Paste Netscape format cookies..."
              />
            </div>
            <div className="pt-4">
              <Button onClick={handleSaveGlobal} disabled={isSavingGlobal} className="bg-white hover:bg-neutral-200 text-black px-8">
                {isSavingGlobal ? 'Saving...' : 'Sync Integration'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-[2.5rem] border border-white/5 bg-neutral-900/40 backdrop-blur-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-10 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-black text-white tracking-tight">Audio Transcriptions</h2>
          <p className="text-sm text-neutral-500 font-medium mt-1">Configure Whisper-class audio processors and typography.</p>
        </div>
        <div className="p-10 space-y-10">
          <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-indigo-600/5 border border-indigo-500/20">
            <div>
              <p className="font-black text-white tracking-tight uppercase text-xs">Neural Subtitles</p>
              <p className="text-xs text-neutral-500 font-medium mt-1">Generate and render high-impact animated captions.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiSubtitlesEnabled} onChange={(e) => setAiSubtitlesEnabled(e.target.checked)} />
              <div className="w-12 h-7 bg-neutral-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 shadow-lg shadow-indigo-500/20"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Neural Processor</label>
              <select 
                value={aiProvider} 
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-2xl px-6 h-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="groq">Groq Whisper (Fastest)</option>
                <option value="openai">OpenAI Whisper</option>
                <option value="deepgram">Deepgram Nova-2</option>
                <option value="assemblyai">AssemblyAI Universal</option>
              </select>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={aiProvider}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">
                  {aiProvider.toUpperCase()} Matrix Key
                </label>
                <input 
                  type="password" 
                  value={
                    aiProvider === 'groq' ? groqApiKey : 
                    aiProvider === 'openai' ? openaiApiKey : 
                    aiProvider === 'deepgram' ? deepgramApiKey : 
                    assemblyAiApiKey
                  }
                  onChange={(e) => {
                    if (aiProvider === 'groq') setGroqApiKey(e.target.value);
                    else if (aiProvider === 'openai') setOpenaiApiKey(e.target.value);
                    else if (aiProvider === 'deepgram') setDeepgramApiKey(e.target.value);
                    else setAssemblyAiApiKey(e.target.value);
                  }}
                  className="w-full h-14 bg-neutral-950 border border-white/5 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                  placeholder={`Paste ${aiProvider} API Key...`}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleTestProvider} disabled={isTestingProvider} variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              {isTestingProvider ? 'Ping...' : 'Test Connection'}
            </Button>
          </div>

          <div className="space-y-8 pt-10 border-t border-white/5">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Visual Matrix Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Sub-Language</label>
                <select 
                  value={subtitleLanguage} 
                  onChange={(e) => setSubtitleLanguage(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-2xl px-6 h-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="auto">Auto-Detect Neural</option>
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Typography Preset</label>
                <select 
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-2xl px-6 h-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="mrbeast">High Impact (MrBeast)</option>
                  <option value="hormozi">Alex Hormozi V3</option>
                  <option value="gaming">Twitch Gaming</option>
                  <option value="podcast">Clean Editorial</option>
                  <option value="minimal">Minimal HUD</option>
                  <option value="custom">Manual Matrix</option>
                </select>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="relative p-10 rounded-[2.5rem] bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden aspect-video shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center pointer-events-none grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                
                <motion.div 
                  key={captionStyle + emojiEnabled}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center w-full z-10 px-8"
                >
                  <span className={`text-3xl font-black tracking-tighter text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] ${
                    captionStyle === 'mrbeast' ? 'font-sans uppercase [text-shadow:_-3px_-3px_0_#000,_3px_-3px_0_#000,_-3px_3px_0_#000,_3px_3px_0_#000]' : 
                    captionStyle === 'hormozi' ? 'font-sans italic' : 
                    captionStyle === 'gaming' ? 'font-mono text-emerald-400' :
                    captionStyle === 'podcast' ? 'font-serif text-neutral-200' :
                    'font-sans'
                  }`}>
                    Neural Matrix {emojiEnabled ? '⚡' : ''} <span className={
                      captionStyle === 'gaming' ? 'text-white' : 
                      captionStyle === 'podcast' ? 'text-indigo-400' : 
                      'text-yellow-400'
                    }>Initialized</span> successfully!
                  </span>
                </motion.div>
            </div>
            
            <div className="pt-6">
              <Button onClick={handleSaveGlobal} disabled={isSavingGlobal} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 px-10 h-14">
                {isSavingGlobal ? 'Processing...' : 'Deploy Global Config'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-[2.5rem] border border-rose-900/20 bg-rose-500/5 backdrop-blur-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-10 border-b border-rose-900/20 bg-rose-500/5">
          <h2 className="text-xl font-black text-rose-400 tracking-tight">Danger Zone</h2>
          <p className="text-sm text-neutral-500 font-medium mt-1">Irreversible destructive operations.</p>
        </div>
        <div className="p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="font-black text-rose-400 uppercase text-xs">Terminate Account</p>
              <p className="text-xs text-neutral-500 font-medium mt-1">Permanently purge your profile and all processed data streams.</p>
            </div>
            <Button variant="outline" className="border-rose-900/50 text-rose-400 hover:bg-rose-950/50 h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              Delete Profile
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
