import fs from 'fs';

export function generateASSSubtitles(words: any[], filename: string) {
    const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,4,2,20,20,200,1

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
    
    for(let i = 0; i < words.length; i++) {
        currentChunk.push(words[i]);
        let nextWord = words[i+1];
        if (currentChunk.length >= 4 || (nextWord && (nextWord.start - words[i].end > 0.4))) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    chunks.forEach(chunk => {
        if (chunk.length === 0) return;
        
        for (let i = 0; i < chunk.length; i++) {
            const wordEventStart = formatTime(chunk[i].start);
            // End time of this highlight is either the end of the word or start of next word
            let wordEventEnd = formatTime(chunk[i].end);
            if (i < chunk.length - 1) {
              wordEventEnd = formatTime(chunk[i+1].start);
            }
            
            let textLine = '';
            for (let j = 0; j < chunk.length; j++) {
                let w = chunk[j].word.trim();
                if (j === i) {
                   textLine += `{\\c&H0000FFFF&}{\\b1}${w}{\\b0}{\\c&H00FFFFFF&} `; // Yellow text BGR: 00FFFF
                } else {
                   textLine += `${w} `;
                }
            }
            assEvents += `Dialogue: 0,${wordEventStart},${wordEventEnd},Default,,0,0,0,,${textLine.trim()}\n`;
        }
    });

    fs.writeFileSync(filename, assHeader + assEvents);
}
