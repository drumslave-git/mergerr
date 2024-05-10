const axios = require('axios');

async function getMovies(appUrl, apiKey) {
    const url = `${appUrl}/api/v3/movie?apiKey=${apiKey}`;
    // console.log(`Fetching movies from ${url}`)
    try {
        const response = await axios.get(url);

        return response.data;
    } catch (error) {
        console.error(`Error: ${error}`);
        return [];
    }
}

module.exports = { getMovies };