import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
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

let customConfig: Record<string, string> = {};
try {
  customConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (e) {
  // Ignore
}

const getAiClient = () => {
  const key = customConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set in settings or environment.');
  return new GoogleGenAI({ apiKey: key });
};

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

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
      ytdlCookies: customConfig.YTDL_COOKIES || '',
      groqApiKey: customConfig.GROQ_API_KEY || '',
      aiSubtitlesEnabled: customConfig.AI_SUBTITLES_ENABLED === 'true' || false,
      subtitleLanguage: customConfig.SUBTITLE_LANGUAGE || 'auto'
    });
  });

  app.post('/api/settings/global', (req, res) => {
    const { geminiApiKey, ytdlCookies, groqApiKey, aiSubtitlesEnabled, subtitleLanguage } = req.body;
    customConfig.GEMINI_API_KEY = geminiApiKey;
    customConfig.YTDL_COOKIES = ytdlCookies;
    customConfig.GROQ_API_KEY = groqApiKey;
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

  app.get('/api/auth/youtube/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const oauth2Client = getOauth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      
      res.cookie('yt_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.redirect('/app/editor');
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect('/app/editor?error=oauth_failed');
    }
  });

  app.get('/api/youtube/status', async (req, res) => {
    const tokens = req.cookies.yt_tokens ? JSON.parse(req.cookies.yt_tokens) : null;
    if (!tokens) {
      return res.json({ connected: false });
    }
    
    try {
      const oauth2Client = getOauth2Client();
      oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const response = await youtube.channels.list({ part: ['snippet'], mine: true });
      const channel = response.data.items?.[0];
      
      res.json({ 
        connected: true, 
        channel: channel ? {
          title: channel.snippet?.title,
          thumbnail: channel.snippet?.thumbnails?.default?.url
        } : null
      });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.post('/api/youtube/upload', upload.single('video'), async (req, res) => {
    const tokens = req.cookies.yt_tokens ? JSON.parse(req.cookies.yt_tokens) : null;
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
        res.cookie('yt_tokens', JSON.stringify(tokens), { httpOnly: true });
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
      const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate SEO metadata (title, tags, description) for a video with description: "${description}" and keywords: "${keywords}". Return JSON format: { "title": "...", "description": "...", "tags": ["..."] }`,
        config: {
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '{}'));
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

      const tokens = req.cookies.yt_tokens ? JSON.parse(req.cookies.yt_tokens) : null;
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

      const response = await getAiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const clips = JSON.parse(response.text || '[]');
      res.json({ clips, originalVideo: { title: videoTitle, id: videoId } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate clips' });
    }
  });

  app.post('/api/youtube/upload-clip', async (req, res) => {
    const { clip, videoUrl } = req.body;
    const tokens = req.cookies.yt_tokens ? JSON.parse(req.cookies.yt_tokens) : null;
    
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

    try {
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
        res.cookie('yt_tokens', JSON.stringify(tokens), { httpOnly: true });
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
      if (customConfig.AI_SUBTITLES_ENABLED === 'true' && customConfig.GROQ_API_KEY) {
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

          // Call Groq API
          const formData = new FormData();
          formData.append('file', fs.createReadStream(audioPath));
          formData.append('model', 'whisper-large-v3');
          formData.append('response_format', 'verbose_json');
          
          let lang = customConfig.SUBTITLE_LANGUAGE || 'auto';
          if (lang !== 'auto') {
            formData.append('language', lang);
          }

          const groqRes = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: {
              'Authorization': `Bearer ${customConfig.GROQ_API_KEY}`,
              ...formData.getHeaders(),
            }
          });

          if (groqRes.data && groqRes.data.words) {
            // Generate ASS file
            generateASSSubtitles(groqRes.data.words, subsPath);

            // Burn subtitles into video
            await new Promise((resolve, reject) => {
              ffmpeg(tempPath)
                .videoFilters(`ass='${subsPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`)
                .outputOptions(['-c:a copy']) // copy audio without re-encoding
                .output(videoWithSubsPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
            });

            uploadVideoPath = videoWithSubsPath;
          }
        } catch (subErr) {
          console.error("AI Subtitles Error:", subErr);
          // Fall back to original cropped video if subtitle fails
        }
      }

      // 5. Upload the cropped clip to YouTube
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

      res.json({ success: true, videoId: response.data.id });
    } catch (error) {
      console.error('Clip processing error:', error);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
