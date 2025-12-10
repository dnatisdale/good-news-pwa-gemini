const fs = require('fs');
const path = require('path');
const mp3Duration = require('mp3-duration');

async function getAudioStats(dir) {
    let totalSize = 0;
    let totalDuration = 0;
    let fileCount = 0;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (file.endsWith('.mp3')) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
            fileCount++;

            try {
                const duration = await mp3Duration(filePath);
                totalDuration += duration;
            } catch (e) {
                console.error(`Error reading duration for ${file}: ${e.message}`);
            }
        }
    }
    return { totalSize, totalDuration, fileCount };
}

async function main() {
    const folders = ['public/audio', 'audioMP3s', 'audio_full_tracks']; // Check all potential places
    let grandTotalSize = 0;
    let grandTotalDuration = 0;

    console.log('--- Audio Statistics ---');

    for (const folder of folders) {
        if (fs.existsSync(folder)) {
            const stats = await getAudioStats(folder);
            console.log(`\nFolder: ${folder}`);
            console.log(`File Count: ${stats.fileCount}`);
            console.log(`Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Duration: ${(stats.totalDuration / 60).toFixed(2)} minutes`);
            
            grandTotalSize += stats.totalSize;
            grandTotalDuration += stats.totalDuration;
        } else {
            console.log(`\nFolder: ${folder} (NOT FOUND)`);
        }
    }

    console.log('\n--- GRAND TOTAL ---');
    console.log(`Total Audio Size: ${(grandTotalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Audio Duration: ${(grandTotalDuration / 60).toFixed(2)} minutes`);
    console.log(`Total Audio Duration: ${(grandTotalDuration / 3600).toFixed(2)} hours`);
}

main();
