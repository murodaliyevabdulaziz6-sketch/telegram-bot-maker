const QRCode = require('qrcode');
const { Markup } = require('telegraf');

module.exports = {
  id: 'tools',
  name: '🛠 QR Kod & Instrumentlar',
  description: 'Matn va havolalardan bir zumda QR-kod yasash, kuchli parol yaratish va matn tahlili boti',
  icon: '🛠',
  setupBot: (bot, botRecord, db) => {
    const mainKeyboard = Markup.keyboard([
      ['📱 QR Kod yasash', '🔑 Kuchli parol yaratish'],
      ['📊 Matn tahlili', 'ℹ️ Ma\'lumot']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🛠 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Siz bu yerda:\n` +
        `• Istalgan matn yoki havoladan QR-kod yaratishingiz\n` +
        `• Xavfsiz va buzilmas parollar generatsiya qilishingiz\n` +
        `• Matn belgilari va so'zlari sonini hisoblashingiz mumkin!\n\n` +
        `Menga shunchaki havola yoki matn yuboring, darhol QR-kod yasab beraman!`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    bot.hears('📱 QR Kod yasash', async (ctx) => {
      await ctx.reply('Menga QR-kod qilmoqchi bo\'lgan havola (URL) yoki matningizni yuboring:');
    });

    bot.hears('🔑 Kuchli parol yaratish', async (ctx) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      let pass = '';
      for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await ctx.reply(
        `🔑 *Siz uchun yaratilgan kuchli parol:*\n\n` +
        `\`${pass}\`\n\n` +
        `Nusxa olish uchun parol ustiga bosing!`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('📊 Matn tahlili', async (ctx) => {
      await ctx.reply('Tahlil qilmoqchi bo\'lgan matningizni yuboring:');
    });

    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      await ctx.reply('Foydali instrumentlar boti sizning kundalik yumushlaringizni osonlashtiradi.');
    });

    // Har qanday matndan QR-kod yasash
    bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith('/')) return;
      if (['📱 QR Kod yasash', '🔑 Kuchli parol yaratish', '📊 Matn tahlili', 'ℹ️ Ma\'lumot'].includes(text)) return;

      try {
        await ctx.sendChatAction('upload_photo');
        const qrBuffer = await QRCode.toBuffer(text, { width: 400, margin: 2 });
        const charCount = text.length;
        const wordCount = text.trim().split(/\s+/).length;

        await ctx.replyWithPhoto(
          { source: qrBuffer },
          {
            caption: 
              `✅ *QR-Kodingiz tayyor!*\n\n` +
              `📊 *Matn statistikasi:*\n` +
              `• Belgilar soni: ${charCount}\n` +
              `• So'zlar soni: ${wordCount}\n\n` +
              `QR kodni telefon kamerasi orqali skaner qilib ochishingiz mumkin.`,
            parse_mode: 'Markdown'
          }
        );
      } catch (err) {
        await ctx.reply('❌ QR-kod yaratishda xatolik yuz berdi.');
      }
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *QR & Instrumentlar Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};
