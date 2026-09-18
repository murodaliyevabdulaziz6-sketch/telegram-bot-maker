const axios = require('axios');

const TOKEN = '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU';
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

async function setBotInfo() {
  try {
    const description = 
      `🤖 Telegram Bot Konstruktori — Dasturlashni bilmasdan ham bir zumda professional Telegram botlarni yarating va 24/7 ishga tushiring!\n\n` +
      `✨ Mavjud tayyor bot shablonlari:\n` +
      `• 🤖 AI / ChatGPT Boti\n` +
      `• 📈 Nakrutka Xizmati Boti\n` +
      `• 💰 Pul Topar & Referal Boti\n` +
      `• 🛒 Internet Do'kon (Shop) Boti\n` +
      `• 🎬 Kino & Seriallar Boti\n` +
      `• 🛡 Guruh Nazorati & Moderator Boti\n` +
      `• 🔮 Anonim Chat, Ob-havo, Valyuta va yana 10 dan ortiq!\n\n` +
      `🎁 Barcha foydalanuvchilarga 3 kunlik BEPUL sinov muddati beriladi!\n\n` +
      `🚀 Boshlash uchun pastdagi "Start" (Boshlash) tugmasini bosing!`;

    const shortDescription = `🚀 Professional Telegram Bot Konstruktori. 15+ dan ortiq tayyor botlarni bir zumda yarating va 24/7 boshqaring!`;

    // 1. Description ("Bu bot nimalar qila oladi?" matni)
    const res1 = await axios.post(`${BASE_URL}/setMyDescription`, {
      description: description
    });
    console.log('✅ setMyDescription:', res1.data);

    // 2. Short description (Profil va chat ro'yxatida ko'rinadigan qisqa tavsif)
    const res2 = await axios.post(`${BASE_URL}/setMyShortDescription`, {
      short_description: shortDescription
    });
    console.log('✅ setMyShortDescription:', res2.data);

    // 3. Bot commands
    const res3 = await axios.post(`${BASE_URL}/setMyCommands`, {
      commands: [
        { command: 'start', description: '🚀 Botni ishga tushirish' },
        { command: 'help', description: '❓ Yordam va qo\'llanma' },
        { command: 'admin', description: '👑 Admin paneli (Adminlar uchun)' }
      ]
    });
    console.log('✅ setMyCommands:', res3.data);

    console.log('🎉 BOTNING TAVSIFI VA TUGMALARI 100% CHIROYLI QILINDI!');
  } catch (err) {
    console.error('❌ Xatolik:', err.response?.data || err.message);
  }
}

setBotInfo();
