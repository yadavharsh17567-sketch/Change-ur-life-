import express from 'express';
import path from 'path';
import { promisify } from 'util';
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

import { execSync } from 'child_process';
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log('[INIT] System-wide FFmpeg is available and will be used.');
} catch (e) {
  console.warn('[INIT] System-wide FFmpeg not found or failed. Falling back to ffmpeg-static.');
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
}

dotenv.config();

// Local Database Fallback for Firestore (Ensures 100% functionality if Firestore API is disabled/permission denied)
class LocalCollection {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  static readAll() {
    try {
      if (!fs.existsSync('local_db.json')) {
        const initial = {
          projects: [
            { id: '1', title: 'SEO Guide 2026', createdAt: { _seconds: Date.now() / 1000 }, status: 'Completed', duration: '10:45', fileUrl: '' },
            { id: '2', title: 'Untitled_Video_01', createdAt: { _seconds: (Date.now() - 86400000) / 1000 }, status: 'Draft', duration: '02:15', fileUrl: '' },
            { id: '3', title: 'My Vlog Ep 5', createdAt: { _seconds: (Date.now() - 3 * 86400000) / 1000 }, status: 'Exported', duration: '15:20', fileUrl: '' },
          ],
          uploads: [],
          scheduled_tasks: [],
          automation_rules: [],
          settings: {
            global: { geminiApiKey: '' }
          }
        };
        fs.writeFileSync('local_db.json', JSON.stringify(initial, null, 2), 'utf8');
        return initial;
      }
      return JSON.parse(fs.readFileSync('local_db.json', 'utf8'));
    } catch (e) {
      return {};
    }
  }

  static writeAll(data: any) {
    const tempPath = 'local_db.json.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, 'local_db.json');
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return {
      get: async () => {
        const all = LocalCollection.readAll();
        let items = all[this.name] || [];
        items = [...items].sort((a: any, b: any) => {
          let valA = a[field];
          let valB = b[field];
          if (valA && typeof valA === 'object' && valA._seconds) valA = valA._seconds;
          if (valB && typeof valB === 'object' && valB._seconds) valB = valB._seconds;
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        });
        return {
          docs: items.map((item: any) => ({
            id: item.id,
            data: () => item
          }))
        };
      }
    };
  }

  where(field: string, operator: string, value: any) {
    return {
      get: async () => {
        const all = LocalCollection.readAll();
        let items = all[this.name] || [];
        if (operator === '==') {
          items = items.filter((item: any) => item[field] === value);
        }
        return {
          docs: items.map((item: any) => ({
            id: item.id,
            data: () => item
          }))
        };
      }
    };
  }

  async get() {
    const all = LocalCollection.readAll();
    const items = all[this.name] || [];
    return {
      docs: items.map((item: any) => ({
        id: item.id,
        data: () => item
      }))
    };
  }

  async add(data: any) {
    const all = LocalCollection.readAll();
    if (!all[this.name]) all[this.name] = [];
    const id = Math.random().toString(36).substring(2, 11);
    
    const processedData = { ...data };
    for (const key in processedData) {
      if (processedData[key] && typeof processedData[key] === 'object' && processedData[key].constructor && processedData[key].constructor.name === 'FieldValue') {
        processedData[key] = { _seconds: Date.now() / 1000 };
      }
    }
    
    const newItem = { id, ...processedData };
    all[this.name].push(newItem);
    LocalCollection.writeAll(all);
    return {
      id,
      get: async () => ({
        exists: true,
        data: () => newItem
      })
    };
  }

  doc(id: string) {
    return {
      get: async () => {
        const all = LocalCollection.readAll();
        if (this.name === 'settings') {
          const settings = all.settings || {};
          const docData = settings[id] || {};
          return {
            exists: true,
            data: () => docData
          };
        }
        const items = all[this.name] || [];
        const found = items.find((item: any) => item.id === id);
        return {
          exists: !!found,
          data: () => found || {}
        };
      },
      update: async (data: any) => {
        const all = LocalCollection.readAll();
        if (this.name === 'settings') {
          if (!all.settings) all.settings = {};
          all.settings[id] = { ...(all.settings[id] || {}), ...data };
          LocalCollection.writeAll(all);
          return;
        }
        const items = all[this.name] || [];
        const index = items.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...data };
          all[this.name] = items;
          LocalCollection.writeAll(all);
        }
      },
      delete: async () => {
        const all = LocalCollection.readAll();
        if (this.name === 'settings') {
          if (all.settings) delete all.settings[id];
          LocalCollection.writeAll(all);
          return;
        }
        const items = all[this.name] || [];
        all[this.name] = items.filter((item: any) => item.id !== id);
        LocalCollection.writeAll(all);
      }
    };
  }
}

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: 'gen-lang-client-0565912654'
  });
}

let db: any;
try {
  const firestore = getFirestore();
  db = {
    collection: (name: string) => {
      return {
        orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
          return {
            get: async () => {
              try {
                return await firestore.collection(name).orderBy(field, direction).get();
              } catch (e: any) {
                console.warn(`Firestore orderBy failed for ${name}, falling back to LocalCollection:`, e.message || e);
                return new LocalCollection(name).orderBy(field, direction).get();
              }
            }
          };
        },
        where: (field: string, operator: string, value: any) => {
          return {
            get: async () => {
              try {
                return await firestore.collection(name).where(field, operator, value).get();
              } catch (e: any) {
                console.warn(`Firestore where failed for ${name}, falling back to LocalCollection:`, e.message || e);
                return new LocalCollection(name).where(field, operator, value).get();
              }
            }
          };
        },
        get: async () => {
          try {
            return await firestore.collection(name).get();
          } catch (e: any) {
            console.warn(`Firestore get failed for ${name}, falling back to LocalCollection:`, e.message || e);
            return new LocalCollection(name).get();
          }
        },
        add: async (data: any) => {
          try {
            return await firestore.collection(name).add(data);
          } catch (e: any) {
            console.warn(`Firestore add failed for ${name}, falling back to LocalCollection:`, e.message || e);
            return new LocalCollection(name).add(data);
          }
        },
        doc: (id: string) => {
          return {
            get: async () => {
              try {
                return await firestore.collection(name).doc(id).get();
              } catch (e: any) {
                console.warn(`Firestore doc.get failed for ${name}/${id}, falling back to LocalCollection:`, e.message || e);
                return new LocalCollection(name).doc(id).get();
              }
            },
            update: async (data: any) => {
              try {
                return await firestore.collection(name).doc(id).update(data);
              } catch (e: any) {
                console.warn(`Firestore doc.update failed for ${name}/${id}, falling back to LocalCollection:`, e.message || e);
                return new LocalCollection(name).doc(id).update(data);
              }
            },
            delete: async () => {
              try {
                return await firestore.collection(name).doc(id).delete();
              } catch (e: any) {
                console.warn(`Firestore doc.delete failed for ${name}/${id}, falling back to LocalCollection:`, e.message || e);
                return new LocalCollection(name).doc(id).delete();
              }
            }
          };
        }
      };
    }
  };
} catch (error) {
  console.warn('Firebase init failed, using LocalCollection');
  db = {
    collection: (name: string) => new LocalCollection(name)
  };
}

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Structured JSON error responder
const sendDetailedError = (res: any, error: any, stage: string, message: string, solution: string) => {
  const stack = error instanceof Error ? error.stack : new Error().stack;
  console.error(`[ERROR] Stage: ${stage} - ${message}`);
  console.error(stack);
  return res.status(500).json({
    success: false,
    stage,
    error: `${message}: ${error?.message || error}`,
    stack: stack || '',
    solution,
    ffmpegCommand: error?.ffmpegCommand || undefined,
    ffmpegStderr: error?.ffmpegStderr || undefined,
    ffmpegStdout: error?.ffmpegStdout || undefined
  });
};

