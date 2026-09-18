const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';
const SERVICE_ID = 'srv-dae661gn74is73ci4e9g';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function fix() {
  try {
    console.log('1. Setting environment variables on telegram-bot-maker-v2...');
    await api.put(`/services/${SERVICE_ID}/env-vars`, [
      { key: 'BOT_TOKEN', value: '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU' },
      { key: 'OWNER_ID', value: '8422157752' },
      { key: 'CARD_NUMBER', value: '6262 7201 2331 5395' },
      { key: 'CARD_HOLDER', value: '@ismoiluzb022' },
      { key: 'NODE_VERSION', value: '20' },
      { key: 'PORT', value: '10000' },
      { key: 'RENDER_EXTERNAL_URL', value: 'https://telegram-bot-maker-v2.onrender.com' }
    ]);
    console.log('✅ Environment variables set successfully!');

    console.log('2. Updating build command and start command...');
    const patchCode = `const fs = require('fs');
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
}
if (!fs.existsSync('data/database.json')) {
  fs.writeFileSync('data/database.json', JSON.stringify({ users: {}, bots: {}, admins: [8422157752], payments: {}, settings: {} }, null, 2));
}
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace(/module\\.exports\\s*=\\s*\\(\\)\\s*=>\\s*\\{\\};\\s*\\}\\);\\s*\\}\\);/g, "module.exports = () => {};\\n});");
code = code.replace(/path\\.join\\(__dirname,\\s*'\\.\\.\\/data'\\)/g, "path.join(__dirname, 'data')");
code = code.replace(/Markup\\.keyboard\\(buttons\\)\\.resize\\(\\)/g, "Markup.keyboard(buttons).resize().persistent()");
code = code.replace(/\\.listen\\(PORT,\\s*async/g, ".listen(PORT, '0.0.0.0', async");
fs.writeFileSync('index.js', code);
console.log('PATCH_APPLIED_SUCCESSFULLY');
`;
    const b64 = Buffer.from(patchCode).toString('base64');
    const patchCmd = `node -e "require('fs').writeFileSync('patch.js', Buffer.from('${b64}', 'base64').toString('utf8'))" && node patch.js && npm install`;
    const crashReporter = "node -e \"const notify = (txt) => { const https = require('https'); const msg = encodeURIComponent('CRASH: ' + txt.slice(0, 2000)); https.get('https://api.telegram.org/bot8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU/sendMessage?chat_id=8422157752&text=' + msg, () => process.exit(1)); setTimeout(() => process.exit(1), 4000); }; process.on('uncaughtException', e => notify(e.stack || e.message)); process.on('unhandledRejection', e => notify((e && e.stack) || String(e))); require('./index.js');\"";

    await api.patch(`/services/${SERVICE_ID}`, {
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: patchCmd,
          startCommand: crashReporter
        }
      }
    });

    console.log('3. Triggering clear-cache deploy on Render...');
    const dep = await api.post(`/services/${SERVICE_ID}/deploys`, {
      clearCache: 'clear'
    });
    console.log('🚀 DEPLOY TRIGGERED! Deploy ID:', dep.data.id, 'Status:', dep.data.status);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

fix();
