const { Markup } = require('telegraf');

module.exports = {
  id: 'namoz',
  name: '🕌 Namoz Vaqtlari Boti',
  description: 'O\'zbekiston shaharlari bo\'yicha kunlik 5 vaqt namoz vaqtlari va taqvim boti',
  icon: '🕌',
  setupBot: (bot, botRecord, db) => {
    const userRegions = {};

    // Shaharlar bo'yicha namoz vaqtlari bazasi
    const prayerTimes = {
      'Toshkent': { bomdod: '05:18', quyosh: '06:42', peshin: '12:35', asr: '16:45', shom: '18:28', xufton: '19:48' },
      'Samarqand': { bomdod: '05:25', quyosh: '06:48', peshin: '12:41', asr: '16:51', shom: '18:34', xufton: '19:54' },
      'Andijon': { bomdod: '05:07', quyosh: '06:31', peshin: '12:24', asr: '16:34', shom: '18:17', xufton: '19:37' },
      'Farg\'ona': { bomdod: '05:10', quyosh: '06:34', peshin: '12:26', asr: '16:36', shom: '18:19', xufton: '19:39' },
      'Namangan': { bomdod: '05:09', quyosh: '06:33', peshin: '12:25', asr: '16:35', shom: '18:18', xufton: '19:38' },
      'Buxoro': { bomdod: '05:35', quyosh: '06:58', peshin: '12:51', asr: '17:01', shom: '18:44', xufton: '20:04' },
      'Xiva': { bomdod: '05:47', quyosh: '07:11', peshin: '13:03', asr: '17:13', shom: '18:56', xufton: '20:16' },
      'Nukus': { bomdod: '05:50', quyosh: '07:15', peshin: '13:07', asr: '17:17', shom: '19:00', xufton: '20:20' },
      'Qarshi': { bomdod: '05:30', quyosh: '06:53', peshin: '12:46', asr: '16:56', shom: '18:39', xufton: '19:59' },
      'Termiz': { bomdod: '05:26', quyosh: '06:48', peshin: '12:42', asr: '16:54', shom: '18:37', xufton: '19:55' }
    };

    const mainKeyboard = Markup.keyboard([
      ['🕌 Bugungi namoz vaqtlari', '📍 Shaharni tanlash'],
      ['📖 Duo va zikrlar', 'ℹ️ Bot haqida']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      if (!userRegions[ctx.from.id]) {
        userRegions[ctx.from.id] = 'Toshkent';
      }

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🕌 *${botRecord.bot_first_name}* xush kelibsiz!\n` +
        `Tanlangan shahar: *${userRegions[ctx.from.id]}*\n\n` +
        `Namoz vaqtlarini ko'rish uchun quyidagi menyudan foydalaning:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendTimes = async (ctx) => {
      const region = userRegions[ctx.from.id] || 'Toshkent';
      const times = prayerTimes[region] || prayerTimes['Toshkent'];
      const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

      const msg = 
        `🕌 *Namoz Vaqtlari — ${region} shahri*\n` +
        `📅 Sana: ${today}\n\n` +
        `🌌 Bomdod (Tong): *${times.bomdod}*\n` +
        `🌅 Quyosh chiqishi: *${times.quyosh}*\n` +
        `☀️ Peshin: *${times.peshin}*\n` +
        `⛅ Asr: *${times.asr}*\n` +
        `🌇 Shom (Iftor): *${times.shom}*\n` +
        `🌃 Xufton: *${times.xufton}*\n\n` +
        `_«Albatta, namoz mo'minlarga vaqtida tayinlangan farzdir» (Niso, 103)_`;

      await ctx.reply(msg, { parse_mode: 'Markdown' });
    };

    bot.hears('🕌 Bugungi namoz vaqtlari', sendTimes);

    bot.hears('📍 Shaharni tanlash', async (ctx) => {
      const buttons = Object.keys(prayerTimes).map(city => [Markup.button.callback(city, `set_city_${city}`)]);
      await ctx.reply(`O'zingizga yaqin shaharni tanlang:`, Markup.inlineKeyboard(buttons));
    });

    bot.action(/set_city_(.*)/, async (ctx) => {
      const city = ctx.match[1];
      userRegions[ctx.from.id] = city;
      await ctx.answerCbQuery(`✅ Shahar tanlandi: ${city}`);
      await ctx.reply(`✅ Shahringiz *${city}* ga o'zgartirildi.`, { parse_mode: 'Markdown' });
      await sendTimes(ctx);
    });

    bot.hears('📖 Duo va zikrlar', async (ctx) => {
      await ctx.reply(
        `📖 *Tonggi va kechki zikrlar:*\n\n` +
        `• *Subhanalloh* (33 marta)\n` +
        `• *Alhamdulillah* (33 marta)\n` +
        `• *Allohu Akbar* (34 marta)\n\n` +
        `_«Meni eslangiz, men ham sizni eslayman» (Baqara, 152)_`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('ℹ️ Bot haqida', async (ctx) => {
      await ctx.reply(`Ushbu bot O'zbekiston Musulmonlari idorasi taqvimi asosida ishlaydi.`);
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Namoz Boti — Admin Paneli*\n\nBot faol ishlamoqda.`, { parse_mode: 'Markdown' });
    });
  }
};
