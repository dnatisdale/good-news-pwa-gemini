const fs = require('fs');
const path = require('path');

// Folders to scan
const AUDIO_FOLDERS = [
  'C:\\GitHub\\good-news-pwa-gemini\\audio_full_tracks',
  'C:\\GitHub\\good-news-pwa-gemini\\audioMP3s',
  'C:\\GitHub\\good-news-pwa-gemini\\audioMP3s\\audio'
];

// Output file
const OUTPUT_FILE = path.join(__dirname, 'audio_durations.json');

/**
 * Get duration from MP3 file by reading the file header
 * This is a simple implementation that reads MP3 frame headers
 */
function getMP3Duration(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // Look for MP3 frame header
    let duration = 0;
    let offset = 0;
    let frameCount = 0;
    
    // Scan first 100KB to estimate duration (faster than full file scan)
    const scanLength = Math.min(buffer.length, 100000);
    
    while (offset < scanLength) {
      // Look for frame sync (11 bits set to 1)
      if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
        frameCount++;
        
        // Parse frame header to get frame length
        const version = (buffer[offset + 1] >> 3) & 0x03;
        const layer = (buffer[offset + 1] >> 1) & 0x03;
        const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0F;
        const samplingRateIndex = (buffer[offset + 2] >> 2) & 0x03;
        
        // Bitrate table (simplified for Layer III)
        const bitrateTable = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
        const samplingRateTable = [44100, 48000, 32000];
        
        const bitrate = bitrateTable[bitrateIndex] * 1000;
        const samplingRate = samplingRateTable[samplingRateIndex];
        
        if (bitrate > 0 && samplingRate > 0) {
          // Calculate frame length
          const frameLength = Math.floor((144 * bitrate) / samplingRate);
          offset += frameLength;
        } else {
          offset++;
        }
      } else {
        offset++;
      }
    }
    
    // Estimate total duration based on file size and average bitrate
    if (frameCount > 0) {
      const avgFrameSize = scanLength / frameCount;
      const totalFrames = buffer.length / avgFrameSize;
      // Each frame is ~0.026 seconds for MP3
      duration = Math.round(totalFrames * 0.026);
    }
    
    return duration > 0 ? duration : null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Scan a folder for MP3 files and get their durations
 */
function scanFolder(folderPath) {
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

  for (const file of mp3Files) {
    const filePath = path.join(folderPath, file);
    const duration = getMP3Duration(filePath);
    
    if (duration !== null) {
      durations[file] = duration;
      processed++;
      
      // Progress indicator
      if (processed % 10 === 0) {
        console.log(`  Processed ${processed}/${mp3Files.length} files...`);
      }
    }
  }

  console.log(`  ✅ Successfully processed ${processed}/${mp3Files.length} files`);
  return durations;
}

/**
 * Main function
 */
function main() {
  console.log('🎵 Audio Duration Extractor (No Dependencies)');
  console.log('==============================================\n');
  
  const allDurations = {};

  // Scan each folder
  for (const folder of AUDIO_FOLDERS) {
    const durations = scanFolder(folder);
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
  console.log('\nSample durations:');
  
  // Show first 5 durations as examples
  const samples = Object.entries(allDurations).slice(0, 5);
  samples.forEach(([file, duration]) => {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    console.log(`   ${file}: ${mins}:${secs.toString().padStart(2, '0')}`);
  });
  
  console.log('\nNext step: Review audio_durations.json and merge into staticContent.js');
}

main();
