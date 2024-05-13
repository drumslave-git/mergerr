const axios = require('axios');

async function getAll(url) {
    console.log(`Fetching from ${url}`)
    try {
        const response = await axios.get(url);

        return response.data;
    } catch (error) {
        console.error(`Error: ${error}`);
        return [];
    }
}

async function getMovies(appUrl, apiKey) {
    return getAll(`${appUrl}/api/v3/movie?apiKey=${apiKey}`);
}

async function getEpisodes(appUrl, apiKey) {
    // console.log(`Fetching movies from ${url}`)
    return getAll(`${appUrl}/api/v3/episode?apiKey=${apiKey}`);
}

module.exports = { getMovies, getEpisodes };