import fs from 'fs';

interface SubtitleStyle {
  name: string;
  font: string;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  backColor: string;
  outline: number;
  shadow: number;
  alignment: number;
  marginV: number;
  animationTagStart: string;
  animationTagEnd: string;
}

const stylesConfig: Record<string, SubtitleStyle> = {
  mrbeast: {
    name: 'MrBeast',
    font: 'Arial Black',
    fontSize: 125,
    primaryColor: '&H00FFFFFF', // White
    outlineColor: '&H00000000', // Black
    backColor: '&H80000000', // Semi-transparent black
    outline: 10,
    shadow: 2,
    alignment: 8, // Top Center
    marginV: 750, // ~40% from top
    animationTagStart: '{\\fad(200,200)}',
    animationTagEnd: ''
  },
  hormozi: {
    name: 'Hormozi',
    font: 'Impact',
    fontSize: 85,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&H00000000',
    outline: 4,
    shadow: 0,
    alignment: 5, // Center Middle
    marginV: 0,
    animationTagStart: '{\\fscx0\\fscy0\\t(0,150,\\fscx110\\fscy110)\\t(150,250,\\fscx100\\fscy100)}',
    animationTagEnd: ''
  },
  gaming: {
    name: 'Gaming',
    font: 'Trebuchet MS',
    fontSize: 75,
    primaryColor: '&H0000FF00', // Green
    outlineColor: '&H00000000',
    backColor: '&H80000000',
    outline: 5,
    shadow: 8,
    alignment: 2,
    marginV: 150,
    animationTagStart: '{\\fad(50,50)}',
    animationTagEnd: ''
  },
  podcast: {
    name: 'Podcast',
    font: 'Verdana',
    fontSize: 60,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00444444',
    backColor: '&H80000000',
    outline: 2,
    shadow: 2,
    alignment: 2,
    marginV: 200,
    animationTagStart: '{\\fad(100,100)}',
    animationTagEnd: ''
  },
  minimal: {
    name: 'Minimal',
    font: 'Helvetica',
    fontSize: 55,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&H00000000',
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginV: 100,
    animationTagStart: '',
    animationTagEnd: ''
  },
  custom: {
    name: 'Custom',
    font: 'Arial',
    fontSize: 80,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&H80000000',
    outline: 6,
    shadow: 4,
    alignment: 2,
    marginV: 200,
    animationTagStart: '',
    animationTagEnd: ''
  }
};

const getHighlightColor = (word: string) => {
    // Basic heuristics for important words
    const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isNumber = /^\d+$/.test(lower);
    const hasCurrency = /[$€£¥₹]/.test(word);
    const isQuestion = /\?/.test(word);
    const isExclamation = /!/.test(word);
    
    if (isNumber || hasCurrency) return '&H0000FF00&'; // Green for money/numbers
    if (isQuestion) return '&H00FF00FF&'; // Purple/Magenta for questions
    if (isExclamation) return '&H000000FF&'; // Red for exclamation/warning
    if (lower === 'yes' || lower === 'right') return '&H0000FF00&'; // Green
    if (lower === 'no' || lower === 'stop') return '&H000000FF&'; // Red
    if (word[0] === word[0].toUpperCase() && lower.length > 2) return '&H00FFFF00&'; // Cyan for Names/Proper Nouns
    
    return '&H0000FFFF&'; // Default Yellow BGR: 00FFFF
};

const getEmoji = (word: string) => {
    const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lower === 'money' || lower === 'cash' || lower === 'dollars') return '💰';
    if (lower === 'fire' || lower === 'hot' || lower === 'amazing') return '🔥';
    if (lower === 'crazy' || lower === 'wow' || lower === 'omg') return '😱';
    if (lower === 'success' || lower === 'win' || lower === 'yes') return '✅';
    if (lower === 'warning' || lower === 'careful' || lower === 'stop') return '⚠️';
    if (lower === 'rocket' || lower === 'moon' || lower === 'up') return '🚀';
    if (lower === 'love' || lower === 'heart') return '❤️';
    return '';
};

export function generateASSSubtitles(words: any[], filename: string, styleKey: string = 'mrbeast', useEmojis: boolean = false) {
    const styleObj = stylesConfig[styleKey] || stylesConfig['mrbeast'];

    const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${styleObj.font},${Math.round(styleObj.fontSize * 1.2)},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,0,2,50,50,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    let assEvents = '';

    const formatTime = (timeSec: number) => {
        const d = new Date(timeSec * 1000);
        const h = String(d.getUTCHours()).padStart(1, '0');
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        const s = String(d.getUTCSeconds()).padStart(2, '0');
        const ms = String(d.getUTCMilliseconds()).padStart(3, '0').substring(0, 2);
        return `${h}:${m}:${s}.${ms}`;
    };

    let currentChunk = [];
    let chunks = [];
    
    // Auto line breaking: 2-5 words
    for(let i = 0; i < words.length; i++) {
        currentChunk.push(words[i]);
        let nextWord = words[i+1];
        // Break if we hit 4 words, or if there is a silence > 0.5s, or end of sentence punctuation
        const wordText = words[i].word || '';
        const hasPunctuation = /[.!?]/.test(wordText);
        
        if (currentChunk.length >= 4 || hasPunctuation || (nextWord && (nextWord.start - words[i].end > 0.5))) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    chunks.forEach(chunk => {
        if (chunk.length === 0) return;
        
        for (let i = 0; i < chunk.length; i++) {
            const wordEventStart = formatTime(chunk[i].start);
            // Silence detection: End time of highlight is exactly word end time + small buffer, unless next word is immediate
            let wordEventEnd = formatTime(chunk[i].end + 0.1); 
            if (i < chunk.length - 1) {
              const gap = chunk[i+1].start - chunk[i].end;
              if (gap < 0.2) {
                  wordEventEnd = formatTime(chunk[i+1].start);
              }
            }
            
            let textLine = '';
            for (let j = 0; j < chunk.length; j++) {
                let w = chunk[j].word.trim();
                let emoji = useEmojis ? getEmoji(w) : '';
                
                if (j === i) {
                   const highlightColor = getHighlightColor(w);
                   textLine += `{\\c${highlightColor}}{\\b1}${styleObj.animationTagStart}${w}${emoji}${styleObj.animationTagEnd}{\\b0}{\\c&H00FFFFFF&} `;
                } else {
                   textLine += `${w} `;
                }
            }
            assEvents += `Dialogue: 0,${wordEventStart},${wordEventEnd},Default,,0,0,0,,${textLine.trim()}\n`;
        }
    });

    fs.writeFileSync(filename, assHeader + assEvents);
}
