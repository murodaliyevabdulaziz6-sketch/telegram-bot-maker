const ai = require('./ai');
const nakrutka = require('./nakrutka');
const pulTopar = require('./pul_topar');
const kino = require('./kino');
const anonim = require('./anonim');
const shop = require('./shop');
const quiz = require('./quiz');
const feedback = require('./feedback');
const translator = require('./translator');
const currency = require('./currency');
const namoz = require('./namoz');
const tools = require('./tools');
const moderator = require('./moderator');
const weather = require('./weather');
const quotes = require('./quotes');
const autopost = require('./autopost');
const customButtons = require('./custom_buttons');

const templates = [
  customButtons, // Eng yuqorida turadi
  ai,
  nakrutka,
  pulTopar,
  kino,
  anonim,
  shop,
  quiz,
  feedback,
  translator,
  currency,
  namoz,
  tools,
  moderator,
  weather,
  quotes,
  autopost
];

const templatesMap = {};
templates.forEach(t => {
  templatesMap[t.id] = t;
});

module.exports = {
  templates,
  templatesMap,
  getTemplate: (id) => templatesMap[id] || null
};
