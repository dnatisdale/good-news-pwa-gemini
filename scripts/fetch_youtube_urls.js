import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_CONTENT_PATH = path.join(__dirname, '../src/data/staticContent.js');
const CONCURRENCY_LIMIT = 5;

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
  const regex = /href=['"](https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^'"]+)['"]/i;
  const match = html.match(regex);
  return match ? match[1] : null;
};

// Simple async pool
async function asyncPool(limit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    
    if (limit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function main() {
  console.log('Reading staticContent.js...');
  let content = fs.readFileSync(STATIC_CONTENT_PATH, 'utf8');

  // Find all unique program IDs
  const programIdRegex = /"programId":\s*"(\d+)"/g;
  let match;
  const programIds = new Set();
  while ((match = programIdRegex.exec(content)) !== null) {
    programIds.add(match[1]);
  }

  console.log(`Found ${programIds.size} unique programs.`);

  const programIdsArray = Array.from(programIds);
  const updates = new Map(); // pid -> youtubeUrl
  let processedCount = 0;

  await asyncPool(CONCURRENCY_LIMIT, programIdsArray, async (pid) => {
    const progress = Math.round((++processedCount / programIds.size) * 100);
    process.stdout.write(`Processing: ${processedCount}/${programIds.size} (${progress}%)\r`);

    // Check if checks are already present (optimization to skip redundant fetches could go here, 
    // but the regex check logic below handles the file update).
    // For now, we fetch all to ensure we have data. 
    // Optimization: Check if content already HAS languageVideoUrl for this PID 
    // BUT we have duplicate PIDs in the file (normalized data?), so checking the file string is complex.
    // The previous script checked `!updatedContent.includes`.
    // We'll skip fetch if the file clearly has it for this ID?
    // Let's just fetch, it's safer.

    try {
      const url = `https://globalrecordings.net/en/program/${pid}`;
      const html = await fetchUrl(url);
      const youtubeUrl = extractYouTubeUrl(html);

      if (youtubeUrl) {
        updates.set(pid, youtubeUrl);
      }
    } catch (err) {
      // console.error(`  Error fetching ${pid}:`, err.message); // Silent for cleaner progress
    }
  });

  console.log('\nFetching complete. Applying updates...');

  let updatedContent = content;
  let replacementCount = 0;

  for (const [pid, youtubeUrl] of updates) {
    // Only update if not already present
    // Using positive lookahead to find the specific line
    const regex = new RegExp(`"programId": "${pid}"(?!,\\s*"languageVideoUrl")`, 'g');
    
    // Check if it matches
    if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(
            regex,
            `"programId": "${pid}",\n    "languageVideoUrl": "${youtubeUrl}"`
        );
        replacementCount++;
    }
  }

  console.log(`Updated ${replacementCount} occurrences.`);
  fs.writeFileSync(STATIC_CONTENT_PATH, updatedContent, 'utf8');
  console.log('Done.');
}

main();
