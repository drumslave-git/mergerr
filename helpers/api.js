const axios = require('axios');
const fs = require("node:fs");
const path = require("node:path");

const CONFIG_FILE_PATH = path.resolve(__dirname, '../config/config.json');
const readConfig = (appType) => {
    let config = {};
    if(fs.existsSync(CONFIG_FILE_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
    if(!appType) {
        return config;
    }
    return config[appType] || {};
}

class API {
    constructor() {
        this.config = readConfig();
    }

    async get(appType, uri) {
        const {appUrl, apiKey} = this.config[appType] || {}
        if(!appUrl || !apiKey) {
            return {error: 'Missing configuration for ' + appType + '. Please configure it in the settings page.'}
        }
        const url = new URL(appUrl.replace(/\/$/, '') + uri);
        url.searchParams.append('apikey', apiKey);
        console.log(`Fetching from ${url.href}`)
        try {
            const response = await axios.get(url.href);

            return {data: response.data};
        } catch (error) {
            return {error: error.message}
        }
    }

    async getMovies(appType) {
        return this.get(appType,'/api/v3/movie');
    }

    async getEpisodes(appType) {
        return this.get(appType, '/api/v3/episode');
    }

    async getQueue(appType, result = []) {
        const resp = await this.get(appType, '/api/v3/queue?pageSize=100&includeUnknownMovieItems=true&includeMovie=true');
        if(resp.error) {
            return resp;
        }
        const data = resp.data;
        const records = data.records
            .filter(item => item.trackedDownloadState === 'importPending')
        await Promise.all(records.map(async item => {
            const {data} = await this.get(appType, `/api/v3/manualimport?downloadId=${item.downloadId}`);
            item.manualImport = data
                .sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) {
                        return -1;
                    }
                    if (a.name.toLowerCase() > b.name.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                })
        }));
        result = [
            ...result,
            ...records

        ]
        if(data.totalRecords > data.page * data.pageSize) {
            return await this.getQueue(appType, result);
        }
        return {
            data: result
                .filter(item => item.manualImport.length > 1)
                .sort((a, b) => {
                    if (a.title.toLowerCase() < b.title.toLowerCase()) {
                        return -1;
                    }
                    if (a.title.toLowerCase() > b.title.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                })
        };
    }
}

module.exports = { API, readConfig, CONFIG_FILE_PATH };