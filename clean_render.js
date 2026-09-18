const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  }
});

async function inspectAll() {
  const res = await api.get('/services?limit=20');
  for (const item of res.data) {
    const s = item.service;
    console.log(`\n================== SERVICE: ${s.name} (${s.id}) ==================`);
    console.log('Type:', s.type);
    console.log('Suspended:', s.suspended);
    console.log('Build Command:', s.serviceDetails?.envSpecificDetails?.buildCommand);
    console.log('Start Command:', s.serviceDetails?.envSpecificDetails?.startCommand);
    console.log('Runtime:', s.serviceDetails?.env);

    // If it runs python bot.py, delete or suspend it
    if (s.serviceDetails?.envSpecificDetails?.startCommand?.includes('python bot.py')) {
      console.log(`>>> DELETING old Python service ${s.name}...`);
      try {
        await api.delete(`/services/${s.id}`);
        console.log(`Deleted ${s.name}!`);
      } catch (err) {
        console.log('Delete error:', err.response?.data || err.message);
      }
    }
  }
}

inspectAll();
