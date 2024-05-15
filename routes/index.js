// routes/index.js
const express = require('express');
const router = express.Router();
const path = require("node:path");
const fs = require("node:fs");
const {API, readConfig, CONFIG_FILE_PATH} = require("../helpers/api");
const {mergeVideos} = require("../helpers/ffmpeg");

const api = new API();

/* GET home page. */
router.get('/', async function(req, res, next) {
  // generate code for reading 'path' get parameter

  // res.render('index', { title: 'Express', items, path: pth});
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});


router.get('/movie', async function(req, res, next) {
  const appType = req.query.appType;
  const media = await api.getMovies(appType);
  res.json(media);
})

router.get('/queue', async function(req, res, next) {
    const appType = req.query.appType;
  const queue = ['sonarr', 'whisparr'].includes(appType) ? await api.getEpisodes(appType) : await api.getQueue(appType);
  res.json(queue);
})

router.post('/merge', async function(req, res, next) {
  const {sources, targetFolder, title} = req.body;
  const target = path.join(targetFolder, title) + '.' + path.basename(sources[0]).split('.').pop();
  let result
  try {
    result = await mergeVideos(sources, target, api.sendEvent);
  } catch (e) {
    result = e.message;
  }
  res.json({result});
})

router.get('/config', async function(req, res, next) {
  res.json(readConfig());
})

router.post('/config', async function(req, res, next) {
  let config = readConfig();
  const {appType, ...rest} = req.body;
  config = {...config, [appType]: rest};
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  api.updateConfig();
  res.json(config);
})

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  api.sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // When the client closes connection, stop sending events
  req.on('close', () => {
    api.sendEvent = () => {};
    res.end();
  });
});

module.exports = router;