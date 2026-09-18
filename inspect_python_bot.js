const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  }
});

async function inspectPythonService() {
  try {
    const s = await api.get('/services/srv-d9hoakvavr4c739hp5tg');
    console.log('SERVICE INFO:', JSON.stringify(s.data, null, 2));

    const env = await api.get('/services/srv-d9hoakvavr4c739hp5tg/env-vars');
    console.log('ENV VARS:', JSON.stringify(env.data, null, 2));
  } catch (err) {
    console.error('ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

inspectPythonService();
