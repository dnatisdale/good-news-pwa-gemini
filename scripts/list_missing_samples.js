const fs = require('fs');
const path = require('path');

const shortSamplesPath = path.join(__dirname, 'short_samples_list.json');
const replacementsPath = path.join(__dirname, 'found_replacements.json');
const staticContentPath = path.join(__dirname, '../src/data/staticContent.js');

try {
    const shortFiles = require(shortSamplesPath);
    const replacements = require(replacementsPath);

    // Get IDs of fixed files
    const fixedFiles = new Set(replacements.map(r => r.problem.file));

    // Filter for missing
    const missing = shortFiles.filter(s => !fixedFiles.has(s.file));

    // We need more info (Language Name) which is in the filename or staticContent
    // Let's load staticContent to get the pretty name if possible
    let contentRaw = fs.readFileSync(staticContentPath, 'utf8');
    const tempFile = path.join(__dirname, 'temp_static_loader_missing.js');
    const tempContent = contentRaw.replace('export const staticContent =', 'module.exports =');
    fs.writeFileSync(tempFile, tempContent);
    const staticContent = require(tempFile);
    fs.unlinkSync(tempFile);

    console.log("### Missing Audio Sources");
    console.log(`Total Missing: ${missing.length}`);
    console.log("| Language | Program ID | Current File | Duration |");
    console.log("| :--- | :--- | :--- | :--- |");

    missing.forEach(m => {
        // Filename format: Name.ID.mp3
        const match = m.file.match(/(\d+)\.mp3$/);
        let langName = "Unknown";
        let programId = "Unknown";
        
        if (match) {
            const langId = match[1];
            // Find in staticContent
            const item = staticContent.find(i => String(i.langId) === langId);
            if (item) {
                langName = item.languageEn;
                programId = item.programId;
            }
        }
        
        console.log(`| **${langName}** | \`${programId}\` | ${m.file} | ${m.duration.toFixed(1)}s |`);
    });

} catch (e) {
    console.error(e);
}
