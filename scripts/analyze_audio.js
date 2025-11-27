const fs = require('fs');
const path = require('path');

// Paths
const SAMPLES_DIR = path.join(__dirname, '../audioMP3s/audio');
const FULL_TRACKS_DIR = path.join(__dirname, '../audio_full_tracks');
const REPORT_FILE = path.join(__dirname, '../audio_analysis_report.md');

// Common Thai Translations (The "Learning" Part)
const COMMON_TRANSLATIONS = {
    'Good News': 'ข่าวดี',
    'Words of Life': 'ถ้อยคำแห่งชีวิต',
    'Words of Life 1': 'ถ้อยคำแห่งชีวิต 1',
    'Words of Life 2': 'ถ้อยคำแห่งชีวิต 2',
    'Jesus Story': 'เรื่องราวของพระเยซู',
    'Songs': 'เพลง',
    'Miracles of Jesus': 'การอัศจรรย์ของพระเยซู',
    'The Resurrection': 'การเป็นขึ้นมาจากความตาย',
    'Creation': 'การทรงสร้าง',
    'Noah': 'โนอาห์',
    'Do Not Be Afraid': 'อย่ากลัวเลย',
    'The Prodigal Son': 'บุตรน้อยหลงหาย',
    'The Lost Sheep': 'แกะที่หายไป',
    'Becoming a Friend of God': 'การเป็นเพื่อนกับพระเจ้า',
    'Picture': 'รูปภาพ',
    'The Birth of Jesus': 'การประสูติของพระเยซู',
    'Jesus Can Heal Your Soul': 'พระเยซูรักษาจิตใจท่านได้',
    'Fear Not': 'อย่ากลัวเลย',
    'How to Find Peace': 'จะหาความสันติสุขได้อย่างไร',
    'True Words About God': 'ถ้อยคำจริงเกี่ยวกับพระเจ้า',
    'Victory through GOD': 'ชัยชนะโดยพระเจ้า'
};

// Helper to parse filenames
// Expected Sample Format: Language.ProgramID.mp3 (e.g., Akeu.1148.mp3)
// Expected Full Track Format: Language [Title] [M-Code] [Title] [ProgramID].mp3
function parseSampleFilename(filename) {
    const parts = filename.replace('.mp3', '').split('.');
    const programId = parts.pop(); // Last part is usually ID
    const language = parts.join(' '); // Rest is language
    return { filename, language, programId };
}

function parseFullTrackFilename(filename) {
    // Try to find Program ID (5 digits at end usually)
    const idMatch = filename.match(/(\d{5})/);
    const programId = idMatch ? idMatch[1] : null;
    
    // Try to extract language (start of string)
    // This is heuristic as filenames vary wildly
    let language = 'Unknown';
    let titleEn = filename.replace('.mp3', '');
    
    // Simple heuristic: First word(s) before "Good News" or "Words of Life" etc.
    const splitters = ['Good News', 'Words of Life', 'Jesus Story', 'Becoming a Friend of God', 'LLL', 'Songs'];
    for (const splitter of splitters) {
        if (filename.includes(splitter)) {
            language = filename.split(splitter)[0].trim();
            break;
        }
    }
    
    return { filename, language, programId, titleEn };
}

function guessThaiTitle(englishTitle) {
    let thaiTitle = englishTitle;
    let hasTranslation = false;

    // Replace known phrases
    for (const [en, th] of Object.entries(COMMON_TRANSLATIONS)) {
        if (thaiTitle.includes(en)) {
            thaiTitle = thaiTitle.replace(en, th);
            hasTranslation = true;
        }
    }
    
    return hasTranslation ? thaiTitle : null;
}

