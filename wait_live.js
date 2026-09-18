const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

async function waitLive() {
  const api = axios.create({
    baseURL: 'https://api.render.com/v1',
    headers: { 'Authorization': `Bearer ${RENDER_KEY}` }
  });

  for (let i = 0; i < 40; i++) {
    const res = await api.get('/services/srv-dae661gn74is73ci4e9g/deploys/dep-daeenm0u01pc73e6kh0g');
    console.log(`[Attempt ${i+1}] Deploy status:`, res.data.status);
    if (res.data.status === 'live') {
      console.log('🎉 BOT IS NOW 100% LIVE ON RENDER!');
      return;
    }
    if (res.data.status === 'build_failed' || res.data.status === 'update_failed' || res.data.status === 'deactivated') {
      console.error('Deploy failed:', res.data.status);
      return;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

waitLive();
