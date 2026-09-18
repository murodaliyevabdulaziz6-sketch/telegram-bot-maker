const fs = require('fs');
const path = require('path');
const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';
const SERVICE_ID = 'srv-dae661gn74is73ci4e9g';
const BOT_TOKEN = '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU';
const OWNER_ID = '8422157752';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function main() {
  console.log('🚀 1. Preparing 24/7 Patch Script for Render...');

  const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/database.json'), 'utf-8'));

  const patchCode = `
const fs = require('fs');
if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

const dbData = ${JSON.stringify(dbData)};
if (!fs.existsSync('data/database.json')) {
  fs.writeFileSync('data/database.json', JSON.stringify(dbData, null, 2));
} else {
  try {
    const existing = JSON.parse(fs.readFileSync('data/database.json', 'utf-8'));
    if (!existing.users) existing.users = {};
    if (!existing.bots) existing.bots = {};
    if (!existing.settings) existing.settings = {};
    existing.settings.webapp_public = true;
    for (const [k, v] of Object.entries(dbData.users || {})) {
      if (!existing.users[k]) existing.users[k] = v;
    }
    for (const [k, v] of Object.entries(dbData.bots || {})) {
      if (!existing.bots[k]) existing.bots[k] = v;
    }
    fs.writeFileSync('data/database.json', JSON.stringify(existing, null, 2));
  } catch (e) {
    fs.writeFileSync('data/database.json', JSON.stringify(dbData, null, 2));
  }
}

let code = fs.readFileSync('index.js', 'utf8');

// 1. Prevent bot deletion in subscriptionChecker
code = code.replace(/db\\.deleteBot\\(b\\.id\\);/g, "db.updateBotStatus(b.id, 'stopped');");

// 2. Default webapp_public to true
code = code.replace(/webapp_public:\\s*false/g, 'webapp_public: true');
code = code.replace(/this\\.data\\.settings\\.webapp_public === true/g, 'this.data.settings.webapp_public !== false');

// 3. Keep-alive ping to correct URL
code = code.replace(/telegram-bot1-1-ivst\\.onrender\\.com/g, 'telegram-bot-maker-v2.onrender.com');

// 4. Fix express/http listen port binding
code = code.replace(/\\.listen\\(PORT,\\s*async/g, ".listen(PORT, '0.0.0.0', async");

fs.writeFileSync('index.js', code);
console.log('PATCH_24_7_APPLIED_SUCCESSFULLY');
`;

  const base64Patch = Buffer.from(patchCode, 'utf-8').toString('base64');
  console.log('Patch Base64 length:', base64Patch.length);

  const buildCommand = `node -e "require('fs').writeFileSync('patch.js', Buffer.from('${base64Patch}', 'base64').toString('utf8'))" && node patch.js && npm install`;
  const startCommand = `node -e "const notify = (txt) => { const https = require('https'); const msg = encodeURIComponent('CRASH: ' + txt.slice(0, 2000)); https.get('https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${OWNER_ID}&text=' + msg, () => process.exit(1)); setTimeout(() => process.exit(1), 4000); }; process.on('uncaughtException', e => notify(e.stack || e.message)); process.on('unhandledRejection', e => notify((e && e.stack) || String(e))); require('./index.js');"`;

  console.log('🚀 2. Updating Render Service Configuration...');
  await api.patch(`/services/${SERVICE_ID}`, {
    serviceDetails: {
      envSpecificDetails: {
        buildCommand: 'npm install telegraf axios dotenv qrcode localtunnel --no-audit',
        startCommand: 'node index.js'
      }
    }
  });
  console.log('Service settings updated.');

  console.log('🚀 3. Updating Render Environment Variables...');
  await api.put(`/services/${SERVICE_ID}/env-vars`, [
    { key: 'BOT_TOKEN', value: BOT_TOKEN },
    { key: 'OWNER_ID', value: OWNER_ID },
    { key: 'CARD_NUMBER', value: '6262 7201 2331 5395' },
    { key: 'CARD_HOLDER', value: '@ismoiluzb022' },
    { key: 'NODE_VERSION', value: '20' },
    { key: 'RENDER_EXTERNAL_URL', value: 'https://telegram-bot-maker-v2.onrender.com' }
  ]);
  console.log('Environment variables updated.');

  console.log('🚀 4. Triggering Fresh Clear-Cache Deploy on Render...');
  const deployRes = await api.post(`/services/${SERVICE_ID}/deploys`, {
    clearCache: 'clear'
  });
  console.log('DEPLOY TRIGGERED! Deploy ID:', deployRes.data.id, 'Status:', deployRes.data.status);

  console.log('\n⏳ Waiting for deploy to become live on Render...');
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 6000));
    attempts++;
    const depCheck = await api.get(`/services/${SERVICE_ID}/deploys/${deployRes.data.id}`);
    const st = depCheck.data.status;
    console.log(`[${attempts * 6}s] Deploy status: ${st}`);
    if (st === 'live') {
      console.log('🎉 24/7 DEPLOY SUCCESSFUL AND 100% LIVE ON RENDER!');
      break;
    }
    if (st === 'build_failed' || st === 'canceled' || st === 'deactivated') {
      console.error('❌ Deploy ended with status:', st);
      break;
    }
  }
}

main().catch(e => console.error('Error:', e.response?.data || e.message));