// Automate creation of temp/uploads folder and check binaries
const verifySystemDependencies = async () => {
  console.log('[INIT] Verifying system dependencies...');
  
  // Create folders
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('[INIT] Created uploads directory');
  }

  // Check FFmpeg
  try {
    await execAsync('ffmpeg -version');
    console.log('[INIT] FFmpeg is verified and executable.');
  } catch (err: any) {
    console.warn('[INIT] Warning: System-wide FFmpeg not found or failed. Falling back to ffmpeg-static path check.', err.message || err);
    if (!ffmpegStatic) {
      console.error('[INIT] Critical error: Neither system FFmpeg nor ffmpeg-static is available.');
    }
  }

  // Check FFprobe
  try {
    await execAsync('ffprobe -version');
    console.log('[INIT] FFprobe is verified and executable.');
  } catch (err: any) {
    console.warn('[INIT] Warning: FFprobe was not found or failed.', err.message || err);
  }

  // Check yt-dlp standalone binary
  const ytDlpPath = path.join(process.cwd(), 'yt-dlp');
  if (fs.existsSync(ytDlpPath)) {
    try {
      await execAsync(`"${ytDlpPath}" --version`);
      console.log('[INIT] yt-dlp is verified and executable.');
    } catch (err: any) {
      console.error('[INIT] Local yt-dlp executable test failed. Attempting to repair permissions...', err.message || err);
      try {
        fs.chmodSync(ytDlpPath, '755');
        await execAsync(`"${ytDlpPath}" --version`);
        console.log('[INIT] yt-dlp is repaired and executable.');
      } catch (chmodErr: any) {
        console.error('[INIT] Failed to repair yt-dlp. Will try downloading fresh binary.', chmodErr.message || chmodErr);
      }
    }
  } else {
    console.log('[INIT] yt-dlp is missing. Downloading standalone binary from GitHub...');
    try {
      const curlCmd = `curl -L -o "${ytDlpPath}" https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp`;
      await execAsync(curlCmd);
      fs.chmodSync(ytDlpPath, '755');
      const versionOutput = await execAsync(`"${ytDlpPath}" --version`);
      console.log(`[INIT] yt-dlp has been successfully downloaded and verified. Version: ${versionOutput.stdout.trim()}`);
    } catch (downloadErr: any) {
      console.error('[INIT] Critical error downloading yt-dlp standalone binary:', downloadErr.message || downloadErr);
    }
  }
};

// Fire verification immediately
verifySystemDependencies().catch(console.error);

