const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';
const SERVICES = [
  'srv-dae661gn74is73ci4e9g', // telegram-bot-maker-v2
  'srv-dadec4u7bikc73btdjm0'  // telegram-bot1-1
];

const renderApi = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function triggerDeploy() {
  for (const sId of SERVICES) {
    try {
      console.log(`🚀 Triggering clear-cache Deploy on Render (${sId})...`);
      const dep = await renderApi.post(`/services/${sId}/deploys`, {
        clearCache: 'clear'
      });
      console.log(`✅ [${sId}] DEPLOY BOSHLANDI! Deploy ID: ${dep.data.id}, Status: ${dep.data.status}`);
    } catch (err) {
      console.error(`[${sId}] Render error:`, err.response?.data || err.message);
    }
  }
}

triggerDeploy();