async function analyze() {
    console.log('Reading directories...');
    
    let samples = [];
    try {
        samples = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.mp3'));
    } catch (e) {
        console.error('Error reading samples dir:', e.message);
    }

    let fullTracks = [];
    try {
        fullTracks = fs.readdirSync(FULL_TRACKS_DIR).filter(f => f.endsWith('.mp3'));
    } catch (e) {
        console.error('Error reading full tracks dir:', e.message);
    }

    console.log(`Found ${samples.length} samples and ${fullTracks.length} full tracks.`);

    const parsedSamples = samples.map(parseSampleFilename);
    const parsedFullTracks = fullTracks.map(parseFullTrackFilename);

    const matches = [];
    const missingThai = [];
    const toughOnes = [];
    const orphans = []; // Samples with no full track match

    // 1. Match Full Tracks to Samples
    parsedFullTracks.forEach(track => {
        // Try to match by Language Name first (since IDs might differ)
        // Normalize names for better matching (remove spaces, lowercase)
        const trackLangNorm = track.language.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const match = parsedSamples.find(s => {
            const sampleLangNorm = s.language.toLowerCase().replace(/[^a-z0-9]/g, '');
            return sampleLangNorm === trackLangNorm || s.language.includes(track.language) || track.language.includes(s.language);
        });
        
        if (match) {
            // Check for Thai translation
            const thaiGuess = guessThaiTitle(track.titleEn);
            
            matches.push({
                language: match.language, // Use the sample's language name for consistency
                sampleId: match.programId,
                fullTrackId: track.programId,
                sampleFile: match.filename,
                fullTrackFile: track.filename,
                thaiTitle: thaiGuess || 'MISSING',
                isIdMismatch: match.programId !== track.programId
            });

            if (!thaiGuess) {
                missingThai.push(track);
            }
        } else {
            // No Language match? It's a "Tough One"
            toughOnes.push(track);
        }
    });

    // 2. Find Orphans
    parsedSamples.forEach(sample => {
        const hasMatch = parsedFullTracks.some(t => t.programId === sample.programId);
        if (!hasMatch) {
            orphans.push(sample);
        }
    });

    // 3. Generate Report
    let report = `# Audio Analysis Report\n\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    report += `## Summary\n`;
    report += `- **Total Samples**: ${samples.length}\n`;
    report += `- **Total Full Tracks**: ${fullTracks.length}\n`;
    report += `- **Matches Found**: ${matches.length} (Ready to Replace)\n`;
    report += `- **Missing Thai Translations**: ${missingThai.length}\n`;
    report += `- **Unmatched Full Tracks (Tough Ones)**: ${toughOnes.length}\n`;
    report += `- **Orphan Samples (No Full Track)**: ${orphans.length}\n\n`;

    report += `## 1. Ready to Replace (Matches)\n`;
    report += `These full tracks matched existing samples by Language Name.\n\n`;
    report += `| Language | Sample ID | Full Track ID | ID Match? | Sample File | Full Track File | Thai Title Guess |\n`;
    report += `|---|---|---|---|---|---|---|\n`;
    matches.forEach(m => {
        const thaiStatus = m.thaiTitle === 'MISSING' ? '❌ MISSING' : `✅ ${m.thaiTitle}`;
        const idStatus = m.isIdMismatch ? '⚠️ DIFFERENT' : '✅ SAME';
        report += `| ${m.language} | ${m.sampleId} | ${m.fullTrackId || 'N/A'} | ${idStatus} | \`${m.sampleFile}\` | \`${m.fullTrackFile}\` | ${thaiStatus} |\n`;
    });
    report += `\n`;

    report += `## 2. Missing Thai Translations\n`;
    report += `These matched files need a Thai title. I couldn't auto-translate them.\n\n`;
    missingThai.forEach(t => {
        report += `- **${t.filename}** (ID: ${t.programId})\n`;
    });
    report += `\n`;

    report += `## 3. The "Tough Ones" (Unmatched Full Tracks)\n`;
    report += `I couldn't match these to an existing sample ID. They might be new content or have different IDs.\n\n`;
    toughOnes.forEach(t => {
        report += `- **${t.filename}** (ID: ${t.programId || 'Unknown'})\n`;
    });
    report += `\n`;

    report += `## 4. Orphan Samples\n`;
    report += `We have samples for these, but no full track was provided.\n\n`;
    orphans.forEach(s => {
        report += `- **${s.language}** (ID: ${s.programId}) - \`${s.filename}\`\n`;
    });

    fs.writeFileSync(REPORT_FILE, report);
    console.log(`Report generated at: ${REPORT_FILE}`);
}

analyze();
