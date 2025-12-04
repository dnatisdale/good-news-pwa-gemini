import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_CONTENT_PATH = path.join(__dirname, '../src/data/staticContent.js');

// Helper to fetch URL content
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
};

// Helper to extract YouTube link from HTML
const extractYouTubeUrl = (html) => {
  // Look for "Watch on YouTube" link
  // Pattern: <a href="https://www.youtube.com/..." ...>Watch on YouTube</a>
  // Or just any youtube link in the downloads section
  const regex = /href=['"](https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^'"]+)['"]/i;
  const match = html.match(regex);
  return match ? match[1] : null;
};

async function main() {
  console.log('Reading staticContent.js...');
  let content = fs.readFileSync(STATIC_CONTENT_PATH, 'utf8');

  // Extract the array part (hacky but works for this file structure)
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1) {
    console.error('Could not parse staticContent.js');
    return;
  }

  // Evaluate the array to get objects
  // We can't just JSON.parse because it's JS code (export const ...).
  // We'll use a safer approach: regex to find IDs and insert keys.
  // Actually, let's just use the regex to find programIds and update the file text directly.
  
  // Find all unique program IDs
  const programIdRegex = /"programId":\s*"(\d+)"/g;
  let match;
  const programIds = new Set();
  while ((match = programIdRegex.exec(content)) !== null) {
    programIds.add(match[1]);
  }

  console.log(`Found ${programIds.size} unique programs.`);

  let updatedContent = content;
  let count = 0;

  for (const pid of programIds) {
    console.log(`Checking Program ${pid}...`);
    
    // Check if we already have a video URL for this program (simple string check)
    // This is a bit loose, but prevents re-fetching if we run multiple times
    // We'll skip this check to ensure we get the latest, or we can check if the file already has languageVideoUrl for this ID.
    
    try {
      const url = `https://globalrecordings.net/en/program/${pid}`;
      const html = await fetchUrl(url);
      const youtubeUrl = extractYouTubeUrl(html);

      if (youtubeUrl) {
        console.log(`  Found YouTube URL: ${youtubeUrl}`);
        
        // Update the file content
        // We look for the block containing this programId and add the key if missing
        // This regex matches the object block for this programId
        // It's tricky with regex. 
        // Alternative: Read file, eval it (unsafe?), or just string replace.
        
        // Let's try a safer string replacement.
        // We'll look for `"programId": "PID"` and append the youtubeUrl after it if it's not there.
        
        const pidPattern = `"programId": "${pid}"`;
        const replacement = `"programId": "${pid}",\n    "languageVideoUrl": "${youtubeUrl}"`;
        
        // Only replace if languageVideoUrl doesn't already exist for this item
        // We need to be careful not to replace it if it's already there.
        // We'll check if the file contains languageVideoUrl near this programId.
        
        // Actually, let's just do a global replace for this PID if it doesn't have the tag yet.
        // We can check if the line after programId is NOT languageVideoUrl.
        
        if (!updatedContent.includes(`"languageVideoUrl": "${youtubeUrl}"`)) {
           // We'll replace `"programId": "PID"` with `"programId": "PID", "languageVideoUrl": "..."`
           // But we need to handle the comma.
           // Usually lines end with comma.
           
           updatedContent = updatedContent.replace(
             new RegExp(`"programId": "${pid}"(?!,\\s*"languageVideoUrl")`, 'g'), 
             `"programId": "${pid}",\n    "languageVideoUrl": "${youtubeUrl}"`
           );
           count++;
        }
      } else {
        console.log(`  No YouTube URL found.`);
      }
      
      // Be nice to the server
      await new Promise(r => setTimeout(r, 500));
      
    } catch (err) {
      console.error(`  Error fetching ${pid}:`, err.message);
    }
  }

  console.log(`Updated ${count} programs.`);
  fs.writeFileSync(STATIC_CONTENT_PATH, updatedContent, 'utf8');
  console.log('Done.');
}

main();
