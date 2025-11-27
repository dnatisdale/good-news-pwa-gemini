const fs = require('fs');
const path = require('path');
const mp3Duration = require('mp3-duration');
const util = require('util');

// Promisify mp3Duration
const getDuration = util.promisify(mp3Duration);

// Folders to scan
const AUDIO_FOLDERS = [
  'C:\\GitHub\\good-news-pwa-gemini\\audio_full_tracks',
  'C:\\GitHub\\good-news-pwa-gemini\\audioMP3s',
  'C:\\GitHub\\good-news-pwa-gemini\\audioMP3s\\audio'
];

// Output file
const OUTPUT_FILE = path.join(__dirname, 'audio_durations.json');

/**
 * Scan a folder for MP3 files and get their durations
 */
async function scanFolder(folderPath) {
  console.log(`\nScanning folder: ${folderPath}`);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`  ⚠️  Folder does not exist, skipping...`);
    return {};
  }

  const files = fs.readdirSync(folderPath);
  const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));
  
  console.log(`  Found ${mp3Files.length} MP3 files`);

  const durations = {};
  let processed = 0;
  let errors = 0;

  for (const file of mp3Files) {
    const filePath = path.join(folderPath, file);
    
    try {
      const duration = await getDuration(filePath);
      if (duration > 0) {
        durations[file] = Math.round(duration);
      }
    } catch (err) {
      console.error(`  ❌ Error reading ${file}: ${err.message}`);
      errors++;
    }
    
    processed++;
    if (processed % 20 === 0) {
      process.stdout.write(`  Processed ${processed}/${mp3Files.length}...\r`);
    }
  }

  console.log(`  ✅ Finished: ${Object.keys(durations).length} durations found (${errors} errors)`);
  return durations;
}

/**
 * Main function
 */
async function main() {
  console.log('🎵 Accurate Audio Duration Extractor');
  console.log('====================================\n');
  
  const allDurations = {};

  // Scan each folder
  for (const folder of AUDIO_FOLDERS) {
    const durations = await scanFolder(folder);
    Object.assign(allDurations, durations);
  }

  // Write results to JSON file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(allDurations, null, 2),
    'utf8'
  );

  console.log(`\n✅ Done! Durations saved to: ${OUTPUT_FILE}`);
  console.log(`   Total files processed: ${Object.keys(allDurations).length}`);
  
  // Show sample check for the file user mentioned
  const checkFile = "Akeu.1148.mp3";
  if (allDurations[checkFile]) {
    const d = allDurations[checkFile];
    const mins = Math.floor(d / 60);
    const secs = d % 60;
    console.log(`\n🔍 CHECK: ${checkFile} duration is ${d}s (${mins}:${secs.toString().padStart(2, '0')})`);
  }
}

main().catch(console.error);
