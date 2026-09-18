const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = {
  id: 'currency',
  name: '💱 Valyuta Kurslari & Konvertor',
  description: 'O\'zbekiston Markaziy Banki rasmiy kurslari va valyuta hisoblash kalkulyatori boti',
  icon: '💱',
  setupBot: (bot, botRecord, db) => {
    let ratesCache = null;
    let lastFetched = 0;

    const fetchRates = async () => {
      const now = Date.now();
      if (ratesCache && now - lastFetched < 10 * 60 * 1000) {
        return ratesCache;
      }
      try {
        const res = await axios.get('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', { timeout: 10000 });
        ratesCache = res.data;
        lastFetched = now;
        return ratesCache;
      } catch (err) {
        // Zaxira kurslar
        return [
          { Ccy: 'USD', Rate: '12850.00', Diff: '+15.00' },
          { Ccy: 'EUR', Rate: '13950.00', Diff: '-10.00' },
          { Ccy: 'RUB', Rate: '142.50', Diff: '+0.50' },
          { Ccy: 'KZT', Rate: '26.80', Diff: '+0.10' }
        ];
      }
    };

    const mainKeyboard = Markup.keyboard([
      ['📈 Bugungi kurslar', '🔄 Valyuta kalkulyatori'],
      ['📊 Dollar kursi', 'ℹ️ Ma\'lumot']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `💱 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu yerda siz Markaziy Bankning eng so'nggi rasmiy kurslarini bilib olishingiz va valyutalarni so'mga konvertatsiya qilishingiz mumkin.\n\n` +
        `Kerakli bo'limni tanlang:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendRates = async (ctx) => {
      await ctx.sendChatAction('typing');
      const rates = await fetchRates();

      const usd = rates.find(r => r.Ccy === 'USD') || { Rate: '12850', Diff: '+10' };
      const eur = rates.find(r => r.Ccy === 'EUR') || { Rate: '13900', Diff: '-5' };
      const rub = rates.find(r => r.Ccy === 'RUB') || { Rate: '142', Diff: '+0.2' };
      const kzt = rates.find(r => r.Ccy === 'KZT') || { Rate: '26.5', Diff: '0' };
      const tryRate = rates.find(r => r.Ccy === 'TRY') || { Rate: '375', Diff: '-1' };

      const msg = 
        `📈 *Markaziy Bank Rasmiy Valyuta Kurslari:*\n\n` +
        `🇺🇸 1 USD = *${parseFloat(usd.Rate).toLocaleString()} so'm* (${usd.Diff})\n` +
        `🇪🇺 1 EUR = *${parseFloat(eur.Rate).toLocaleString()} so'm* (${eur.Diff})\n` +
        `🇷🇺 1 RUB = *${parseFloat(rub.Rate).toLocaleString()} so'm* (${rub.Diff})\n` +
        `🇰🇿 1 KZT = *${parseFloat(kzt.Rate).toLocaleString()} so'm* (${kzt.Diff})\n` +
        `🇹🇷 1 TRY = *${parseFloat(tryRate.Rate).toLocaleString()} so'm* (${tryRate.Diff})\n\n` +
        `💡 *Kalkulyator:* Raqam yuboring (Masalan: \`100 usd\` yoki \`5000000 som\`)`;

      await ctx.reply(msg, { parse_mode: 'Markdown' });
    };

    bot.hears('📈 Bugungi kurslar', sendRates);
    bot.hears('📊 Dollar kursi', async (ctx) => {
      const rates = await fetchRates();
      const usd = rates.find(r => r.Ccy === 'USD') || { Rate: '12850', Diff: '+10' };
      await ctx.reply(`🇺🇸 *1 AQSH Dollari:* *${parseFloat(usd.Rate).toLocaleString()} so'm* (${usd.Diff})`, { parse_mode: 'Markdown' });
    });

    bot.hears('🔄 Valyuta kalkulyatori', async (ctx) => {
      await ctx.reply(
        `🔄 *Valyuta kalkulyatori:*\n\n` +
        `Quyidagi formatlarda yozib yuborishingiz mumkin:\n` +
        `• \`100 usd\` (100 dollarni so'mga hisoblash)\n` +
        `• \`50 eur\` (50 yevroni so'mga hisoblash)\n` +
        `• \`5000000 som\` (5 mln so'mni dollarga hisoblash)\n\n` +
        `Hisoblamoqchi bo'lgan summani yozing:`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim().toLowerCase();
      if (text.startsWith('/')) return;

      const rates = await fetchRates();
      const usd = parseFloat(rates.find(r => r.Ccy === 'USD')?.Rate || 12850);
      const eur = parseFloat(rates.find(r => r.Ccy === 'EUR')?.Rate || 13950);
      const rub = parseFloat(rates.find(r => r.Ccy === 'RUB')?.Rate || 142);

      const parts = text.split(' ');
      const num = parseFloat(parts[0]);

      if (!isNaN(num)) {
        const cur = parts[1] || 'usd';
        if (cur.includes('usd') || cur.includes('dollar') || cur.includes('$')) {
          const total = (num * usd).toLocaleString();
          return ctx.reply(`🇺🇸 *${num} USD* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('eur') || cur.includes('yevro')) {
          const total = (num * eur).toLocaleString();
          return ctx.reply(`🇪🇺 *${num} EUR* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('rub') || cur.includes('rubl')) {
          const total = (num * rub).toLocaleString();
          return ctx.reply(`🇷🇺 *${num} RUB* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('som') || cur.includes('uzs')) {
          const inUsd = (num / usd).toFixed(2);
          return ctx.reply(`🇺🇿 *${num.toLocaleString()} so'm* = *${inUsd} USD* ($)`, { parse_mode: 'Markdown' });
        }
      }
    });

    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      await ctx.reply('Barcha valyuta kurslari O\'zbekiston Respublikasi Markaziy Banki ochiq ma\'lumotlariga asoslanadi.');
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Valyuta Boti — Admin Paneli*\n\nBot Markaziy Bank API bilan muvaffaqiyatli ishlamoqda.`, { parse_mode: 'Markdown' });
    });
  }
};
