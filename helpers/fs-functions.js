const fs = require("node:fs/promises");
const path = require("node:path");
const videoExtensions = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv'];

async function readDirectory(dir, depth = Infinity) {
    if (depth < 0) return [];

    let result = [];
    let files;
    try {
        files = await fs.readdir(dir);
    } catch (e) {
        return result;
    }

    for (const file of files) {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = await fs.stat(fullPath);
        } catch (e) {
            continue;
        }

        if (stat.isDirectory()) {
            result.push({
                item: file,
                children: await readDirectory(fullPath, depth - 1),
                path: fullPath,
                type: 'dir'
            });
        } else if (videoExtensions.includes(path.extname(file))) {
            result.push({
                item: file,
                children: [],
                path: fullPath,
                type: 'file'
            });
        }
    }

    return result;
}

module.exports = {
    readDirectory
}