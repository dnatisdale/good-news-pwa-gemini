const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/data/staticContent.js');

try {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Regex to extract the array content
  const regex = /export const staticContent = (\[[\s\S]*?\]);/;
  const match = content.match(regex);

  if (match) {
    // Safely parse the array (assuming it's valid JS object structure)
    // We use eval here because the file might contain unquoted keys or comments, 
    // though staticContent.js usually looks like JSON. 
    // If it's pure JSON-like, JSON.parse is safer, but eval is more robust for JS files.
    let data;
    try {
        data = eval(match[1]);
    } catch (e) {
        console.error("Error parsing staticContent array. Ensure it is valid JavaScript syntax.");
        process.exit(1);
    }

    let updatedCount = 0;

    const updatedData = data.map(item => {
      const id = item.programId || item.id;
      
      if (!id) return item;

      // New URL patterns
      const newStreamUrl = `fivefish.org/T${id}`;
      // Default to track 1 for bulk updates if not specified, or keep existing if it has a specific track?
      // User asked to apply the "Track Download: .../1" pattern.
      const newTrackDownloadUrl = `https://api.globalrecordings.net/files/track/mp3-low/${id}/1`;
      const newZipDownloadUrl = `https://api.globalrecordings.net/files/set/mp3-low/${id}.zip`;
      const newShareUrl = `5fi.sh/T${id}`;

      // Check if changes are needed
      if (item.streamUrl !== newStreamUrl || 
          item.trackDownloadUrl !== newTrackDownloadUrl || 
          item.zipDownloadUrl !== newZipDownloadUrl ||
          item.shareUrl !== newShareUrl) {
        updatedCount++;
      }

      return {
        ...item,
        streamUrl: newStreamUrl,
        trackDownloadUrl: newTrackDownloadUrl,
        zipDownloadUrl: newZipDownloadUrl,
        shareUrl: newShareUrl
      };
    });

    if (updatedCount > 0) {
      const newContent = content.replace(regex, `export const staticContent = ${JSON.stringify(updatedData, null, 2)};`);
      fs.writeFileSync(targetFile, newContent, 'utf8');
      console.log(`Successfully updated ${updatedCount} items in src/data/staticContent.js`);
    } else {
      console.log('No items needed updating.');
    }

  } else {
    console.error('Could not find "export const staticContent = [...]" in the file.');
  }

} catch (err) {
  console.error('Error reading or writing file:', err);
}
