const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

async function getLog() {
  try {
    const res = await axios.get('https://api.render.com/v1/services/srv-dae661gn74is73ci4e9g/deploys/dep-dae6armq1p3s73cquahg', {
      headers: { 'Authorization': `Bearer ${RENDER_KEY}` }
    });
    console.log('DEPLOY DATA:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('ERROR:', e.response?.data || e.message);
  }
}

getLog();
