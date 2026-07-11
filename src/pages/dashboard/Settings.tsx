import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/Button';

export function Settings() {
  const isMaster = localStorage.getItem('isMaster') === 'true';
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [ytdlCookies, setYtdlCookies] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [aiSubtitlesEnabled, setAiSubtitlesEnabled] = useState(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState('auto');
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);

  useEffect(() => {
    fetch('/api/settings/global')
      .then(res => res.json())
      .then(data => {
        setGeminiApiKey(data.geminiApiKey || '');
        setYtdlCookies(data.ytdlCookies || '');
        setGroqApiKey(data.groqApiKey || '');
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
        body: JSON.stringify({ geminiApiKey, ytdlCookies, groqApiKey, aiSubtitlesEnabled, subtitleLanguage }),
      });
      alert('Global settings saved successfully!');
    } catch (error) {
      alert('Failed to save global settings.');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleTestGroq = async () => {
    if (!groqApiKey) {
      alert('Please enter a Groq API Key first.');
      return;
    }
    setIsTestingGroq(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        }
      });
      if (res.ok) {
        alert('Groq API Key is valid!');
      } else {
        alert('Invalid Groq API Key or network error.');
      }
    } catch (err) {
      alert('Error testing API key.');
    } finally {
      setIsTestingGroq(false);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">Manage your account preferences.</p>
      </div>

      {isMaster && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-indigo-500/30 bg-neutral-900/50 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-white text-xs font-bold rounded-bl-lg">MASTER</div>
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold text-indigo-400">Developer Settings</h2>
            <p className="text-sm text-neutral-400 mt-1">Configure backend API credentials (Google OAuth).</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Google OAuth Client ID</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-12 bg-neutral-950/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                  placeholder="Paste Client ID here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Google OAuth Client Secret</label>
                <input 
                  type="password" 
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full h-12 bg-neutral-950/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                  placeholder="Paste Client Secret here..."
                />
              </div>
              <div className="pt-2">
                <Button onClick={handleSaveOauth} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/5 bg-neutral-900/50 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold">API Integrations</h2>
          <p className="text-sm text-neutral-400 mt-1">Configure external services like Gemini and YouTube downloader.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Gemini API Key</label>
              <input 
                type="password" 
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full h-12 bg-neutral-950/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                placeholder="Paste Gemini API Key here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Netscape HTTP Cookies (For ytdl-core)</label>
              <textarea 
                value={ytdlCookies}
                onChange={(e) => setYtdlCookies(e.target.value)}
                className="w-full h-32 bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm resize-y"
                placeholder="Paste Netscape format cookies here..."
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleSaveGlobal} disabled={isSavingGlobal} className="bg-white hover:bg-neutral-200 text-black">
                {isSavingGlobal ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/5 bg-neutral-900/50 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold">AI Subtitles</h2>
          <p className="text-sm text-neutral-400 mt-1">Configure Groq API and subtitle generation settings.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Enable AI Subtitles</p>
              <p className="text-sm text-neutral-400">Automatically generate and burn animated subtitles after editing.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiSubtitlesEnabled} onChange={(e) => setAiSubtitlesEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Groq API Key (Required for AI Subtitles)</label>
              <input 
                type="password" 
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                className="w-full h-12 bg-neutral-950/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                placeholder="Paste Groq API Key here..."
              />
              {!groqApiKey && (
                <p className="text-xs text-orange-400 mt-2">Subtitle generation requires a valid Groq API key.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestGroq} disabled={isTestingGroq} variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                {isTestingGroq ? 'Testing...' : 'Test API Key'}
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-medium text-white">Subtitle Style & Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Subtitle Language</label>
                <select 
                  value={subtitleLanguage} 
                  onChange={(e) => setSubtitleLanguage(e.target.value)}
                  className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="auto">Auto Detect</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Subtitle Position</label>
                <select className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option>Center Bottom (Shorts Safe)</option>
                  <option>Center Middle</option>
                  <option>Center Top</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Font Size</label>
                <select className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option>Large (Recommended)</option>
                  <option>Medium</option>
                  <option>Small</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Color Theme</label>
                <select className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option>White & Yellow (Classic)</option>
                  <option>White & Green</option>
                  <option>White & Cyan</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">Word Highlighting & Animation</p>
                  <p className="text-xs text-neutral-400">Pop and color words as they are spoken.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-white/5 bg-black flex items-center justify-center relative overflow-hidden h-32 aspect-video mx-auto">
                <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-indigo-900/50 to-transparent pointer-events-none"></div>
                <div className="text-center w-full z-10 px-4">
                  <span className="text-2xl font-bold font-sans tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000]">
                    This is how <span className="text-yellow-400">subtitles</span> will look!
                  </span>
                </div>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSaveGlobal} disabled={isSavingGlobal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSavingGlobal ? 'Saving...' : 'Save AI Settings'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/5 bg-neutral-900/50 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-neutral-400 mt-1">Customize how the application looks on your device.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-neutral-400">Select your preferred color theme.</p>
            </div>
            <select className="bg-neutral-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>Dark Mode</option>
              <option>System</option>
              <option>Light Mode</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-white/5 bg-neutral-900/50 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold">Danger Zone</h2>
          <p className="text-sm text-neutral-400 mt-1">Irreversible actions for your account.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-400">Delete Account</p>
              <p className="text-sm text-neutral-400">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="outline" className="border-red-900/50 text-red-400 hover:bg-red-950/50">
              Delete Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
