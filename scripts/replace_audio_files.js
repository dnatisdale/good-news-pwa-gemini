const fs = require('fs');
const path = require('path');

// Paths
const SAMPLES_DIR = path.join(__dirname, '../audioMP3s/audio');
const FULL_TRACKS_DIR = path.join(__dirname, '../audio_full_tracks');
const BACKUP_DIR = path.join(__dirname, '../audioMP3s/backup');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Helper to parse filenames (Reused from analyze_audio.js)
function parseSampleFilename(filename) {
    const parts = filename.replace('.mp3', '').split('.');
    const programId = parts.pop();
    const language = parts.join(' ');
    return { filename, language, programId };
}

function parseFullTrackFilename(filename) {
    const idMatch = filename.match(/(\d{5})/);
    const programId = idMatch ? idMatch[1] : null;
    let language = 'Unknown';
    const splitters = ['Good News', 'Words of Life', 'Jesus Story', 'Becoming a Friend of God', 'LLL', 'Songs'];
    for (const splitter of splitters) {
        if (filename.includes(splitter)) {
            language = filename.split(splitter)[0].trim();
            break;
        }
    }
    return { filename, language, programId };
}

async function replaceFiles() {
    console.log('Starting Audio Replacement Process...');
    
    const samples = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.mp3'));
    const fullTracks = fs.readdirSync(FULL_TRACKS_DIR).filter(f => f.endsWith('.mp3'));
    
    const parsedSamples = samples.map(parseSampleFilename);
    const parsedFullTracks = fullTracks.map(parseFullTrackFilename);
    
    let replacedCount = 0;
    let errorCount = 0;

    // Iterate through full tracks and find matches
    parsedFullTracks.forEach(track => {
        // Match logic: Language Name (normalized)
        const trackLangNorm = track.language.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const match = parsedSamples.find(s => {
            const sampleLangNorm = s.language.toLowerCase().replace(/[^a-z0-9]/g, '');
            return sampleLangNorm === trackLangNorm || s.language.includes(track.language) || track.language.includes(s.language);
        });

        if (match) {
            const sourcePath = path.join(FULL_TRACKS_DIR, track.filename);
            const destPath = path.join(SAMPLES_DIR, match.filename); // Keep original filename!
            const backupPath = path.join(BACKUP_DIR, match.filename);

            try {
                // 1. Backup original
                if (fs.existsSync(destPath)) {
                    fs.copyFileSync(destPath, backupPath);
                }

                // 2. Overwrite with new file
                fs.copyFileSync(sourcePath, destPath);
                
                console.log(`✅ Replaced: ${match.filename}`);
                console.log(`   Source: ${track.filename}`);
                replacedCount++;
            } catch (err) {
                console.error(`❌ Error replacing ${match.filename}:`, err.message);
                errorCount++;
            }
        }
    });

    console.log('\n--- Replacement Summary ---');
    console.log(`Total Files Replaced: ${replacedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Backups saved to: ${BACKUP_DIR}`);
}

replaceFiles();
