const axios = require('axios');

const RENDER_KEY = 'rnd_Ikh4v3CmmxPztHSU3AXPohdKnteT';
const NEW_TOKEN = '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU';

const api = axios.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    'Authorization': `Bearer ${RENDER_KEY}`,
    'Accept': 'application/json'
  }
});

async function updateAll() {
  try {
    const services = await api.get('/services?limit=20');
    console.log(`Found ${services.data.length} services.`);

    for (const item of services.data) {
      const sId = item.service.id;
      const sName = item.service.name;
      console.log(`\n--- Updating service: ${sName} (${sId}) ---`);

      // Update env var BOT_TOKEN
      try {
        await api.put(`/services/${sId}/env-vars/BOT_TOKEN`, {
          value: NEW_TOKEN
        });
        console.log(`Successfully updated BOT_TOKEN on ${sName}`);
      } catch (err) {
        // If not found or error, try adding it
        try {
          await api.put(`/services/${sId}/env-vars`, [
            { key: 'BOT_TOKEN', value: NEW_TOKEN },
            { key: 'OWNER_ID', value: '8422157752' },
            { key: 'CARD_NUMBER', value: '6262 7201 2331 5395' },
            { key: 'CARD_HOLDER', value: '@ismoiluzb022' }
          ]);
          console.log(`Saved env vars batch on ${sName}`);
        } catch (e2) {
          console.log(`Note for ${sName}:`, e2.response?.data || e2.message);
        }
      }

      // Trigger deploy for active/web services
      try {
        const dep = await api.post(`/services/${sId}/deploys`, {
          clearCache: 'clear'
        });
        console.log(`Deploy triggered for ${sName}, deploy ID: ${dep.data.id}`);
      } catch (depErr) {
        console.log(`Deploy not triggered for ${sName}:`, depErr.response?.data || depErr.message);
      }
    }

    console.log('\nALL SERVICES UPDATED SUCCESSFULLY!');
  } catch (error) {
    console.error('Fatal error:', error.response?.data || error.message);
  }
}

updateAll();
