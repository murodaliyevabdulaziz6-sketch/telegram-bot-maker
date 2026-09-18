const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  }
});

async function stopOldAndEnsureMaker() {
  try {
    // 1. Suspend old Python bot services
    const oldServices = ['srv-d9hoakvavr4c739hp5tg', 'srv-d9jhlqvavr4c73ci9520'];
    for (const id of oldServices) {
      try {
        await api.post(`/services/${id}/suspend`);
        console.log(`SUSPENDED old service: ${id}`);
      } catch (e) {
        console.log(`Service ${id} suspend status:`, e.response?.data?.message || e.message);
      }
    }

    // 2. Check Maker bot services
    const services = await api.get('/services?limit=20');
    console.log('\n--- ACTIVE SERVICES ON RENDER ---');
    for (const item of services.data) {
      console.log(`- [${item.service.suspended === 'suspended' ? 'PAUSED' : 'ACTIVE'}] ${item.service.name} (${item.service.id}) | URL: ${item.service.serviceDetails?.url}`);
    }
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

stopOldAndEnsureMaker();
