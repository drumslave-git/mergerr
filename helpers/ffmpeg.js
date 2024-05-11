const { spawn } = require('child_process');
const path = require("node:path");
const fs = require("node:fs");

function mergeVideos(inputFiles, outputFile) {
    const outputFolder = outputFile.split(path.sep).slice(0, -1).join(path.sep)
    if(!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    return new Promise((resolve, reject) => {
        const ffmpegCommand = `ffmpeg -f concat -safe 0 -i ${inputFiles.map(f => `"${f}"`).join(' ')} -c copy "${outputFile}"`;
        console.log(ffmpegCommand)
        const ffmpegProcess = spawn(ffmpegCommand, { shell: true });

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(data.toString()); // Progress logging (optional)
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(data.toString()); // Error logging
        });

        ffmpegProcess.on('exit', (code) => {
            if (code === 0) {
                resolve(outputFile); // Success callback
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`)); // Error callback
            }
        });
    });
}

module.exports = { mergeVideos };