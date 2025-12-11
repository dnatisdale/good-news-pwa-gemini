const fs = require('fs');
const path = require('path');

const replacementsPath = path.join(__dirname, 'found_replacements.json');
const targetDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(replacementsPath)) {
    console.error("Replacements file not found.");
    process.exit(1);
}

const replacements = require(replacementsPath);

let count = 0;
replacements.forEach(rep => {
    const targetFilename = rep.problem.file; // e.g. "Cham.Cambodia.1024.mp3"
    const sourcePath = rep.bestPath;
    const targetPath = path.join(targetDir, targetFilename);
    
    console.log(`Replacing ${targetFilename} (Size: ${fs.statSync(targetPath).size}) with ${path.basename(sourcePath)} (Size: ${rep.bestSize})`);
    
    // Copy and overwrite
    fs.copyFileSync(sourcePath, targetPath);
    count++;
});

console.log(`Successfully replaced ${count} items.`);
