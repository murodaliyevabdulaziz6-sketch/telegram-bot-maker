const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';
const BOT_TOKEN = '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function fixRenderPermanent() {
  try {
    const sId = 'srv-dadec4u7bikc73btdjm0';

    // 1. Update runtime to node
    console.log('1. Setting runtime to Node.js...');
    await api.patch(`/services/${sId}`, {
      serviceDetails: {
        env: 'node',
        envSpecificDetails: {
          buildCommand: 'npm install',
          startCommand: 'node index.js'
        }
      }
    });

    // 2. Update Env Vars
    console.log('2. Updating Environment Variables...');
    await api.put(`/services/${sId}/env-vars`, [
      { key: 'BOT_TOKEN', value: BOT_TOKEN },
      { key: 'OWNER_ID', value: '8422157752' },
      { key: 'CARD_NUMBER', value: '6262 7201 2331 5395' },
      { key: 'CARD_HOLDER', value: '@ismoiluzb022' },
      { key: 'NODE_VERSION', value: '20' }
    ]);

    // 3. Clear cache and trigger fresh deploy
    console.log('3. Triggering fresh 24/7 deploy...');
    const dep = await api.post(`/services/${sId}/deploys`, {
      clearCache: 'clear'
    });

    console.log('DEPLOY SUCCESS! Deploy ID:', dep.data.id, 'Status:', dep.data.status);
  } catch (err) {
    console.error('ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

fixRenderPermanent();
