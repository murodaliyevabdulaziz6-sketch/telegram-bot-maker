const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  }
});

async function run() {
  try {
    const s1 = await api.get('/services/srv-dae661gn74is73ci4e9g');
    console.log('FULL SERVICE OBJECT:', JSON.stringify(s1.data, null, 2));

    const envs = await api.get('/services/srv-dadec4u7bikc73btdjm0/env-vars');
    console.log('ENV VARS srv-dadec4u7bikc73btdjm0:', envs.data);

    const deploys = await api.get('/services/srv-dadec4u7bikc73btdjm0/deploys?limit=2');
    console.log('DEPLOYS srv-dadec4u7bikc73btdjm0:', deploys.data.map(d => ({ id: d.deploy.id, status: d.deploy.status, commit: d.deploy.commit })));
  } catch (err) {
    console.error('ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

run();
