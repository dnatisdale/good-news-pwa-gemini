const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/staticContent.js');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Extract the JSON array
  const jsonMatch = data.match(/export const staticContent = (\[[\s\S]*\]);/);
  if (!jsonMatch) {
    console.error("Could not find staticContent array");
    return;
  }

  const content = JSON.parse(jsonMatch[1]);
  
  // Fix each track's download URL
  const fixedContent = content.map(track => {
    if (track.trackDownloadUrl && track.trackDownloadUrl.includes('fivefish.org')) {
      // Extract program ID and track number from URL like "fivefish.org/T62808-001.mp3"
      const match = track.trackDownloadUrl.match(/T(\d+)-(\d+)\.mp3/);
      if (match) {
        const programId = match[1];
        const trackNum = parseInt(match[2], 10); // Remove leading zeros
        
        // Use the proper API endpoint
        track.trackDownloadUrl = `https://api.globalrecordings.net/files/track/mp3-low/${programId}/${trackNum}`;
        console.log(`Fixed: ${track.languageEn} - ${track.title_en} -> ${track.trackDownloadUrl}`);
      }
    }
    return track;
  });

  // Write back to file
  const newContent = `// This file was automatically generated from your CSV data on your_content_data.csv.\nexport const staticContent = ${JSON.stringify(fixedContent, null, 2)};\n`;
  
  fs.writeFile(filePath, newContent, 'utf8', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`\n✅ Successfully fixed ${fixedContent.length} track URLs!`);
      console.log("All fivefish.org URLs have been replaced with proper API endpoints.");
    }
  });
});
