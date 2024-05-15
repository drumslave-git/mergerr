const { spawn } = require('child_process');
const path = require("node:path");
const fs = require("node:fs");

function mergeVideos(inputFiles, outputFile, sendEvent) {
    const outputFolder = outputFile.split(path.sep).slice(0, -1).join(path.sep)
    if(!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    const filesListContent = inputFiles.map(f => `file '${f}'`).join('\n')
    const filesListPath = path.join(outputFolder, 'mergerr-files.txt')
    fs.writeFileSync(filesListPath, filesListContent)
    return new Promise((resolve, reject) => {
        const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${filesListPath}" -c copy "${outputFile}"`;
        console.log(ffmpegCommand)
        const ffmpegProcess = spawn(ffmpegCommand, { shell: true });
        let logs = '';

        ffmpegProcess.stdout.on('data', (data) => {
            sendEvent({type: 'ffmpeg-stdout', data: data.toString()})
            console.log(data.toString()); // Progress logging (optional)
        });

        ffmpegProcess.stderr.on('data', (data) => {
            sendEvent({type: 'ffmpeg-stderr', data: data.toString()})
            console.error(data.toString()); // Error logging
            logs += data.toString();
        });

        ffmpegProcess.on('exit', (code) => {
            sendEvent({type: 'ffmpeg-exit', data: code})
            fs.rmSync(filesListPath)
            if (code === 0) {
                resolve(outputFile); // Success callback
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: \n` + logs)); // Error callback
            }
        });
    });
}

module.exports = { mergeVideos };