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
  
  // Function to move Bible reference from start to end
  const moveBibleReference = (verse) => {
    if (!verse) return verse;
    
    // Pattern to match Bible references at the start
    // Matches patterns like: "Genesis 1:1", "1 Corinthians 13:4-7", "Psalms 119:9,11", etc.
    const referencePattern = /^((?:\d\s)?[A-Za-zก-๙]+(?:\s[A-Za-zก-๙]+)*)\s+(\d+:\d+(?:[-,]\d+)*)\s+(.+)$/;
    
    const match = verse.match(referencePattern);
    if (match) {
      const book = match[1];
      const verses = match[2];
      let text = match[3];
      
      // Check if text starts with a quote and doesn't end with one
      if (text.startsWith('"') && !text.endsWith('"')) {
        text = text + '"';
      }
      // Check if text ends with a quote but doesn't start with one
      if (text.endsWith('"') && !text.startsWith('"')) {
        text = '"' + text;
      }
      
      // Remove any digits that might be verse numbers in the text
      // But be careful not to remove legitimate numbers (like "40 days")
      // This pattern removes standalone verse numbers at the start of sentences
      text = text.replace(/\s+\d+\s+([A-Z])/g, ' $1');
      
      return `${text}  ${book} ${verses}`;
    }
    
    return verse;
  };
  
  // Process each track
  let changedCount = 0;
  const fixedContent = content.map(track => {
    const originalVerseEn = track.verse_en;
    const originalVerseTh = track.verse_th;
    
    track.verse_en = moveBibleReference(track.verse_en);
    track.verse_th = moveBibleReference(track.verse_th);
    
    if (track.verse_en !== originalVerseEn || track.verse_th !== originalVerseTh) {
      changedCount++;
      console.log(`\nFixed: ${track.languageEn} - ${track.title_en}`);
      if (track.verse_en !== originalVerseEn) {
        console.log(`  EN: ${originalVerseEn.substring(0, 80)}...`);
        console.log(`   -> ${track.verse_en.substring(0, 80)}...`);
      }
      if (track.verse_th !== originalVerseTh) {
        console.log(`  TH: ${originalVerseTh.substring(0, 80)}...`);
        console.log(`   -> ${track.verse_th.substring(0, 80)}...`);
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
      console.log(`\n✅ Successfully moved Bible references in ${changedCount} entries!`);
      console.log("All references have been moved from the beginning to the end of verses.");
    }
  });
});
