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

async function run() {
  try {
    console.log('1. Setting clean build with --package-lock=false...');
    await api.patch(`/services/${SERVICE_ID}`, {
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: 'npm install telegraf axios dotenv qrcode localtunnel --package-lock=false --no-audit',
          startCommand: 'node index.js'
        }
      }
    });

    console.log('2. Triggering deploy...');
    const dep = await api.post(`/services/${SERVICE_ID}/deploys`, {
      clearCache: 'clear'
    });

    console.log('DEPLOY STARTED:', dep.data.id, 'Status:', dep.data.status);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

run();
