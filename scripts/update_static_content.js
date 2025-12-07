const fs = require('fs');
const path = require('path');

const CSV_FILE_PATH = path.join(__dirname, 'your_content_data.csv');
const AUDIO_DIR = path.join(__dirname, '../public/audio');
const OUTPUT_FILE_PATH = path.join(__dirname, '../src/data/staticContent.js');

// Mapping from CSV headers to JS object keys
const FIELD_MAPPING = {
    'id': 'id',
    'langID': 'langId',
    'iso3': 'iso3',
    'langEn': 'languageEn',
    'langTh': 'langTh',
    'titleEn': 'title_en',
    'titleTh': 'title_th',
    'verseEn': 'verse_en',
    'verseTh': 'verse_th',
    'playUrl': 'streamUrl',
    'downloadTrack001Url': 'trackDownloadUrl',
    'downloadZipUrl': 'zipDownloadUrl',
    'program': 'programId',
    'shareProgUrl': 'shareUrl',
    'duration': 'duration',
    'trackCount': 'trackCount'
};

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted fields containing commas
        const row = [];
        let currentField = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                row.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        row.push(currentField);

        const item = {};
        headers.forEach((header, index) => {
            // Remove quotes if present
            let value = row[index] ? row[index].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }
            
            // Map to JS key
            const jsKey = FIELD_MAPPING[header];
            if (jsKey) {
                item[jsKey] = value;
            }
        });

        if (item.id) {
             // Convert ID to number if it looks like one
            if (!isNaN(item.id)) {
                item.id = parseInt(item.id, 10);
            }
            data.push(item);
        }
    }
    return data;
}

function updateStaticContent() {
    console.log('Reading CSV data...');
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const data = parseCSV(csvContent);
    console.log(`Parsed ${data.length} items from CSV.`);

    console.log('Scanning audio directory...');
    let audioFiles = [];
    try {
        audioFiles = fs.readdirSync(AUDIO_DIR);
    } catch (err) {
        console.warn('Audio directory not found or empty:', err.message);
    }

    // Create a map of Language ID -> Audio Filename
    // Expected format: LanguageName.LangID.mp3 (e.g., Akeu.1148.mp3)
    const audioMap = {};
    audioFiles.forEach(file => {
        // Match files like "Akeu.1148.mp3" or "Akha.Thailand.3127.mp3"
        const match = file.match(/\.(\d+)\.mp3$/i);
        if (match) {
            const langId = match[1];
            audioMap[langId] = file;
        }
    });
    console.log(`Found ${Object.keys(audioMap).length} matching audio files.`);

    // Update data with sampleUrl
    let matchedCount = 0;
    data.forEach(item => {
        // Match by langId (all messages in same language get same sample)
        const langId = item.langId;
        
        if (langId && audioMap[langId]) {
            item.sampleUrl = `/audio/${audioMap[langId]}`;
            matchedCount++;
        }
        
        // Ensure stableKey is present
        if (!item.stableKey && item.languageEn) {
            item.stableKey = item.languageEn;
        }
    });

    console.log(`Matched ${matchedCount} items with audio samples.`);
    console.log(`Unique languages with samples: ${Object.keys(audioMap).length}`);

    // Filter out items with empty languageEn or id
    const filteredData = data.filter(item => {
        const hasValidLanguage = item.languageEn && item.languageEn.trim() !== '';
        const hasValidId = item.id && item.id.toString().trim() !== '';
        return hasValidLanguage && hasValidId;
    });
    
    const removedCount = data.length - filteredData.length;
    if (removedCount > 0) {
        console.log(`Filtered out ${removedCount} items with empty language or id.`);
    }

    const jsContent = `// This file was automatically generated from your CSV data on your_content_data.csv.
export const staticContent = ${JSON.stringify(filteredData, null, 2)};
`;

    fs.writeFileSync(OUTPUT_FILE_PATH, jsContent);
    console.log(`Updated ${OUTPUT_FILE_PATH} with ${filteredData.length} valid items.`);
}

updateStaticContent();
