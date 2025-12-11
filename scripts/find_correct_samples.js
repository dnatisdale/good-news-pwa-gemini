const fs = require('fs');
const path = require('path');

const DIRS = {
    sourceA: 'C:\\GitHub\\good-news-pwa-gemini\\audio_full_tracks',
    sourceB: 'C:\\GitHub\\good-news-pwa-gemini\\audioMP3s\\audio',
    staticContent: path.join(__dirname, '../src/data/staticContent.js'),
    shortSamplesJson: path.join(__dirname, 'short_samples_list.json')
};

try {
    // 1. Load Data
    let contentRaw = fs.readFileSync(DIRS.staticContent, 'utf8');
    const tempFile = path.join(__dirname, 'temp_static_content_loader_find.js');
    const tempContent = contentRaw.replace('export const staticContent =', 'module.exports =');
    fs.writeFileSync(tempFile, tempContent);
    const staticContent = require(tempFile);
    fs.unlinkSync(tempFile);

    const shortFiles = require(DIRS.shortSamplesJson);
    console.log(`Analyzing ${shortFiles.length} short files...`);

    // 2. Build Map: Filename -> StaticContent Item
    // Filenames are like "Name.ID.mp3"
    // StaticContent has langId and programId
    
    // We want to find the Program ID for each "problem" language.
    const problems = [];

    shortFiles.forEach(fileObj => {
        // Parse Lang ID from filename "Name.ID.mp3"
        const match = fileObj.file.match(/(\d+)\.mp3$/);
        if (match) {
            const langId = match[1];
            // Find item in staticContent
            // Note: staticContent has langId as string or number
            const item = staticContent.find(i => String(i.langId) === langId);
            if (item) {
                problems.push({
                    file: fileObj.file,
                    langId: langId,
                    programId: item.programId,
                    language: item.languageEn,
                    duration: fileObj.duration
                });
            } else {
                console.log(`No static content match for LangID: ${langId} (File: ${fileObj.file})`);
            }
        } else {
             console.log(`Could not parse LangID from: ${fileObj.file}`);
        }
    });

    console.log(`Mapped ${problems.length} short files to Program IDs.`);

    // 3. Scan Sources for these Program IDs
    const sourceFiles = [];
    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(f => {
             if (fs.statSync(path.join(dir, f)).isDirectory()) return;
             sourceFiles.push({ name: f, fullPath: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size });
        });
    }
    scan(DIRS.sourceA);
    scan(DIRS.sourceB);
    
    console.log(`Scanned ${sourceFiles.length} source files.`);

    const foundMatches = [];

    problems.forEach(p => {
        const progId = String(p.programId);
        // Look for files containing this Program ID
        // e.g. "Good News Akeu... 62808.mp3"
        
        const matches = sourceFiles.filter(sf => sf.name.includes(progId));
        
        // Filter out the short file itself if it's in the list?
        // But source files are distinct from public/audio.
        
        if (matches.length > 0) {
            // Find best match (largest)
            const best = matches.sort((a, b) => b.size - a.size)[0];
            foundMatches.push({
                problem: p,
                matches: matches.length,
                bestMatch: best.name,
                bestSize: best.size,
                bestPath: best.fullPath
            });
        }
    });

    console.log('--- FOUND POTENTIAL REPLACEMENTS ---');
    console.log(JSON.stringify(foundMatches, null, 2));
    
    fs.writeFileSync(path.join(__dirname, 'found_replacements.json'), JSON.stringify(foundMatches, null, 2));

} catch (err) {
    console.error(err);
}
