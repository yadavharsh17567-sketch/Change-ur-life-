import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import multer from 'multer';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import axios from 'axios';
import FormData from 'form-data';
import { generateASSSubtitles } from './subtitleUtils';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: 'gen-lang-client-0565912654'
  });
}
const db = getFirestore();

let customConfig: Record<string, string> = {};
try {
  customConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (e) {
  // Ignore
}

const getAiClient = async () => {
  const settings = (await db.collection('settings').doc('global').get()).data() || {};
  const key = settings.geminiApiKey || customConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set in settings or environment.');
  return new GoogleGenAI(key);
};

const upload = multer({ dest: 'uploads/' });

// Pipeline State Manager
const pipelineTasks: any[] = [];
const pipelineStats = {
  processedToday: 0,
  currentlyProcessing: 0,
  successRate: 100,
  totalRenderingTime: '0h 0m'
};

// YouTube Account Manager
let ytAccountState: { accounts: any[], activeAccountId: string | null } = {
  accounts: [],
  activeAccountId: null
};

const YT_ACCOUNTS_FILE = 'youtube_accounts.json';

const loadYtAccounts = () => {
  try {
    if (fs.existsSync(YT_ACCOUNTS_FILE)) {
      ytAccountState = JSON.parse(fs.readFileSync(YT_ACCOUNTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load YouTube accounts:', e);
  }
};

const saveYtAccounts = () => {
  try {
    fs.writeFileSync(YT_ACCOUNTS_FILE, JSON.stringify(ytAccountState, null, 2));
  } catch (e) {
    console.error('Failed to save YouTube accounts:', e);
  }
};

loadYtAccounts();

const getTokensForAccount = (accountId: string) => {
  const account = ytAccountState.accounts.find(a => a.id === accountId);
  return account ? account.tokens : null;
};

const getActiveTokens = () => {
  return getTokensForAccount(ytAccountState.activeAccountId || '');
};

const updateTaskStep = (taskId: string, stepId: string, status: string, progress: number, log?: string) => {
  const task = pipelineTasks.find(t => t.id === taskId);
  if (!task) return;

  const step = task.steps.find((s: any) => s.id === stepId);
  if (step) {
    step.status = status;
    step.progress = progress;
  }

  if (log) {
    task.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      message: log,
      type: status === 'failed' ? 'error' : (status === 'completed' ? 'success' : 'info')
    });
  }

  // Update overall progress
  const completedSteps = task.steps.filter((s: any) => s.status === 'completed').length;
  task.overallProgress = Math.round((completedSteps / task.steps.length) * 100);
  
  if (status === 'processing') {
    task.currentStepId = stepId;
  }

  if (task.overallProgress === 100) {
    task.status = 'completed';
    pipelineStats.processedToday++;
    pipelineStats.currentlyProcessing = Math.max(0, pipelineStats.currentlyProcessing - 1);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(express.json());
  app.use(cookieParser());

  // Pipeline API Endpoints
  app.get('/api/pipeline/tasks', (req, res) => {
    res.json(pipelineTasks);
  });

  // Automation / Scheduler Endpoints
  app.get('/api/automation/tasks', async (req, res) => {
    try {
      const snapshot = await db.collection('scheduled_tasks').orderBy('scheduledTime', 'asc').get();
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/automation/schedule', async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: 'master-user' // Default for now
      };
      const docRef = await db.collection('scheduled_tasks').add(taskData);
      res.json({ id: docRef.id, ...taskData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to schedule task' });
    }
  });

  app.post('/api/automation/task/:id/reschedule', async (req, res) => {
    try {
      const { scheduledTime } = req.body;
      await db.collection('scheduled_tasks').doc(req.params.id).update({
        scheduledTime,
        status: 'pending',
        error: FieldValue.delete()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reschedule task' });
    }
  });

  app.delete('/api/automation/task/:id', async (req, res) => {
    try {
      await db.collection('scheduled_tasks').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Automation Rules Endpoints
  app.get('/api/automation/rules', async (req, res) => {
    try {
      const snapshot = await db.collection('automation_rules').get();
      const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rules' });
    }
  });

  app.post('/api/automation/rules', async (req, res) => {
    try {
      const ruleData = {
        ...req.body,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastRunAt: null,
        lastFetchedVideoId: null
      };
      const docRef = await db.collection('automation_rules').add(ruleData);
      res.json({ id: docRef.id, ...ruleData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create rule' });
    }
  });

  app.delete('/api/automation/rules/:id', async (req, res) => {
    try {
      await db.collection('automation_rules').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete rule' });
    }
  });

  app.get('/api/pipeline/stats', (req, res) => {
    res.json(pipelineStats);
  });

  app.post('/api/pipeline/task/:id/cancel', (req, res) => {
    const task = pipelineTasks.find(t => t.id === req.params.id);
    if (task) {
      task.status = 'cancelled';
      pipelineStats.currentlyProcessing = Math.max(0, pipelineStats.currentlyProcessing - 1);
    }
    res.json({ success: true });
  });

  const getOauth2Client = () => {
    return new google.auth.OAuth2(
      customConfig.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID,
      customConfig.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      `${process.env.APP_URL}/api/auth/youtube/callback`
    );
  };

  app.get('/api/settings/oauth', (req, res) => {
    res.json({
      clientId: customConfig.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: customConfig.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    });
  });

  app.post('/api/settings/oauth', (req, res) => {
    const { clientId, clientSecret } = req.body;
    customConfig.GOOGLE_OAUTH_CLIENT_ID = clientId;
    customConfig.GOOGLE_OAUTH_CLIENT_SECRET = clientSecret;
    try {
      fs.writeFileSync('config.json', JSON.stringify(customConfig));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save config' });
    }
  });

  app.get('/api/settings/global', (req, res) => {
    res.json({
      geminiApiKey: customConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      automationGeminiApiKey: customConfig.AUTOMATION_GEMINI_API_KEY || '',
      ytdlCookies: customConfig.YTDL_COOKIES || '',
      groqApiKey: customConfig.GROQ_API_KEY || '',
      openaiApiKey: customConfig.OPENAI_API_KEY || '',
      deepgramApiKey: customConfig.DEEPGRAM_API_KEY || '',
      assemblyAiApiKey: customConfig.ASSEMBLY_AI_API_KEY || '',
      aiProvider: customConfig.AI_PROVIDER || 'groq',
      captionStyle: customConfig.CAPTION_STYLE || 'mrbeast',
      emojiEnabled: customConfig.EMOJI_ENABLED === 'true' || false,
      aiSubtitlesEnabled: customConfig.AI_SUBTITLES_ENABLED === 'true' || false,
      subtitleLanguage: customConfig.SUBTITLE_LANGUAGE || 'auto'
    });
  });

  app.post('/api/settings/global', (req, res) => {
    const { 
      geminiApiKey, automationGeminiApiKey, ytdlCookies, groqApiKey, openaiApiKey, 
      deepgramApiKey, assemblyAiApiKey, aiProvider, 
      captionStyle, emojiEnabled, aiSubtitlesEnabled, subtitleLanguage 
    } = req.body;
    
    customConfig.GEMINI_API_KEY = geminiApiKey;
    customConfig.AUTOMATION_GEMINI_API_KEY = automationGeminiApiKey;
    customConfig.YTDL_COOKIES = ytdlCookies;
    customConfig.GROQ_API_KEY = groqApiKey;
    customConfig.OPENAI_API_KEY = openaiApiKey;
    customConfig.DEEPGRAM_API_KEY = deepgramApiKey;
    customConfig.ASSEMBLY_AI_API_KEY = assemblyAiApiKey;
    customConfig.AI_PROVIDER = aiProvider;
    customConfig.CAPTION_STYLE = captionStyle;
    customConfig.EMOJI_ENABLED = String(emojiEnabled);
    customConfig.AI_SUBTITLES_ENABLED = String(aiSubtitlesEnabled);
    customConfig.SUBTITLE_LANGUAGE = subtitleLanguage;
    try {
      fs.writeFileSync('config.json', JSON.stringify(customConfig));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save config' });
    }
  });

  // API Routes
  app.get('/api/auth/youtube', (req, res) => {
    const oauth2Client = getOauth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ],
      prompt: 'consent'
    });
    res.redirect(url);
  });

  // YouTube Account API Endpoints
  app.get('/api/youtube/accounts', async (req, res) => {
    // Refresh basic info for all accounts
    const accounts = await Promise.all(ytAccountState.accounts.map(async (acc) => {
      try {
        const oauth2Client = getOauth2Client();
        oauth2Client.setCredentials(acc.tokens);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelRes = await youtube.channels.list({ part: ['snippet', 'statistics'], mine: true });
        const channel = channelRes.data.items?.[0];
        
        if (channel) {
          acc.name = channel.snippet?.title || acc.name;
          acc.handle = channel.snippet?.customUrl || acc.handle;
          acc.thumbnail = channel.snippet?.thumbnails?.default?.url || acc.thumbnail;
          acc.subscriberCount = channel.statistics?.subscriberCount;
          acc.status = 'connected';
        }
      } catch (err) {
        acc.status = 'disconnected';
      }
      const { tokens, ...rest } = acc;
      return rest;
    }));
    
    res.json({
      accounts,
      activeAccountId: ytAccountState.activeAccountId
    });
  });

  app.post('/api/youtube/accounts/switch', (req, res) => {
    const { id } = req.body;
    if (ytAccountState.accounts.find(a => a.id === id)) {
      ytAccountState.activeAccountId = id;
      saveYtAccounts();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  });

  app.delete('/api/youtube/accounts/:id', (req, res) => {
    ytAccountState.accounts = ytAccountState.accounts.filter(a => a.id !== req.params.id);
    if (ytAccountState.activeAccountId === req.params.id) {
      ytAccountState.activeAccountId = ytAccountState.accounts[0]?.id || null;
    }
    saveYtAccounts();
    res.json({ success: true });
  });

  app.post('/api/youtube/accounts/rename', (req, res) => {
    const { id, nickname } = req.body;
    const account = ytAccountState.accounts.find(a => a.id === id);
    if (account) {
      account.nickname = nickname;
      saveYtAccounts();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  });

  app.get('/api/auth/youtube/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const oauth2Client = getOauth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      
      oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const channelRes = await youtube.channels.list({ part: ['snippet'], mine: true });
      const channel = channelRes.data.items?.[0];
      
      if (!channel) {
        return res.redirect('/app/youtube-accounts?error=no_channel');
      }

      const accountId = channel.id!;
      const existingIndex = ytAccountState.accounts.findIndex(a => a.id === accountId);
      
      const accountData = {
        id: accountId,
        name: channel.snippet?.title,
        handle: channel.snippet?.customUrl,
        thumbnail: channel.snippet?.thumbnails?.default?.url,
        tokens,
        connectedAt: new Date().toISOString(),
        status: 'connected'
      };

      if (existingIndex > -1) {
        ytAccountState.accounts[existingIndex] = accountData;
      } else {
        ytAccountState.accounts.push(accountData);
      }

      if (!ytAccountState.activeAccountId) {
        ytAccountState.activeAccountId = accountId;
      }

      saveYtAccounts();
      res.redirect('/app/youtube-accounts');
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect('/app/youtube-accounts?error=oauth_failed');
    }
  });

  app.get('/api/youtube/status', async (req, res) => {
    const activeAccount = ytAccountState.accounts.find(a => a.id === ytAccountState.activeAccountId);
    
    const accounts = ytAccountState.accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      handle: acc.handle,
      thumbnail: acc.thumbnail,
      nickname: acc.nickname,
      status: acc.status
    }));

    if (!activeAccount) {
      return res.json({ connected: false, accountCount: accounts.length, accounts });
    }
    
    try {
      res.json({ 
        connected: true, 
        channel: {
          id: activeAccount.id,
          title: activeAccount.name,
          handle: activeAccount.handle,
          thumbnail: activeAccount.thumbnail,
          nickname: activeAccount.nickname
        },
        accountCount: ytAccountState.accounts.length,
        accounts
      });
    } catch (error) {
      res.json({ connected: false, accountCount: accounts.length, accounts });
    }
  });

  app.post('/api/youtube/upload', upload.single('video'), async (req, res) => {
    const tokens = getActiveTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated with YouTube' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    try {
      const oauth2Client = getOauth2Client();
      oauth2Client.setCredentials(tokens);
      
      // Update tokens if they get refreshed
      oauth2Client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
          tokens.refresh_token = newTokens.refresh_token;
        }
        tokens.access_token = newTokens.access_token;
        tokens.expiry_date = newTokens.expiry_date;
        saveYtAccounts();
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const { title, description, tags, privacyStatus = 'private' } = req.body;

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags: tags ? JSON.parse(tags) : [],
          },
          status: {
            privacyStatus,
          },
        },
        media: {
          body: fs.createReadStream(req.file.path),
        },
      });

      // Clean up file
      fs.unlinkSync(req.file.path);

      res.json({ success: true, videoId: response.data.id });
    } catch (error) {
      console.error('YouTube upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload video' });
    }
  });

  app.post('/api/seo', async (req, res) => {
    try {
      const { description, keywords } = req.body;
      const genAI = await getAiClient();
      const prompt = `Generate SEO metadata (title, tags, description) for a video with description: "${description}" and keywords: "${keywords}". Return JSON format: { "title": "...", "description": "...", "tags": ["..."] }`;
      
      const result = await genAI.models.generateContent({
        model: 'omni-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      
      res.json(JSON.parse(result.response.text() || '{}'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate SEO' });
    }
  });

  app.post('/api/generate-clips', async (req, res) => {
    try {
      const { videoUrl } = req.body;
      
      const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      let videoTitle = "Unknown Video";
      let videoDescription = "";

      const tokens = getActiveTokens();
      if (tokens) {
        const oauth2Client = getOauth2Client();
        oauth2Client.setCredentials(tokens);
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        try {
          const ytRes = await youtube.videos.list({
            part: ['snippet'],
            id: [videoId]
          });
          if (ytRes.data.items && ytRes.data.items.length > 0) {
            videoTitle = ytRes.data.items[0].snippet?.title || videoTitle;
            videoDescription = ytRes.data.items[0].snippet?.description || videoDescription;
          }
        } catch (e) {
          console.error("Error fetching video details", e);
        }
      }

      const prompt = `You are an expert viral video editor and SEO specialist. 
      I have a YouTube livestream/video titled: "${videoTitle}". 
      Description: "${videoDescription.substring(0, 500)}...".
      
      Analyze this context and generate 3 highly viral short video clip ideas (YouTube Shorts/TikTok style) that could be extracted from this stream.
      For each clip, provide:
      1. A catchy SEO-optimized title
      2. A brief, engaging description
      3. A list of 5-8 relevant SEO tags
      4. A simulated start and end time (e.g. 15:20 - 16:05)
      5. A viral score out of 100
      
      Return ONLY a JSON array of objects with the following format:
      [
        {
          "title": "...",
          "description": "...",
          "tags": ["...", "..."],
          "startTime": "...",
          "endTime": "...",
          "viralScore": 95
        }
      ]`;

      const genAI = await getAiClient();
      const result = await genAI.models.generateContent({
        model: 'omni-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const clips = JSON.parse(result.response.text() || '[]');
      res.json({ clips, originalVideo: { title: videoTitle, id: videoId } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate clips' });
    }
  });

  app.post('/api/youtube/upload-clip', async (req, res) => {
    const { clip, videoUrl } = req.body;
    const tokens = getActiveTokens();
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated with YouTube' });
    }

    if (!clip || !videoUrl) {
      return res.status(400).json({ error: 'Missing clip data or video URL' });
    }

    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      return 0;
    };

    const startSec = parseTime(clip.startTime);
    const endSec = parseTime(clip.endTime);
    const duration = endSec - startSec > 0 ? endSec - startSec : 15; // default to 15s if invalid

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const tempPath = path.join(uploadDir, `clip-${Date.now()}.mp4`);
    
    const taskId = `task-${Date.now()}`;
    const newTask = {
      id: taskId,
      videoTitle: clip.title,
      overallProgress: 0,
      status: 'processing',
      startTime: new Date().toLocaleTimeString(),
      steps: [
        { id: 'download', label: 'Downloading Video', status: 'waiting', progress: 0 },
        { id: 'extract-audio', label: 'Extracting Audio', status: 'waiting', progress: 0 },
        { id: 'transcribe', label: 'AI Transcription', status: 'waiting', progress: 0 },
        { id: 'subtitles', label: 'Generating Subtitles', status: 'waiting', progress: 0 },
        { id: 'render', label: 'Rendering Clip', status: 'waiting', progress: 0 },
        { id: 'upload', label: 'YouTube Upload', status: 'waiting', progress: 0 },
      ],
      logs: []
    };
    pipelineTasks.unshift(newTask);
    pipelineStats.currentlyProcessing++;

    try {
      updateTaskStep(taskId, 'download', 'processing', 10, 'Starting video download from YouTube...');
      // Parse Netscape cookies if provided
      let agent;
      if (customConfig.YTDL_COOKIES) {
        try {
          const cookies = [];
          const lines = customConfig.YTDL_COOKIES.split('\n');
          for (const line of lines) {
            if (line.trim() === '' || line.startsWith('#')) continue;
            const parts = line.split('\t');
            if (parts.length >= 7) {
              cookies.push({
                domain: parts[0],
                expirationDate: parseInt(parts[4], 10),
                hostOnly: parts[1] === 'FALSE',
                httpOnly: parts[1] === 'TRUE',
                name: parts[5],
                path: parts[2],
                secure: parts[3] === 'TRUE',
                value: parts[6].replace(/\r$/, '')
              });
            }
          }
          agent = ytdl.createAgent(cookies);
        } catch (err) {
          console.error("Failed to parse YTDL cookies", err);
        }
      }

      // 2. Fetch channel name for watermark
      const oauth2Client = getOauth2Client();
      oauth2Client.setCredentials(tokens);
      
      // Update tokens if they get refreshed
      oauth2Client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
          tokens.refresh_token = newTokens.refresh_token;
        }
        tokens.access_token = newTokens.access_token;
        tokens.expiry_date = newTokens.expiry_date;
        saveYtAccounts();
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      let channelName = 'ChangeUrLife';
      try {
        const channelRes = await youtube.channels.list({ part: ['snippet'], mine: true });
        if (channelRes.data.items && channelRes.data.items.length > 0) {
          channelName = channelRes.data.items[0].snippet?.title || channelName;
        }
      } catch (err) {
        console.error("Failed to fetch channel name:", err);
      }
      
      const safeChannelName = channelName.replace(/'/g, "\u2019").replace(/:/g, "\\:");
      const safeSubtitle = clip.title.replace(/'/g, "\u2019").replace(/:/g, "\\:");

      // 3. Download and trim using ffmpeg and ytdl
      const ytdlOptions: any = { filter: 'audioandvideo', quality: 'highest' };
      if (agent) {
        ytdlOptions.agent = agent;
      }
      const stream = ytdl(videoUrl, ytdlOptions);
      
      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .setStartTime(startSec)
          .duration(duration)
          .videoFilters([
            {
              filter: 'crop',
              options: 'ih*(9/16):ih'
            },
            {
              filter: 'scale',
              options: '1080:1920'
            },
            {
              filter: 'drawtext',
              options: `text='${safeChannelName}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=48:fontcolor=white@0.3`
            },
            {
              filter: 'drawtext',
              options: `text='${safeSubtitle}':x=(w-text_w)/2:y=h-(h/4):fontsize=64:fontcolor=yellow:borderw=4:bordercolor=black`
            }
          ])
          .output(tempPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      let uploadVideoPath = tempPath;

      // 4. Generate AI Subtitles if enabled
      if (customConfig.AI_SUBTITLES_ENABLED === 'true') {
        const audioPath = path.join(uploadDir, `audio-${Date.now()}.mp3`);
        const subsPath = path.join(uploadDir, `subs-${Date.now()}.ass`);
        const videoWithSubsPath = path.join(uploadDir, `final-${Date.now()}.mp4`);

        try {
          // Extract Audio
          await new Promise((resolve, reject) => {
            ffmpeg(tempPath)
              .noVideo()
              .audioCodec('libmp3lame')
              .output(audioPath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          let words = null;
          let lang = customConfig.SUBTITLE_LANGUAGE || 'auto';
          const provider = customConfig.AI_PROVIDER || 'groq';

          if (provider === 'groq' && customConfig.GROQ_API_KEY) {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(audioPath));
            formData.append('model', 'whisper-large-v3');
            formData.append('response_format', 'verbose_json');
            if (lang !== 'auto') formData.append('language', lang);

            const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
              headers: {
                'Authorization': `Bearer ${customConfig.GROQ_API_KEY}`,
                ...formData.getHeaders(),
              }
            });
            words = res.data?.words;
          } else if (provider === 'openai' && customConfig.OPENAI_API_KEY) {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(audioPath));
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities[]', 'word');
            if (lang !== 'auto') formData.append('language', lang);

            const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
              headers: {
                'Authorization': `Bearer ${customConfig.OPENAI_API_KEY}`,
                ...formData.getHeaders(),
              }
            });
            words = res.data?.words;
          } else if (provider === 'deepgram' && customConfig.DEEPGRAM_API_KEY) {
            let url = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
            if (lang !== 'auto') url += `&language=${lang}`;
            
            const fileBuffer = fs.readFileSync(audioPath);
            const res = await axios.post(url, fileBuffer, {
              headers: {
                'Authorization': `Token ${customConfig.DEEPGRAM_API_KEY}`,
                'Content-Type': 'audio/mp3',
              }
            });
            
            const dgWords = res.data?.results?.channels?.[0]?.alternatives?.[0]?.words || [];
            words = dgWords.map((w: any) => ({
              start: w.start,
              end: w.end,
              word: w.punctuated_word || w.word
            }));
          } else if (provider === 'assemblyai' && customConfig.ASSEMBLY_AI_API_KEY) {
            // 1. Upload audio
            const fileBuffer = fs.readFileSync(audioPath);
            const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', fileBuffer, {
              headers: {
                'Authorization': customConfig.ASSEMBLY_AI_API_KEY,
                'Content-Type': 'application/octet-stream',
              }
            });
            const audioUrl = uploadRes.data.upload_url;
            
            // 2. Transcript request
            const transcriptBody: any = { audio_url: audioUrl };
            if (lang !== 'auto') transcriptBody.language_code = lang;
            
            const transcriptRes = await axios.post('https://api.assemblyai.com/v2/transcript', transcriptBody, {
              headers: {
                'Authorization': customConfig.ASSEMBLY_AI_API_KEY,
                'Content-Type': 'application/json'
              }
            });
            const transcriptId = transcriptRes.data.id;
            
            // 3. Poll
            let completed = false;
            let finalWords = null;
            while (!completed) {
              await new Promise(r => setTimeout(r, 3000));
              const pollRes = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { 'Authorization': customConfig.ASSEMBLY_AI_API_KEY }
              });
              if (pollRes.data.status === 'completed') {
                completed = true;
                finalWords = pollRes.data.words;
              } else if (pollRes.data.status === 'error') {
                completed = true;
                console.error("AssemblyAI Error:", pollRes.data.error);
              }
            }
            if (finalWords) {
              words = finalWords.map((w: any) => ({
                start: w.start / 1000,
                end: w.end / 1000,
                word: w.text
              }));
            }
          }

          if (words) {
            updateTaskStep(taskId, 'transcribe', 'completed', 100, 'Speech transcribed.');
            updateTaskStep(taskId, 'subtitles', 'processing', 20, 'Applying dynamic caption styles...');

            // Generate ASS file with styles and emoji toggle
            const style = customConfig.CAPTION_STYLE || 'mrbeast';
            const useEmoji = customConfig.EMOJI_ENABLED === 'true';
            
            generateASSSubtitles(words, subsPath, style, useEmoji);

            // Burn subtitles into video
            await new Promise((resolve, reject) => {
              ffmpeg(tempPath)
                .videoFilters(`ass='${subsPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`)
                .outputOptions(['-c:a copy']) // copy audio without re-encoding
                .output(videoWithSubsPath)
                .on('progress', (p) => {
                   updateTaskStep(taskId, 'subtitles', 'processing', Math.round(20 + (p.percent || 0) * 0.8));
                })
                .on('end', () => {
                   updateTaskStep(taskId, 'subtitles', 'completed', 100, 'Captions rendered into video.');
                   resolve(null);
                })
                .on('error', reject)
                .run();
            });

            uploadVideoPath = videoWithSubsPath;
          }
        } catch (subErr: any) {
          console.error("AI Subtitles Error:", subErr);
          updateTaskStep(taskId, 'subtitles', 'failed', 0, `Subtitle error: ${subErr.message}`);
        }
      }

      // 5. Upload the cropped clip to YouTube
      updateTaskStep(taskId, 'upload', 'processing', 10, 'Initializing YouTube upload...');
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: clip.title,
            description: clip.description,
            tags: clip.tags,
          },
          status: {
            privacyStatus: 'private', // Upload as private initially
          },
        },
        media: {
          body: fs.createReadStream(uploadVideoPath),
        },
      });

      // Clean up local files
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (uploadVideoPath !== tempPath && fs.existsSync(uploadVideoPath)) fs.unlinkSync(uploadVideoPath);

      updateTaskStep(taskId, 'upload', 'completed', 100, `Video published to YouTube (ID: ${response.data.id}).`);
      
      res.json({ success: true, videoId: response.data.id });
    } catch (error: any) {
      console.error('Clip processing error:', error);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      updateTaskStep(taskId, 'upload', 'failed', 0, `Process failed: ${error.message}`);
      pipelineStats.currentlyProcessing = Math.max(0, pipelineStats.currentlyProcessing - 1);
      res.status(500).json({ error: 'Failed to process and upload clip' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background Worker for Scheduled Tasks
  setInterval(async () => {
    const now = new Date().toISOString();
    try {
      const snapshot = await db.collection('scheduled_tasks')
        .where('status', '==', 'pending')
        .where('scheduledTime', '<=', now)
        .limit(5) // Process a few at a time
        .get();

      if (snapshot.empty) return;

      for (const doc of snapshot.docs) {
        const taskId = doc.id;
        const task = doc.data();

        // Mark as processing
        await db.collection('scheduled_tasks').doc(taskId).update({ status: 'processing' });

        processTask(taskId, task);
      }
    } catch (err) {
      console.error('Worker error:', err);
    }
  }, 30000); // Run every 30 seconds

  // Rule Processing Worker
  setInterval(async () => {
    try {
      const snapshot = await db.collection('automation_rules').where('status', '==', 'active').get();
      for (const doc of snapshot.docs) {
        const ruleId = doc.id;
        const rule = doc.data();
        
        const now = new Date();
        const lastRun = rule.lastRunAt ? new Date(rule.lastRunAt) : new Date(0);
        const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);
        
        if (diffMinutes >= (rule.intervalMinutes || 120)) {
          console.log(`Running automation rule: ${rule.title}`);
          await processRule(ruleId, rule);
        }
      }
    } catch (err) {
      console.error('Rule worker error:', err);
    }
  }, 300000); // Check every 5 minutes

  async function processRule(ruleId: string, rule: any) {
    try {
      const tokens = getTokensForAccount(rule.youtubeAccountId);
      if (!tokens) return;

      const oauth2Client = getOauth2Client();
      oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // 1. Resolve Channel ID from URL
      let channelId = '';
      if (rule.channelUrl.includes('/channel/')) {
        channelId = rule.channelUrl.split('/channel/')[1].split('/')[0].split('?')[0];
      } else if (rule.channelUrl.includes('/@')) {
        const handle = rule.channelUrl.split('/@')[1].split('/')[0].split('?')[0];
        const searchRes = await youtube.search.list({
          part: ['snippet'],
          q: handle,
          type: ['channel'],
          maxResults: 1
        });
        channelId = searchRes.data.items?.[0]?.id?.channelId || '';
      }

      if (!channelId) {
        console.warn(`Could not resolve channel ID for ${rule.channelUrl}`);
        return;
      }

      // 2. Fetch latest videos (up to maxVideos)
      const maxToFetch = rule.maxVideos || 1;
      const videoRes = await youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        order: 'date',
        maxResults: maxToFetch,
        type: ['video']
      });

      const videos = videoRes.data.items || [];
      if (videos.length === 0) {
        await db.collection('automation_rules').doc(ruleId).update({ lastRunAt: new Date().toISOString() });
        return;
      }

      // Find videos newer than lastFetchedVideoId
      const lastFetchedId = rule.lastFetchedVideoId;
      let newVideos = [];
      if (!lastFetchedId) {
        newVideos = [videos[0]]; // Just the very latest if first run
      } else {
        for (const v of videos) {
          if (v.id?.videoId === lastFetchedId) break;
          newVideos.push(v);
        }
      }

      if (newVideos.length === 0) {
        await db.collection('automation_rules').doc(ruleId).update({ lastRunAt: new Date().toISOString() });
        return;
      }

      // 3. Process each new video
      for (const latestVideo of newVideos.reverse()) { // Process oldest new video first
        const originalTitle = latestVideo.snippet?.title || '';
        const originalDesc = latestVideo.snippet?.description || '';
        
        let finalTitle = originalTitle;
        let finalDesc = originalDesc;
        let finalTags = rule.tags || [];

        // Apply AI SEO if separate API key is available
        const aiKey = customConfig.AUTOMATION_GEMINI_API_KEY || customConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

        if (aiKey) {
          try {
            const genAI = new GoogleGenAI(aiKey);
            const prompt = `You are an expert YouTube SEO optimizer. I have a video with the following title and description:
            Title: ${originalTitle}
            Description: ${originalDesc}
            
            Please generate a viral title, an SEO-friendly description, and 15 trending tags.
            Return JSON format: { "title": "...", "description": "...", "tags": ["tag1", "tag2", ...] }`;

            const result = await genAI.models.generateContent({
              model: 'omni-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            });
            
            const seoData = JSON.parse(result.response.text() || '{}');
            if (seoData.title) finalTitle = seoData.title;
            if (seoData.description) finalDesc = seoData.description;
            if (seoData.tags && Array.isArray(seoData.tags)) {
              finalTags = [...new Set([...finalTags, ...seoData.tags])];
            }
          } catch (aiErr) {
            console.error('AI SEO Optimization failed for rule task', aiErr);
          }
        }

        // Apply Prefix/Suffix/Template
        if (rule.prefix) finalTitle = `${rule.prefix} ${finalTitle}`;
        if (rule.suffix) finalTitle = `${finalTitle} ${rule.suffix}`;
        if (rule.descriptionTemplate) {
          finalDesc = `${finalDesc}\n\n${rule.descriptionTemplate}`;
        }

        const taskData = {
          videoUrl: `https://www.youtube.com/watch?v=${latestVideo.id?.videoId}`,
          title: finalTitle,
          description: finalDesc,
          tags: finalTags,
          scheduledTime: new Date().toISOString(),
          youtubeAccountId: rule.youtubeAccountId,
          status: 'pending',
          privacyStatus: rule.privacyStatus || 'private',
          createdAt: new Date().toISOString(),
          userId: 'master-user',
          ruleId: ruleId 
        };

        await db.collection('scheduled_tasks').add(taskData);
      }
      
      // 4. Update Rule
      await db.collection('automation_rules').doc(ruleId).update({
        lastRunAt: new Date().toISOString(),
        lastFetchedVideoId: videos[0].id?.videoId
      });

      console.log(`Auto-scheduled ${newVideos.length} videos from rule ${ruleId}`);
    } catch (err) {
      console.error(`Error processing rule ${ruleId}:`, err);
    }
  }

  async function processTask(taskId: string, task: any) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const tempPath = path.join(uploadDir, `automated-${taskId}.mp4`);

    try {
      // 1. Remote Download
      await db.collection('scheduled_tasks').doc(taskId).update({ status: 'downloading' });
      
      let downloadUrl = task.videoUrl;
      
      // Simple YouTube download using ytdl-core
      if (downloadUrl.includes('youtube.com') || downloadUrl.includes('youtu.be')) {
        await new Promise((resolve, reject) => {
          const stream = ytdl(downloadUrl, { filter: 'audioandvideo', quality: 'highest' });
          const fileStream = fs.createWriteStream(tempPath);
          stream.pipe(fileStream);
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });
      } else {
        // Generic download for other URLs
        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream'
        });
        const fileStream = fs.createWriteStream(tempPath);
        response.data.pipe(fileStream);
        await new Promise((resolve, reject) => {
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });
      }

      // 2. AI SEO Optimizer (if needed)
      let { title, description, tags } = task;
      if (!title || !description || tags.length === 0) {
        try {
          const seoPrompt = `Generate SEO metadata (title, description, tags) for this video. 
          URL/Context: ${downloadUrl}
          Base Title: ${title || 'Unknown Video'}
          Keywords: ${tags.join(', ')}
          Return JSON: { "title": "...", "description": "...", "tags": ["..."] }`;
          
          const genAI = await getAiClient();
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
          });
          
          const result = await model.generateContent(seoPrompt);
          const responseText = result.response.text();
          const seo = JSON.parse(responseText || '{}');
          title = seo.title || title;
          description = seo.description || description;
          tags = seo.tags || tags;
          
          await db.collection('scheduled_tasks').doc(taskId).update({ title, description, tags });
        } catch (e) {
          console.error('SEO Optimization failed:', e);
        }
      }

      // 3. YouTube Upload
      await db.collection('scheduled_tasks').doc(taskId).update({ status: 'uploading' });
      
      const tokens = getTokensForAccount(task.youtubeAccountId);
      if (!tokens) throw new Error('No YouTube account tokens found');

      const oauth2Client = getOauth2Client();
      oauth2Client.setCredentials(tokens);
      
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Implement retry logic for 429/quota
      let uploadResponse: any;
      let retries = 3;
      while (retries > 0) {
        try {
          uploadResponse = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
              snippet: { title, description, tags },
              status: { privacyStatus: 'private' },
            },
            media: { body: fs.createReadStream(tempPath) },
          });
          break; // Success
        } catch (err: any) {
          if (err.code === 429 || (err.errors && err.errors[0].reason === 'quotaExceeded')) {
            console.warn(`Upload rate limited or quota exceeded. Retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) throw err;
            await new Promise(r => setTimeout(r, 60000)); // Wait 1 minute
          } else {
            throw err;
          }
        }
      }

      // 4. Success
      await db.collection('scheduled_tasks').doc(taskId).update({
        status: 'completed',
        videoId: uploadResponse.data.id,
        completedAt: new Date().toISOString()
      });

      // Cleanup
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    } catch (error: any) {
      console.error(`Task ${taskId} failed:`, error);
      await db.collection('scheduled_tasks').doc(taskId).update({
        status: 'failed',
        error: error.message || 'Unknown error',
        failedAt: new Date().toISOString()
      });
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
