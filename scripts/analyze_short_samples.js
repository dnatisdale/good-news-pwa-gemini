const fs = require('fs');
const path = require('path');
const getMP3Duration = require('mp3-duration');

const AUDIO_DIR = path.join(__dirname, '../public/audio');

async function analyze() {
    console.log('Scanning for short audio samples (<= 17s)...');
    
    const files = fs.readdirSync(AUDIO_DIR);
    const shortFiles = [];

    for (const file of files) {
        if (!file.endsWith('.mp3')) continue;
        const filePath = path.join(AUDIO_DIR, file);
        
        try {
            const duration = await getMP3Duration(filePath);
            if (duration <= 17) {
                 // console.log(`${file}: ${duration.toFixed(2)}s`);
                 shortFiles.push({ file, duration });
            }
        } catch (e) {
            console.error(`Error reading ${file}: ${e.message}`);
        }
    }

    console.log(`Found ${shortFiles.length} short files.`);
    console.log(JSON.stringify(shortFiles, null, 2));
    
    // Write list to a temp file for the python script to digest
    fs.writeFileSync(path.join(__dirname, 'short_samples_list.json'), JSON.stringify(shortFiles, null, 2));
}

analyze();
