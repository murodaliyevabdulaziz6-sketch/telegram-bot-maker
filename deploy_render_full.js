const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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
  console.log('🚀 1. Preparing Full 24/7 Update Bundle for Render...');

  const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/database.json'), 'utf-8'));
  const dbDataB64 = Buffer.from(JSON.stringify(dbData), 'utf-8').toString('base64');

  const indexCode = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf-8');
  const indexGzB64 = zlib.gzipSync(Buffer.from(indexCode, 'utf-8')).toString('base64');

  const patchScript = `
const fs = require('fs');
const zlib = require('zlib');

// 1. Setup data folder and database.json
if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });

const initialDb = JSON.parse(Buffer.from('${dbDataB64}', 'base64').toString('utf8'));
fs.writeFileSync('data/database.json', JSON.stringify(initialDb, null, 2));

// 2. Unpack full latest index.js
const fullIndex = zlib.gunzipSync(Buffer.from('${indexGzB64}', 'base64')).toString('utf8');
fs.writeFileSync('index.js', fullIndex);
console.log('🎉 FULL BUNDLE DEPLOYED TO INDEX.JS!');
`;

  const patchGzB64 = zlib.gzipSync(Buffer.from(patchScript, 'utf-8')).toString('base64');
  console.log('📦 Patch Payload Gzip Base64 length:', patchGzB64.length);

  const buildCommand = `node -e "const zlib=require('zlib');const fs=require('fs');fs.writeFileSync('patch.js',zlib.gunzipSync(Buffer.from(process.env.BUNDLE_GZ_B64,'base64')).toString('utf8'))" && node patch.js && npm install`;
  const startCommand = `node -e "const notify = (txt) => { const https = require('https'); const msg = encodeURIComponent('CRASH: ' + txt.slice(0, 2000)); https.get('https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${OWNER_ID}&text=' + msg, () => process.exit(1)); setTimeout(() => process.exit(1), 4000); }; process.on('uncaughtException', e => notify(e.stack || e.message)); process.on('unhandledRejection', e => notify((e && e.stack) || String(e))); require('./index.js');"`;

  console.log('🚀 2. Updating Render Service Settings...');
  await api.patch(`/services/${SERVICE_ID}`, {
    serviceDetails: {
      envSpecificDetails: {
        buildCommand: buildCommand,
        startCommand: startCommand
      }
    }
  });
  console.log('✅ Service build & start settings updated.');

  console.log('🚀 3. Updating Render Environment Variables...');
  await api.put(`/services/${SERVICE_ID}/env-vars`, [
    { key: 'BOT_TOKEN', value: BOT_TOKEN },
    { key: 'OWNER_ID', value: OWNER_ID },
    { key: 'CARD_NUMBER', value: '6262 7201 2331 5395' },
    { key: 'CARD_HOLDER', value: '@ismoiluzb022' },
    { key: 'NODE_VERSION', value: '20' },
    { key: 'PORT', value: '10000' },
    { key: 'RENDER_EXTERNAL_URL', value: 'https://telegram-bot-maker-v2.onrender.com' },
    { key: 'BUNDLE_GZ_B64', value: patchGzB64 }
  ]);
  console.log('✅ Environment variables updated.');

  console.log('🚀 4. Triggering Clear-Cache Deploy on Render...');
  const deployRes = await api.post(`/services/${SERVICE_ID}/deploys`, {
    clearCache: 'clear'
  });
  console.log(`🚀 DEPLOY TRIGGERED! Deploy ID: ${deployRes.data.id}, Status: ${deployRes.data.status}`);

  console.log('\n⏳ Waiting for deploy to become LIVE...');
  let attempts = 0;
  while (attempts < 40) {
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
      console.error('❌ Deploy failed with status:', st);
      break;
    }
  }
}

main().catch(e => console.error('DEPLOY ERROR:', e.response?.data || e.message));
