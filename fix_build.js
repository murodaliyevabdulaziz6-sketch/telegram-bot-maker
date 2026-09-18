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

async function fixBuild() {
  try {
    console.log('Updating build command...');
    await api.patch(`/services/${SERVICE_ID}`, {
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: 'npm install telegraf axios dotenv qrcode localtunnel',
          startCommand: 'node index.js'
        }
      }
    });

    console.log('Triggering deploy...');
    const dep = await api.post(`/services/${SERVICE_ID}/deploys`, {
      clearCache: 'clear'
    });

    console.log('DEPLOY STARTED:', dep.data.id, 'Status:', dep.data.status);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

fixBuild();
