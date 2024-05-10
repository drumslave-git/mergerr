// routes/index.js
var express = require('express');
var router = express.Router();
const path = require("node:path");

const {readDirectory} = require("../helpers/fs-functions");
const {getMovies} = require("../helpers/api");
const {mergeVideos} = require("../helpers/ffmpeg");

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

router.post('/movies', async function(req, res, next) {
  const {appUrl, apiKey} = req.body;
  const movies = await getMovies(appUrl, apiKey);
  res.json(movies);
})

router.post('/merge', async function(req, res, next) {
  const {sources, targetFolder, title} = req.body;
  const target = path.join(targetFolder, title) + '.' + path.basename(sources[0]).split('.').pop();
  const result = await mergeVideos(sources, target);
  res.json({result});
})

module.exports = router;