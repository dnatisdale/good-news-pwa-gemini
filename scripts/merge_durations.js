const fs = require('fs');
const path = require('path');

// Input files
const DURATIONS_FILE = path.join(__dirname, 'audio_durations.json');
const STATIC_CONTENT_FILE = path.join(__dirname, '..', 'src', 'data', 'staticContent.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'staticContent.js');

/**
 * Extract filename from sampleUrl
 * e.g., "/audio/Akeu.1148.mp3" => "Akeu.1148.mp3"
 */
function extractFilename(sampleUrl) {
  if (!sampleUrl) return null;
  const parts = sampleUrl.split('/');
  return parts[parts.length - 1];
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Merging Audio Durations into staticContent.js');
  console.log('==================================================\n');

  // Load durations
  const durations = JSON.parse(fs.readFileSync(DURATIONS_FILE, 'utf8'));
  console.log(`✅ Loaded ${Object.keys(durations).length} durations\n`);

  // Load staticContent.js
  const staticContentRaw = fs.readFileSync(STATIC_CONTENT_FILE, 'utf8');
  
  // Parse the export statement to get the array
  const match = staticContentRaw.match(/export const staticContent = (\[[\s\S]*\]);/);
  if (!match) {
    console.error('❌ ERROR: Could not parse staticContent.js');
    process.exit(1);
  }

  const staticContent = JSON.parse(match[1]);
  console.log(`✅ Loaded ${staticContent.length} content items\n`);

  // Merge durations
  let matched = 0;
  let notMatched = 0;

  staticContent.forEach(item => {
    const filename = extractFilename(item.sampleUrl);
    if (filename && durations[filename]) {
      item.duration = durations[filename];
      matched++;
    } else {
      notMatched++;
    }
  });

  console.log(`✅ Matched ${matched} items with durations`);
  console.log(`⚠️  ${notMatched} items without duration data\n`);

  // Write back to file
  const output = `// This file was automatically generated from your CSV data on your_content_data.csv.\nexport const staticContent = ${JSON.stringify(staticContent, null, 2)};\n`;
  
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  console.log(`✅ Done! Updated staticContent.js`);
  console.log(`   File: ${OUTPUT_FILE}`);
  console.log('\nNext step: Update ContentCard to use item.duration instead of loading dynamically');
}

main();