// Segment downloader helper using yt-dlp
async function downloadSegmentWithYtDlp(
  videoUrl: string, 
  startSec: number, 
  endSec: number, 
  rawPath: string, 
  cookiesStr?: string
): Promise<{ success: boolean; errorMsg?: string }> {
  const ytDlpPath = path.join(process.cwd(), 'yt-dlp');
  if (!fs.existsSync(ytDlpPath)) {
    console.warn('[DOWNLOAD] yt-dlp not found at path:', ytDlpPath);
    return { success: false, errorMsg: 'yt-dlp binary is missing on the server.' };
  }
  
  let cookieFilePath: string | null = null;
  try {
    console.log(`[DOWNLOAD] Downloading segment from ${startSec}s to ${endSec}s using yt-dlp...`);
    
    let cookieArg = '';
    if (cookiesStr && cookiesStr.trim().length > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cookieFilePath = path.join(uploadDir, `cookies-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.txt`);
      fs.writeFileSync(cookieFilePath, cookiesStr, 'utf8');
      cookieArg = `--cookies "${cookieFilePath}"`;
      console.log(`[DOWNLOAD] Netscape cookies file written to ${cookieFilePath}.`);
    }

    // Use a very flexible format selection: try best video and best audio combined, or best mp4, or fallback to best
    const formatArg = '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
    const cmd = `"${ytDlpPath}" ${formatArg} --js-runtimes node --download-sections "*${startSec}-${endSec}" ${cookieArg} -o "${rawPath}" "${videoUrl}"`;
    
    console.log(`[DOWNLOAD] Running command: ${cmd.replace(/--cookies ".*?"/, '--cookies "[HIDDEN]"')}`);
    
    let stdout = '';
    let stderr = '';
    try {
      const execResult = await execAsync(cmd);
      stdout = execResult.stdout;
      stderr = execResult.stderr;
    } catch (execErr: any) {
      stdout = execErr.stdout || '';
      stderr = execErr.stderr || execErr.message || '';
      console.warn('[DOWNLOAD] yt-dlp non-zero exit or execution warning:', execErr.message || execErr);
    }

    if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 0) {
      console.log(`[DOWNLOAD] Segment downloaded successfully to ${rawPath} (Size: ${(fs.statSync(rawPath).size / 1024 / 1024).toFixed(2)} MB)`);
      return { success: true };
    }
    
    console.warn(`[DOWNLOAD] Download file empty or missing: ${rawPath}`);
    const cleanStderr = stderr.split('\n').filter(l => l.trim() && !l.includes('Deprecated')).join('\n');
    return { 
      success: false, 
      errorMsg: cleanStderr || stdout || 'yt-dlp did not output a valid segment file.' 
    };
  } catch (err: any) {
    console.error('[DOWNLOAD] yt-dlp segment download threw error:', err.message || err);
    return { success: false, errorMsg: err.message || 'An unknown error occurred during downloading.' };
  } finally {
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      try {
        fs.unlinkSync(cookieFilePath);
        console.log(`[DOWNLOAD] Cleaned up temporary cookies file.`);
      } catch (unlinkErr) {
        // Ignore
      }
    }
  }
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleaned = url.trim();
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    return cleaned;
  }

  const youtuBeMatch = cleaned.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  try {
    let parsedUrl = cleaned;
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      parsedUrl = 'https://' + cleaned;
    }
    const urlObj = new URL(parsedUrl);
    
    if (urlObj.hostname.includes('youtube.com')) {
      const pathParts = urlObj.pathname.split('/');
      const specialRoutes = ['shorts', 'live', 'embed', 'v'];
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (specialRoutes.includes(pathParts[i].toLowerCase())) {
          const possibleId = pathParts[i + 1];
          if (/^[a-zA-Z0-9_-]{11}$/.test(possibleId)) {
            return possibleId;
          }
        }
      }
      
      const vParam = urlObj.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  const patterns = [
    /v=([a-zA-Z0-9_-]{11})/i,
    /\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /\/live\/([a-zA-Z0-9_-]{11})/i,
    /\/embed\/([a-zA-Z0-9_-]{11})/i,
    /\/v\/([a-zA-Z0-9_-]{11})/i,
    /\.be\/([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  const fallbackMatch = cleaned.match(/(?:\/|v=|^)([a-zA-Z0-9_-]{11})(?:[?&]|$)/i);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  return null;
}

let customConfig: Record<string, string> = {};
try {
  customConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (e) {
  // Ignore
}

const getCleanGeminiApiKey = (customKey?: string) => {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.startsWith('AIza')) {
    if (!customKey || customKey.startsWith('AQ.')) {
      return envKey;
    }
  }
  return customKey || envKey || '';
};

const getAiClient = async () => {
  const settings = (await db.collection('settings').doc('global').get()).data() || {};
  const rawKey = settings.geminiApiKey || customConfig.GEMINI_API_KEY;
  const key = getCleanGeminiApiKey(rawKey);
  if (!key) throw new Error('GEMINI_API_KEY is not set in settings or environment.');
  return new GoogleGenAI({ apiKey: key });
};

// Configure Multer to preserve filename extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

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
    const tempPath = 'youtube_accounts.json.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(ytAccountState, null, 2));
    fs.renameSync(tempPath, YT_ACCOUNTS_FILE);
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
    console.log('[EXPORT] Received YouTube manual video upload request...');
    const tokens = getActiveTokens();
    if (!tokens) {
      return res.status(401).json({
        success: false,
        stage: "Export",
        error: "Not authenticated with YouTube.",
        solution: "Please connect your YouTube account in Settings first."
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        stage: "Upload",
        error: "No video file was uploaded.",
        solution: "Please select a valid video file to upload."
      });
    }

    // Validate size (max 500MB)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        stage: "Upload",
        error: `File size exceeds the limit of 500MB (actual size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        solution: "Please compress your video or upload a smaller file."
      });
    }

    // Validate format
    const validMimetypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/x-msvideo', 'video/webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
    
    if (!validMimetypes.includes(file.mimetype) && !validExtensions.includes(ext)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        stage: "Upload",
        error: `Invalid file format: ${file.mimetype || ext}. Only standard video formats are allowed.`,
        solution: "Please upload a valid video format (e.g., .mp4, .mov, .mkv, .webm)."
      });
    }

    try {
      console.log(`[EXPORT] File validated. Target path: ${file.path}. Initializing YouTube inserts...`);
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

      console.log(`[EXPORT] Inserting video details: Title="${title}", privacyStatus="${privacyStatus}"...`);
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
          body: fs.createReadStream(file.path),
        },
      });

      console.log(`[EXPORT] Video manually uploaded successfully to YouTube. Video ID: ${response.data.id}`);
      // Clean up file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      res.json({ success: true, videoId: response.data.id });
    } catch (error: any) {
      console.error('[EXPORT] YouTube manual upload error:', error);
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return sendDetailedError(
        res,
        error,
        "Export",
        "Failed to upload video to YouTube account",
        "Verify your YouTube Channel upload quota has not been exceeded, the OAuth tokens are fully connected, and that your connection is stable."
      );
    }
  });

  app.post('/api/seo', async (req, res) => {
    try {
      const { description, keywords } = req.body;
      const genAI = await getAiClient();
      const prompt = `Generate SEO metadata (title, tags, description) for a video with description: "${description}" and keywords: "${keywords}". Return JSON format: { "title": "...", "description": "...", "tags": ["..."] }`;
      
      const result = await genAI.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      res.json(JSON.parse(result.text || '{}'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate SEO' });
    }
  });

  function parseTimeToSeconds(timeStr: any): number | null {
    if (timeStr === null || timeStr === undefined) return null;
    const str = String(timeStr).trim();
    if (!str) return null;
    
    // If it's a pure number (seconds)
    if (/^\d+$/.test(str)) {
      return parseInt(str, 10);
    }
    
    // Format MM:SS or HH:MM:SS
    const parts = str.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;
    
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  function formatSecondsToTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  app.post('/api/generate-clips', async (req, res) => {
    console.log('[CLIP DETECTION] Starting clip generation process...');
    try {
      const { videoUrl } = req.body;
      
      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          stage: "Clip Detection",
          error: "No video URL was provided.",
          solution: "Please enter a valid YouTube video or livestream URL."
        });
      }

      const videoId = extractYouTubeVideoId(videoUrl);

      if (!videoId) {
        return res.status(400).json({
          success: false,
          stage: "Clip Detection",
          error: "Invalid YouTube URL format.",
          solution: "Please check your URL. It must be a valid YouTube watch link, share link, or livestream URL."
        });
      }

      // Check Gemini API Key before invoking client
      const settings = (await db.collection('settings').doc('global').get()).data() || {};
      const rawKey = settings.geminiApiKey || customConfig.GEMINI_API_KEY;
      const key = getCleanGeminiApiKey(rawKey);
      if (!key) {
        return res.status(400).json({
          success: false,
          stage: "Clip Detection",
          error: "GEMINI_API_KEY is not set in settings or environment.",
          solution: "Please navigate to the Settings page and enter a valid Gemini API Key, or set it as GEMINI_API_KEY in the environment."
        });
      }

      let videoTitle = "Unknown Video";
      let videoDescription = "";

      console.log(`[CLIP DETECTION] Fetching YouTube metadata for videoId: ${videoId}...`);
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
            console.log(`[CLIP DETECTION] Metadata resolved: "${videoTitle}"`);
          }
        } catch (e: any) {
          console.warn("[CLIP DETECTION] Warning: Error fetching video details from YouTube API:", e.message || e);
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

      console.log('[CLIP DETECTION] Sending prompt to Gemini-3.5-Flash...');
      const genAI = await getAiClient();
      const result = await genAI.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      console.log('[CLIP DETECTION] Received response from Gemini. Parsing JSON output...');
      let text = result.text || '[]';
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0].trim();
      }

      let parsedClips = JSON.parse(text);
      if (!Array.isArray(parsedClips)) {
        parsedClips = [];
      }

      const repairedClips = [];
      for (let i = 0; i < parsedClips.length; i++) {
        const rawClip = parsedClips[i];
        if (!rawClip || typeof rawClip !== 'object') {
          console.warn(`[CLIP DETECTION] Skipping invalid clip at index ${i}: not an object`);
          continue;
        }

        // Reject clips with missing timestamps
        if (rawClip.startTime == null || rawClip.endTime == null) {
          console.warn(`[CLIP DETECTION] Skipping clip ${i} because of missing startTime/endTime:`, rawClip);
          continue;
        }

        const startSec = parseTimeToSeconds(rawClip.startTime);
        const endSec = parseTimeToSeconds(rawClip.endTime);

        if (startSec === null || endSec === null || startSec < 0 || endSec <= startSec) {
          console.warn(`[CLIP DETECTION] Skipping clip ${i} due to invalid or malformed timestamps:`, rawClip);
          continue;
        }

        const normalizedStartTime = formatSecondsToTime(startSec);
        const normalizedEndTime = formatSecondsToTime(endSec);
        const duration = endSec - startSec;

        // Generate default title if missing
        const title = (rawClip.title && typeof rawClip.title === 'string' && rawClip.title.trim())
          ? rawClip.title.trim()
          : `Viral Clip #${i + 1}`;

        const description = (rawClip.description && typeof rawClip.description === 'string')
          ? rawClip.description.trim()
          : `Extracted highlight from livestream: ${videoTitle}`;

        const tags = Array.isArray(rawClip.tags)
          ? rawClip.tags.map((t: any) => String(t).trim()).filter(Boolean)
          : [];

        const viralScore = typeof rawClip.viralScore === 'number' && !isNaN(rawClip.viralScore)
          ? rawClip.viralScore
          : Math.floor(Math.random() * (95 - 75 + 1)) + 75;

        const id = rawClip.id || `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`;
        const transcript = rawClip.transcript || '';

        repairedClips.push({
          id,
          title,
          description,
          tags,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          duration,
          viralScore,
          transcript
        });
      }

      console.log(`[CLIP DETECTION] Successfully generated and repaired ${repairedClips.length} clip suggestions.`);
      res.json({ clips: repairedClips, originalVideo: { title: videoTitle, id: videoId } });
    } catch (error: any) {
      console.error('[CLIP DETECTION] Error during clip detection:', error);
      return sendDetailedError(
        res,
        error,
        "Clip Detection",
        "Failed to analyze the YouTube video and generate clips",
        "Please confirm that your Gemini API Key is active, your project quota is not exceeded, and that you have a stable network connection."
      );
    }
  });

  app.post('/api/youtube/upload-clip', async (req, res) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[EXPORT] [${taskId}] Received clip upload request.`);
    
    const { clip, videoUrl } = req.body;
    const tokens = getActiveTokens();
    
    if (!tokens) {
      return res.status(401).json({
        success: false,
        stage: "Export",
        error: "Not authenticated with YouTube.",
        solution: "Please connect your YouTube channel in Settings first."
      });
    }

    if (!clip || !videoUrl) {
      return res.status(400).json({
        success: false,
        stage: "Export",
        error: "Missing clip data or video URL.",
        solution: "Please make sure you have selected a valid clip and video URL."
      });
    }

    // 8. Log the complete clip object before exporting so missing fields are visible.
    console.log(`[EXPORT] [${taskId}] Clip object before exporting:`, JSON.stringify(clip, null, 2));

    // 7. Add runtime validation before export
    try {
      if (!clip || !clip.title || clip.startTime == null || clip.endTime == null) {
        throw new Error(`Invalid clip: ${JSON.stringify(clip)}`);
      }
    } catch (validationErr: any) {
      console.error(`[EXPORT] [${taskId}] Runtime validation failed:`, validationErr.message);
      return res.status(400).json({
        success: false,
        stage: "Export",
        error: `Clip is missing required fields (startTime, endTime, title). Details: ${validationErr.message}`,
        solution: "Please check that your clip has valid titles and start/end times."
      });
    }

    const startSec = parseTimeToSeconds(clip.startTime) || 0;
    const endSec = parseTimeToSeconds(clip.endTime) || 0;
    const duration = endSec - startSec > 0 ? endSec - startSec : 15; // default to 15s if invalid

    const uploadDir = path.join(process.cwd(), 'uploads');
    // Ensure the uploads directory exists
    fs.mkdirSync('/app/applet/uploads', { recursive: true });
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const tempPath = path.join(uploadDir, `clip-${taskId}.mp4`);
    const audioPath = path.join(uploadDir, `audio-${taskId}.wav`);
    const subsPath = path.join(uploadDir, `subs-${taskId}.ass`);
    const videoWithSubsPath = path.join(uploadDir, `final-${taskId}.mp4`);
    const rawPath = path.join(uploadDir, `raw-${taskId}.mp4`);
    const channelNamePath = path.join(uploadDir, `channelName-${taskId}.txt`);
    const clipTitlePath = path.join(uploadDir, `clipTitle-${taskId}.txt`);

    let uploadVideoPath = tempPath;

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

    let currentStage = 'Initialization';
    let suggestedSolution = 'Please verify that your YouTube channel connection is active and valid.';

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
        } catch (err: any) {
          console.error(`[EXPORT] [${taskId}] Failed to parse YTDL cookies:`, err.message || err);
        }
      }

      // Fetch channel name for watermark
      currentStage = 'Initialization';
      suggestedSolution = 'Check your YouTube OAuth token connection or refresh setting.';
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
      } catch (err: any) {
        console.error(`[EXPORT] [${taskId}] Failed to fetch channel name:`, err.message || err);
      }
      
      const escapeFilterPath = (p: string) => p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");

      // Helper to wrap title
      const wrapTitle = (title: string) => {
        const words = title.split(' ');
        const mid = Math.floor(words.length / 2);
        if (words.length <= 4) return title;
        return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
      };
      
      // Write textfiles for drawtext to fully prevent all escape and parameter injection issues
      fs.writeFileSync(channelNamePath, channelName, 'utf8');
      fs.writeFileSync(clipTitlePath, wrapTitle(clip.title), 'utf8');

      // Download and trim using yt-dlp first, fallback to ffmpeg + ytdl stream
      currentStage = 'Download';
      suggestedSolution = 'The video could not be downloaded. Check if the YouTube video is private, age-restricted, or removed, and verify that your internet connection is active.';
      
      console.log(`[EXPORT] [${taskId}] Stage: Download. Fetching segment from ${startSec} to ${endSec}...`);
      let downloadResult: { success: boolean; errorMsg?: string } = { success: false };
      try {
        downloadResult = await downloadSegmentWithYtDlp(videoUrl, startSec, endSec, rawPath, customConfig.YTDL_COOKIES);
      } catch (dlErr: any) {
        console.error(`[EXPORT] [${taskId}] yt-dlp segment download threw error:`, dlErr.message || dlErr);
        downloadResult = { success: false, errorMsg: dlErr.message || String(dlErr) };
      }

      currentStage = 'FFmpeg';
      suggestedSolution = 'Failed to trim/crop the video. Verify that FFmpeg is installed, executable, and that the video is not corrupted.';

      if (downloadResult.success) {
        console.log(`[EXPORT] [${taskId}] Stage: FFmpeg. Transcoding and cropping downloaded segment locally...`);
        // Run FFmpeg on local rawPath file
        let ffmpegCommand = '';
        let ffmpegStderr = '';
        let ffmpegStdout = '';

        await new Promise((resolve, reject) => {
          const proc = ffmpeg(rawPath)
            .videoFilters(`crop=ih*(9/16):ih,scale=1080:1920,drawtext=textfile='${escapeFilterPath(clipTitlePath)}':x=(w-text_w)/2:y=100:fontsize=72:fontcolor=yellow:borderw=4:bordercolor=black:box=1:boxcolor=black@0.8:boxborderw=20`)
            .videoCodec('libx264')
            .outputOptions(['-crf 18', '-preset slow'])
            .output(tempPath)
            .on('start', (commandLine) => {
              ffmpegCommand = commandLine;
              console.log(`[FFMPEG RUN] Spawned FFmpeg with command: ${commandLine}`);
            })
            .on('stdout', (data) => {
              ffmpegStdout += data + '\n';
            })
            .on('stderr', (data) => {
              ffmpegStderr += data + '\n';
            })
            .on('end', () => {
              console.log(`[EXPORT] [${taskId}] FFmpeg local render completed.`);
              console.log(`[FFMPEG STDOUT]:\n${ffmpegStdout}`);
              console.log(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
              resolve(null);
            })
            .on('error', (err) => {
              console.error(`[EXPORT] [${taskId}] FFmpeg local render error:`, err);
              console.error(`[FFMPEG COMMAND]: ${ffmpegCommand}`);
              console.error(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
              (err as any).ffmpegCommand = ffmpegCommand;
              (err as any).ffmpegStderr = ffmpegStderr;
              (err as any).ffmpegStdout = ffmpegStdout;
              reject(err);
            });

          proc.run();
        });
      } else {
        console.log(`[EXPORT] [${taskId}] Stage: Download Fallback. Streaming video and cropping on-the-fly...`);
        // Fallback to streaming method
        const ytdlOptions: any = { filter: 'audioandvideo', quality: 'highest' };
        if (agent) {
          ytdlOptions.agent = agent;
        }
        
        try {
          let directUrl: string | null = null;
          try {
            console.log(`[DOWNLOAD] Fetching video formats with ytdl.getInfo for seekable streaming fallback...`);
            const info = await ytdl.getInfo(videoUrl, ytdlOptions);
            const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo', quality: 'highest' });
            directUrl = format?.url || null;
            if (directUrl) {
              console.log(`[DOWNLOAD] Successfully resolved direct stream URL: ${directUrl.substring(0, 100)}...`);
            }
          } catch (infoErr: any) {
            console.warn(`[DOWNLOAD] Failed to get direct stream URL, using non-seekable fallback stream:`, infoErr.message || infoErr);
          }

          const inputSource = directUrl || ytdl(videoUrl, ytdlOptions);
          let ffmpegCommand = '';
          let ffmpegStderr = '';
          let ffmpegStdout = '';

          await new Promise((resolve, reject) => {
            const proc = ffmpeg(inputSource)
              .setStartTime(startSec)
              .duration(duration)
              .videoFilters(`crop=ih*(9/16):ih,scale=1080:1920,drawtext=textfile='${escapeFilterPath(clipTitlePath)}':x=(w-text_w)/2:y=100:fontsize=72:fontcolor=yellow:borderw=4:bordercolor=black:box=1:boxcolor=black@0.8:boxborderw=20`)
              .videoCodec('libx264')
              .outputOptions(['-crf 18', '-preset slow'])
              .output(tempPath)
              .on('start', (commandLine) => {
                ffmpegCommand = commandLine;
                console.log(`[FFMPEG RUN] Spawned FFmpeg fallback with command: ${commandLine}`);
              })
              .on('stdout', (data) => {
                ffmpegStdout += data + '\n';
              })
              .on('stderr', (data) => {
                ffmpegStderr += data + '\n';
              })
              .on('end', () => {
                console.log(`[EXPORT] [${taskId}] FFmpeg fallback streaming completed.`);
                console.log(`[FFMPEG STDOUT]:\n${ffmpegStdout}`);
                console.log(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
                resolve(null);
              })
              .on('error', (err) => {
                console.error(`[EXPORT] [${taskId}] FFmpeg fallback streaming error:`, err);
                console.error(`[FFMPEG COMMAND]: ${ffmpegCommand}`);
                console.error(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
                (err as any).ffmpegCommand = ffmpegCommand;
                (err as any).ffmpegStderr = ffmpegStderr;
                (err as any).ffmpegStdout = ffmpegStdout;
                reject(err);
              });

            proc.run();
          });
        } catch (streamErr: any) {
          console.error(`[EXPORT] [${taskId}] Fallback stream rendering failed:`, streamErr.message || streamErr);
          // Set stage to Download to show the original yt-dlp error clearly to the user
          currentStage = 'Download';
          suggestedSolution = 'Ensure the video link is public, not age-restricted, and that your YouTube cookie configuration in Settings is valid if it is a private/restricted video.';
          throw new Error(downloadResult.errorMsg || streamErr.message || 'Both high-speed download and fallback stream failed.');
        }
      }

      updateTaskStep(taskId, 'download', 'completed', 100, 'Video downloaded and cropped.');

      // 4. Generate AI Subtitles if enabled
      if (customConfig.AI_SUBTITLES_ENABLED === 'true') {
        console.log(`[EXPORT] [${taskId}] Stage: Transcription. Extracting audio from cropped clip...`);
        currentStage = 'Transcription';
        suggestedSolution = 'Failed to extract audio from video clip. Verify FFmpeg is fully functional.';
        
        updateTaskStep(taskId, 'extract-audio', 'processing', 20, 'Extracting audio track for transcription...');
        // Extract Audio
        let ffmpegCommand = '';
        let ffmpegStderr = '';
        let ffmpegStdout = '';

        await new Promise((resolve, reject) => {
          const proc = ffmpeg(tempPath)
            .noVideo()
            .outputOptions([
              '-map 0:a:0',       // Extract only the primary speech/audio track
              '-ar 16000',        // 16kHz sample rate
              '-ac 1',            // mono
              '-c:a pcm_s16le'    // PCM 16-bit codec
            ])
            .output(audioPath)
            .on('start', (commandLine) => {
              ffmpegCommand = commandLine;
              console.log(`[FFMPEG RUN] Spawned FFmpeg audio extraction with command: ${commandLine}`);
            })
            .on('stdout', (data) => {
              ffmpegStdout += data + '\n';
            })
            .on('stderr', (data) => {
              ffmpegStderr += data + '\n';
            })
            .on('end', () => {
              console.log(`[EXPORT] [${taskId}] Audio track extracted successfully.`);
              console.log(`[FFMPEG STDOUT]:\n${ffmpegStdout}`);
              console.log(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
              resolve(null);
            })
            .on('error', (err) => {
              console.error(`[EXPORT] [${taskId}] Audio extraction failed:`, err);
              console.error(`[FFMPEG COMMAND]: ${ffmpegCommand}`);
              console.error(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
              (err as any).ffmpegCommand = ffmpegCommand;
              (err as any).ffmpegStderr = ffmpegStderr;
              (err as any).ffmpegStdout = ffmpegStdout;
              reject(err);
            });

          proc.run();
        });

        // Save a clean copy as debug_audio.wav
        const debugAudioPath = path.join(uploadDir, 'debug_audio.wav');
        try {
          fs.copyFileSync(audioPath, debugAudioPath);
          console.log(`[DEBUG] [${taskId}] Extracted audio copied to debug_audio.wav at: ${debugAudioPath}`);
        } catch (copyErr: any) {
          console.error(`[DEBUG] [${taskId}] Failed to save copy as debug_audio.wav:`, copyErr.message || copyErr);
        }

        const stat = fs.statSync(audioPath);
        let duration = 0;
        let codec = 'pcm_s16le';
        let sampleRate = 16000;
        let channels = 1;

        try {
          const ffprobe = promisify(ffmpeg.ffprobe);
          const metadata = await ffprobe(audioPath);
          duration = parseFloat(metadata.format.duration || '0');
          if (metadata.streams && metadata.streams[0]) {
            codec = metadata.streams[0].codec_name || codec;
            sampleRate = parseInt(metadata.streams[0].sample_rate || '0', 10) || sampleRate;
            channels = parseInt(metadata.streams[0].channels || '0', 10) || channels;
          }
        } catch (probeErr: any) {
          console.error(`[DEBUG] [${taskId}] FFprobe on extracted audio failed:`, probeErr.message || probeErr);
        }

        console.log(`[DEBUG] [${taskId}] Extracted Audio Analysis:`);
        console.log(`- File Path: ${audioPath}`);
        console.log(`- File Size: ${stat.size} bytes`);
        console.log(`- Duration: ${duration} seconds`);
        console.log(`- Codec: ${codec}`);
        console.log(`- Sample Rate: ${sampleRate} Hz`);
        console.log(`- Channels: ${channels}`);

        // Verify the file is not empty and has a duration
        if (stat.size === 0) {
          const emptyErr = new Error(`Extracted audio file is empty (0 bytes).`);
          updateTaskStep(taskId, 'extract-audio', 'failed', 0, emptyErr.message);
          throw emptyErr;
        }
        if (duration <= 0) {
          const emptyDurErr = new Error(`Extracted audio file has duration of 0 seconds.`);
          updateTaskStep(taskId, 'extract-audio', 'failed', 0, emptyDurErr.message);
          throw emptyDurErr;
        }

        console.log(`[DEBUG] [${taskId}] Verification successful: audio file contains active, non-empty speech/audio track.`);
        updateTaskStep(taskId, 'extract-audio', 'completed', 100, 'Audio extracted successfully.');

        suggestedSolution = `Could not transcribe the audio using provider '${customConfig.AI_PROVIDER}'. Please verify your API Key and billing/quota status in Settings.`;
        updateTaskStep(taskId, 'transcribe', 'processing', 20, 'Transcribing audio using AI provider...');
        
        let words = null;
        let lang = customConfig.SUBTITLE_LANGUAGE || 'auto';
        const provider = customConfig.AI_PROVIDER || 'groq';

        console.log(`[EXPORT] [${taskId}] Transcribing audio with provider: ${provider}...`);
        
        if (provider === 'groq' && customConfig.GROQ_API_KEY) {
          const formData = new FormData();
          formData.append('file', fs.createReadStream(audioPath));
          formData.append('model', 'whisper-large-v3');
          formData.append('response_format', 'verbose_json');
          formData.append('timestamp_granularities[]', 'word'); // MUST request word-level timestamps!
          if (lang !== 'auto') formData.append('language', lang);
          
          console.log(`[DEBUG] [${taskId}] --- EXACT GROQ REQUEST ---`);
          console.log(`- Endpoint: POST https://api.groq.com/openai/v1/audio/transcriptions`);
          console.log(`- Headers:`);
          console.log(`    Authorization: Bearer ${customConfig.GROQ_API_KEY ? customConfig.GROQ_API_KEY.substring(0, 8) + '...' : 'MISSING'}`);
          console.log(`    Content-Type: multipart/form-data; boundary=${formData.getBoundary()}`);
          console.log(`- Request Parameters:`);
          console.log(`    model: "whisper-large-v3"`);
          console.log(`    response_format: "verbose_json"`);
          console.log(`    timestamp_granularities[]: "word"`);
          if (lang !== 'auto') console.log(`    language: "${lang}"`);
          console.log(`- File Uploading: ${audioPath}`);
          console.log(`    Size: ${stat.size} bytes`);
          console.log(`---------------------------------`);

          try {
            const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
              headers: {
                'Authorization': `Bearer ${customConfig.GROQ_API_KEY}`,
                ...formData.getHeaders(),
              }
            });
            console.log(`[DEBUG] [${taskId}] --- COMPLETE GROQ API RESPONSE ---`);
            console.log(JSON.stringify(res.data, null, 2));
            console.log(`------------------------------------------------`);

            const transcriptionText = res.data?.text || '';
            const detectedLanguage = res.data?.language || 'unknown';
            const segments = res.data?.segments || [];
            const noSpeechProb = segments.length > 0 ? (segments[0].no_speech_prob ?? 'N/A') : 'N/A';

            console.log(`[DEBUG] [${taskId}] --- TRANSCRIPTION METRICS ---`);
            console.log(`- transcription.text: "${transcriptionText}"`);
            console.log(`- detected language: ${detectedLanguage}`);
            console.log(`- no_speech_prob: ${noSpeechProb}`);
            console.log(`- segments count: ${segments.length}`);
            console.log(`-----------------------------------`);

            if (!transcriptionText || transcriptionText.trim().length === 0) {
              const emptyErr = `Groq Whisper returned empty transcription text. Raw response: ${JSON.stringify(res.data)}`;
              console.error(`[DEBUG] [${taskId}] ${emptyErr}`);
              updateTaskStep(taskId, 'transcribe', 'failed', 0, 'Transcription text was empty.');
              throw new Error(emptyErr);
            }

            words = res.data?.words;
            
            if ((!words || words.length === 0) && res.data?.segments) {
              console.log(`[DEBUG] [${taskId}] No direct 'words' array returned. Extracting or falling back to segment timestamps.`);
              const hasSegmentWords = res.data.segments.some((s: any) => s.words && s.words.length > 0);
              if (hasSegmentWords) {
                words = res.data.segments.flatMap((s: any) => s.words || []);
              } else {
                words = res.data.segments.map((s: any) => ({
                  start: s.start,
                  end: s.end,
                  word: s.text.trim()
                })).filter((w: any) => w.word.length > 0);
              }
            }

            if (!words || words.length === 0) {
              const emptyWordsErr = `No subtitles or segments could be mapped from the Groq API response.`;
              console.error(`[DEBUG] [${taskId}] ${emptyWordsErr}`);
              updateTaskStep(taskId, 'transcribe', 'failed', 0, emptyWordsErr);
              throw new Error(emptyWordsErr);
            }
          } catch (err: any) {
            console.error(`[DEBUG] [${taskId}] Groq API Error: ${err.message}`);
            if (err.response) {
              console.error(`[DEBUG] [${taskId}] Groq response error details:`, JSON.stringify(err.response.data, null, 2));
              updateTaskStep(taskId, 'transcribe', 'failed', 0, `Groq API Error: ${JSON.stringify(err.response.data)}`);
            } else {
              updateTaskStep(taskId, 'transcribe', 'failed', 0, `Groq Request Failed: ${err.message}`);
            }
            throw err;
          }
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
              'Content-Type': 'audio/wav',
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
              console.error("[EXPORT] AssemblyAI Error:", pollRes.data.error);
            }
          }
          if (finalWords) {
            words = finalWords.map((w: any) => ({
              start: w.start / 1000,
              end: w.end / 1000,
              word: w.text
            }));
          }
        } else {
          console.warn(`[EXPORT] [${taskId}] Missing or invalid API key for subtitle provider: ${provider}`);
        }

        if (words && words.length > 0) {
          console.log(`[EXPORT] [${taskId}] Subtitles transcribed with ${words.length} words. Rendering captions...`);
          currentStage = 'FFmpeg';
          suggestedSolution = 'Could not burn dynamic subtitles into video. Check that your caption styling is supported by FFmpeg.';
          
          updateTaskStep(taskId, 'transcribe', 'completed', 100, 'Speech transcribed.');
          updateTaskStep(taskId, 'subtitles', 'processing', 20, 'Applying dynamic caption styles...');

          // Generate ASS file with styles and emoji toggle
          const style = customConfig.CAPTION_STYLE || 'mrbeast';
          const useEmoji = customConfig.EMOJI_ENABLED === 'true';
          
          generateASSSubtitles(words, subsPath, style, useEmoji);

          // 1. Save and print its full path and file size
          console.log(`[DEBUG] [${taskId}] Subtitle file saved at: ${subsPath}`);
          const subsStat = fs.statSync(subsPath);
          console.log(`[DEBUG] [${taskId}] Subtitle file size: ${subsStat.size} bytes`);
          
          // 4. Verify the subtitle file is not empty
          if (subsStat.size === 0) {
            const errEmptySubs = new Error(`Generated subtitle file is empty!`);
            updateTaskStep(taskId, 'subtitles', 'failed', 0, errEmptySubs.message);
            throw errEmptySubs;
          }

          // 3. Print the first 10 subtitle entries/lines
          const subsContent = fs.readFileSync(subsPath, 'utf8');
          const subsLines = subsContent.split('\n');
          console.log(`[DEBUG] [${taskId}] First 10 subtitle entries/lines:`);
          subsLines.slice(0, 15).forEach((line, idx) => {
            console.log(`  [Line ${idx + 1}] ${line}`);
          });

          // Burn subtitles into video
          let ffmpegCommand = '';
          let ffmpegStderr = '';
          let ffmpegStdout = '';

          console.log(`[DEBUG] [${taskId}] Rendering video with subtitles.`);
          console.log(`[DEBUG] [${taskId}] Input video: ${tempPath}`);
          console.log(`[DEBUG] [${taskId}] Subtitle file: ${subsPath}`);
          console.log(`[DEBUG] [${taskId}] Output video: ${videoWithSubsPath}`);
          
          if (!fs.existsSync(tempPath)) console.error(`[DEBUG] [${taskId}] Input video does not exist!`);
          
          await new Promise((resolve, reject) => {
            const proc = ffmpeg(tempPath)
              .videoFilters(`ass='${escapeFilterPath(subsPath)}',drawtext=textfile='${escapeFilterPath(channelNamePath)}':x=w-text_w-20:y=h-text_h-20:fontsize=30:fontcolor=white:alpha=0.3`)
              .videoCodec('libx264')
              .outputOptions(['-c:a copy', '-crf 18', '-preset slow'])
              .output(videoWithSubsPath)
              .on('start', (commandLine) => {
                ffmpegCommand = commandLine;
                // 5. Log the exact FFmpeg command used to burn subtitles
                console.log(`[FFMPEG RUN] Spawned FFmpeg subtitles with command: ${commandLine}`);
              })
              .on('stdout', (data) => {
                ffmpegStdout += data + '\n';
              })
              .on('stderr', (data) => {
                ffmpegStderr += data + '\n';
              })
              .on('progress', (p) => {
                 updateTaskStep(taskId, 'subtitles', 'processing', Math.round(20 + (p.percent || 0) * 0.8));
              })
              .on('end', () => {
                 updateTaskStep(taskId, 'subtitles', 'completed', 100, 'Captions rendered into video.');
                 console.log(`[FFMPEG STDOUT]:\n${ffmpegStdout}`);
                 console.log(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
                 
                 // 6. Verify FFmpeg successfully creates the rendered video
                 if (fs.existsSync(videoWithSubsPath)) {
                   const renderedSize = fs.statSync(videoWithSubsPath).size;
                   console.log(`[DEBUG] [${taskId}] Rendered video created successfully. Path: ${videoWithSubsPath}, Size: ${renderedSize} bytes.`);
                   if (renderedSize === 0) {
                     reject(new Error("FFmpeg completed but the output rendered video is 0 bytes."));
                   } else {
                     resolve(null);
                   }
                 } else {
                   reject(new Error("FFmpeg completed but the output rendered video was not created."));
                 }
              })
              .on('error', (err) => {
                 console.error(`[EXPORT] [${taskId}] FFmpeg subtitles burn error:`, err);
                 console.error(`[FFMPEG COMMAND]: ${ffmpegCommand}`);
                 console.error(`[FFMPEG STDERR]:\n${ffmpegStderr}`);
                 const realErrorMsg = `FFmpeg subtitle burn failed. Error: ${err.message}. Stderr: ${ffmpegStderr}`;
                 // 9. Stop the pipeline and display the real FFmpeg error instead of marking the step completed
                 updateTaskStep(taskId, 'subtitles', 'failed', 0, realErrorMsg);
                 (err as any).ffmpegCommand = ffmpegCommand;
                 (err as any).ffmpegStderr = ffmpegStderr;
                 (err as any).ffmpegStdout = ffmpegStdout;
                 reject(new Error(realErrorMsg));
              });

            proc.run();
          });

          // Extra validation to ensure output is not empty or missing
          if (!fs.existsSync(videoWithSubsPath) || fs.statSync(videoWithSubsPath).size === 0) {
            const renderErr = new Error(`Rendered video file is empty or missing after subtitle embedding!`);
            updateTaskStep(taskId, 'subtitles', 'failed', 0, renderErr.message);
            throw renderErr;
          }

          // 7. Compare the original video path and the rendered video path
          // 10. Add logging showing: Input video, Subtitle file, Output rendered video, Uploaded video path
          console.log(`[DEBUG] [${taskId}] --- SUBTITLE EMBEDDING VERIFICATION ---`);
          console.log(`- Input video: ${tempPath} (${fs.statSync(tempPath).size} bytes)`);
          console.log(`- Subtitle file: ${subsPath} (${subsStat.size} bytes)`);
          console.log(`- Output rendered video: ${videoWithSubsPath} (${fs.statSync(videoWithSubsPath).size} bytes)`);
          console.log(`- Uploaded video path: ${videoWithSubsPath}`);
          console.log(`-----------------------------------------------`);

          // 8. Ensure YouTube uploads the rendered video with subtitles, not the original cropped video
          uploadVideoPath = videoWithSubsPath;
          console.log(`[DEBUG] [${taskId}] Final video path for upload: ${uploadVideoPath}`);
        } else {
          const emptyWordsErr = new Error(`AI Subtitles enabled but no words transcribed. Aborting pipeline.`);
          console.error(`[EXPORT] [${taskId}] ${emptyWordsErr.message}`);
          updateTaskStep(taskId, 'transcribe', 'failed', 0, emptyWordsErr.message);
          throw emptyWordsErr;
        }
      }

      // 5. Upload the cropped clip to YouTube
      console.log(`[EXPORT] [${taskId}] Stage: Export. Uploading clip to YouTube...`);
      currentStage = 'Export';
      suggestedSolution = 'YouTube upload failed. Make sure your YouTube channel connection is valid and you have not exceeded your daily upload limits.';
      
      updateTaskStep(taskId, 'upload', 'processing', 10, 'Initializing YouTube upload...');
      
      const uploadPayload = {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: clip.title,
            description: clip.description,
            tags: clip.tags,
          },
          status: {
            privacyStatus: 'public', // Updated to public
          },
        },
        media: {
          body: fs.createReadStream(uploadVideoPath),
        },
      };
      
      console.log(`[EXPORT] [${taskId}] YouTube API Request Payload:`, JSON.stringify(uploadPayload, null, 2));

      const response = await youtube.videos.insert(uploadPayload as any);

      console.log(`[EXPORT] [${taskId}] YouTube upload completed successfully. Video ID: ${response.data.id}, Privacy Status: ${response.data.status?.privacyStatus}`);
      if (response.data.status?.privacyStatus !== 'public') {
         console.warn(`[EXPORT] [${taskId}] WARNING: Video uploaded but privacy status is not public: ${response.data.status?.privacyStatus}`);
      }

      updateTaskStep(taskId, 'upload', 'completed', 100, `Video published to YouTube (ID: ${response.data.id}, Privacy: ${response.data.status?.privacyStatus}).`);
      pipelineStats.currentlyProcessing = Math.max(0, pipelineStats.currentlyProcessing - 1);
      
      res.json({ success: true, videoId: response.data.id });
    } catch (error: any) {
      console.error(`[EXPORT] [${taskId}] Clip processing failed at stage [${currentStage}]:`, error);
      updateTaskStep(taskId, 'upload', 'failed', 0, `Process failed at ${currentStage}: ${error.message}`);
      pipelineStats.currentlyProcessing = Math.max(0, pipelineStats.currentlyProcessing - 1);
      
      return sendDetailedError(
        res,
        error,
        currentStage,
        `Failed to process and upload clip during stage '${currentStage}'`,
        suggestedSolution
      );
    } finally {
      // 6. Clean up temporary files
      console.log(`[CLEANUP] [${taskId}] Running temporary files cleanup...`);
      const filesToClean = [tempPath, audioPath, subsPath, videoWithSubsPath, rawPath, channelNamePath, clipTitlePath];
      for (const filePath of filesToClean) {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[CLEANUP] [${taskId}] Cleaned up: ${filePath}`);
          } catch (cleanErr: any) {
            console.error(`[CLEANUP] [${taskId}] Failed to clean up file ${filePath}:`, cleanErr.message || cleanErr);
          }
        }
      }
    }
  });

  // Projects Endpoints
  app.get('/api/projects', async (req, res) => {
    try {
      const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const doc = await db.collection('projects').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const docRef = await db.collection('projects').add({
        ...req.body,
        createdAt: FieldValue.serverTimestamp(),
      });
      const newDoc = await docRef.get();
      res.json({ id: newDoc.id, ...newDoc.data() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // Uploads Endpoints
  app.get('/api/uploads', async (req, res) => {
    try {
      const snapshot = await db.collection('uploads').orderBy('createdAt', 'desc').get();
      const uploads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch uploads' });
    }
  });

  app.post('/api/uploads', upload.single('file'), async (req, res) => {
    console.log('[UPLOAD] Received local file upload request...');
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          stage: "Upload",
          error: "No file was uploaded.",
          solution: "Please select a valid video file to upload."
        });
      }

      // Validate size (max 500MB)
      const MAX_SIZE = 500 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          stage: "Upload",
          error: `File size exceeds the limit of 500MB (actual size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
          solution: "Please upload a smaller video clip or compress your video."
        });
      }

      // Validate mimetype/extension
      const validMimetypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/x-msvideo', 'video/webm'];
      const ext = path.extname(file.originalname).toLowerCase();
      const validExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
      
      if (!validMimetypes.includes(file.mimetype) && !validExtensions.includes(ext)) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          stage: "Upload",
          error: `Invalid file format: ${file.mimetype || ext}. Only standard video formats are allowed.`,
          solution: "Please upload a valid video format (e.g., .mp4, .mov, .mkv, .webm)."
        });
      }

      console.log(`[UPLOAD] File validated successfully. Path: ${file.path}. Creating DB record...`);
      const fileUrl = `/uploads/${file.filename}`;

      const docRef = await db.collection('uploads').add({
        title: req.body.title || file.originalname,
        status: 'Processed',
        date: new Date().toISOString(),
        views: '0',
        fileUrl,
        createdAt: FieldValue.serverTimestamp(),
      });
      
      const newDoc = await docRef.get();
      res.json({ id: newDoc.id, ...newDoc.data() });
    } catch (error: any) {
      console.error('[UPLOAD] File upload failed:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return sendDetailedError(
        res,
        error,
        "Upload",
        "Failed to save and index uploaded video file",
        "Please check if the container has write permissions to 'uploads/' and has enough storage disk space."
      );
    }
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
        const rawAiKey = customConfig.AUTOMATION_GEMINI_API_KEY || customConfig.GEMINI_API_KEY;
        const aiKey = getCleanGeminiApiKey(rawAiKey);

        if (aiKey) {
          try {
            const genAI = new GoogleGenAI({ apiKey: aiKey });
            const prompt = `You are an expert YouTube SEO optimizer. I have a video with the following title and description:
            Title: ${originalTitle}
            Description: ${originalDesc}
            
            Please generate a viral title, an SEO-friendly description, and 15 trending tags.
            Return JSON format: { "title": "...", "description": "...", "tags": ["tag1", "tag2", ...] }`;

            const result = await genAI.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: { responseMimeType: "application/json" }
            });
            
            const seoData = JSON.parse(result.text || '{}');
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

  async function downloadFullVideoWithYtDlp(videoUrl: string, destinationPath: string, cookiesStr?: string): Promise<boolean> {
    const ytDlpPath = path.join(process.cwd(), 'yt-dlp');
    if (!fs.existsSync(ytDlpPath)) {
      console.warn('[DOWNLOAD-FULL] yt-dlp not found at path:', ytDlpPath);
      return false;
    }
    let cookieFilePath: string | null = null;
    try {
      console.log(`[DOWNLOAD-FULL] Downloading full video using yt-dlp: ${videoUrl}`);
      let cookieArg = '';
      if (cookiesStr && cookiesStr.trim().length > 0) {
        cookieFilePath = path.join(process.cwd(), 'uploads', `cookies-full-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.txt`);
        fs.writeFileSync(cookieFilePath, cookiesStr, 'utf8');
        cookieArg = `--cookies "${cookieFilePath}"`;
      }

      // best MP4 stream or fallback to best
      const formatArg = '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
      const cmd = `"${ytDlpPath}" ${formatArg} --js-runtimes node ${cookieArg} -o "${destinationPath}" "${videoUrl}"`;
      
      await execAsync(cmd);
      if (fs.existsSync(destinationPath) && fs.statSync(destinationPath).size > 0) {
        console.log(`[DOWNLOAD-FULL] Video downloaded successfully: ${destinationPath}`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[DOWNLOAD-FULL] yt-dlp download failed:', err.message || err);
      return false;
    } finally {
      if (cookieFilePath && fs.existsSync(cookieFilePath)) {
        try {
          fs.unlinkSync(cookieFilePath);
        } catch (unlinkErr) {}
      }
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
      
      // Simple YouTube download using yt-dlp with fallback to ytdl-core
      if (downloadUrl.includes('youtube.com') || downloadUrl.includes('youtu.be')) {
        console.log(`[PROCESS-TASK] downloading YouTube video: ${downloadUrl}`);
        let dlSuccess = false;
        try {
          dlSuccess = await downloadFullVideoWithYtDlp(downloadUrl, tempPath, customConfig.YTDL_COOKIES);
        } catch (ytDlpErr) {
          console.error('[PROCESS-TASK] yt-dlp threw exception:', ytDlpErr);
        }

        if (!dlSuccess) {
          console.log('[PROCESS-TASK] yt-dlp download failed, falling back to ytdl stream...');
          await new Promise((resolve, reject) => {
            const stream = ytdl(downloadUrl, { filter: 'audioandvideo', quality: 'highest' });
            const fileStream = fs.createWriteStream(tempPath);
            stream.pipe(fileStream);
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
          });
        }
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
          const result = await genAI.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: seoPrompt }] }],
            config: { responseMimeType: "application/json" }
          });
          const responseText = result.text || '{}';
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
