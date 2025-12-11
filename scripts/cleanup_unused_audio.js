const fs = require('fs');
const path = require('path');

const PUBLIC_AUDIO_DIR = path.join(__dirname, '../public/audio');
const STATIC_CONTENT_PATH = path.join(__dirname, '../src/data/staticContent.js');
const SRC_DIR = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })
    return arrayOfFiles;
}

try {
    // 1. Get List of Active Files from staticContent.js
    let contentRaw = fs.readFileSync(STATIC_CONTENT_PATH, 'utf8');
    // safer load
    const tempFile = path.join(__dirname, 'temp_static_content_loader_cleanup.js');
    const tempContent = contentRaw.replace('export const staticContent =', 'module.exports =');
    fs.writeFileSync(tempFile, tempContent);
    const staticContent = require(tempFile);
    fs.unlinkSync(tempFile);

    const usedFiles = new Set();
    staticContent.forEach(item => {
        if (item.sampleUrl && item.sampleUrl.startsWith('/audio/')) {
            // /audio/foo.mp3 -> foo.mp3
            const basename = path.basename(item.sampleUrl);
            usedFiles.add(basename.toLowerCase());
        }
    });

    console.log(`Found ${usedFiles.size} audio files referenced in staticContent.js`);

    // 2. Scan SRC for hardcoded references (Just to be safe)
    // We already grepped, but let's do a simple scan of text files in src
    console.log('Scanning src directory for hardcoded references...');
    const srcFiles = getAllFiles(SRC_DIR);
    let hardcodedCount = 0;
    srcFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.js', '.jsx', '.css', '.json'].includes(ext)) {
            const content = fs.readFileSync(file, 'utf8');
            // Look for 'Foo.bar.mp3' pattern or just .mp3
            const matches = content.match(/[\w.-]+\.mp3/g);
            if (matches) {
                matches.forEach(m => {
                    if (!usedFiles.has(m.toLowerCase())) {
                        usedFiles.add(m.toLowerCase());
                        hardcodedCount++;
                        console.log(`Saved by hardcode ref: ${m}`);
                    }
                });
            }
        }
    });
    console.log(`Added ${hardcodedCount} files from hardcoded references.`);


    // 3. List actual files in public/audio
    const actualFiles = fs.readdirSync(PUBLIC_AUDIO_DIR);
    
    let deletedCount = 0;
    
    actualFiles.forEach(file => {
        const filePath = path.join(PUBLIC_AUDIO_DIR, file);
        if (fs.statSync(filePath).isDirectory()) return; // Skip subdirs like 'backup' if any

        if (!usedFiles.has(file.toLowerCase())) {
            // Delete!
            console.log(`Deleting unused file: ${file}`);
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    });

    console.log(`Cleanup complete. Deleted ${deletedCount} unused files.`);

} catch (err) {
    console.error('Error:', err);
}
