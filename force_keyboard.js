const axios = require('axios');

const TOKEN = '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU';
const USER_ID = 8422157752;

async function forceUpdateKeyboard() {
  try {
    const keyboard = {
      keyboard: [
        ['👑 Admin Panel'],
        ['🚀 Yangi Bot Yaratish', '📁 Mening Botlarim'],
        ['💎 Tariflar va Obuna', '👤 Profilim'],
        ['❓ Yordam va Qo\'llanma']
      ],
      resize_keyboard: true,
      is_persistent: true
    };

    const res = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: USER_ID,
      text: '🎉 Botingiz Render.com bulutli serverida 24/7 rejimda muvaffaqiyatli ishga tushirildi!\n\n✅ Kompyuteringiz o\'chiq bo\'lsa ham bot 24/7 ishlaydi.\n✅ Pastki 4 ta burchak (menyu) doimiy ochiq turadigan qilindi.',
      reply_markup: keyboard
    });

    console.log('TELEGRAM KEYBOARD FORCED UPDATE SUCCESS:', res.data.ok);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

forceUpdateKeyboard();
