// routes/index.js
var express = require('express');
var router = express.Router();
const path = require("node:path");
const fs = require("node:fs");

const {readDirectory} = require("../helpers/fs-functions");
const {getMovies, getEpisodes} = require("../helpers/api");
const {mergeVideos} = require("../helpers/ffmpeg");

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

/* GET home page. */
router.get('/', async function(req, res, next) {
  // generate code for reading 'path' get parameter

  // res.render('index', { title: 'Express', items, path: pth});
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

router.get('/scan', async function(req, res, next) {
  let pth = (req.query.path || '.').split(path.sep).map((item, index, array) => {
    if(array[index + 1] !== '..' && item !== '..') {
      return item;
    }
  })
      .filter(item => !!item)
      .join(path.sep)
  pth = req.query.path && req.query.path[0] === '/' ? '/' + pth : pth;
  const items = await readDirectory(pth, 0);
  res.json({items, path: pth});
});

router.post('/media', async function(req, res, next) {
  const {appType} = req.body;
  const {appUrl, apiKey} = readConfig(appType);
  const media = ['sonarr', 'whisparr'].includes(appType) ? await getEpisodes(appUrl, apiKey) : await getMovies(appUrl, apiKey);
  res.json(media);
})

router.post('/merge', async function(req, res, next) {
  const {sources, targetFolder, title} = req.body;
  const target = path.join(targetFolder, title) + '.' + path.basename(sources[0]).split('.').pop();
  const result = await mergeVideos(sources, target);
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
  res.json(config);
})

module.exports = router;