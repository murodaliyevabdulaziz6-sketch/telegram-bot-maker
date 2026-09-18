const { Markup } = require('telegraf');

module.exports = {
  id: 'pul_topar',
  name: '💸 Pul Topar / Daromad Boti',
  description: 'Do\'stlarni taklif qilib, vazifalar bajarib va kunlik bonus olib pul ishlash boti',
  icon: '💸',
  setupBot: (bot, botRecord, db) => {
    const balances = {};
    const lastBonus = {};
    const withdrawRequests = [];

    const getBalance = (userId) => balances[userId] || 1000; // Boshlang'ich 1000 so'm sovg'a

    const menuKeyboard = Markup.keyboard([
      ['💰 Balans', '🎁 Kunlik bonus'],
      ['👥 Do\'stlarni taklif qilish', '📋 Vazifalar'],
      ['💳 Pulni yechish', '📊 Statistika']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      const startPayload = ctx.message.text.split(' ')[1];
      if (startPayload && startPayload !== String(ctx.from.id)) {
        // Referral hisoblash
        const referrerId = parseInt(startPayload);
        if (referrerId) {
          balances[referrerId] = (balances[referrerId] || 1000) + 500;
          try {
            await bot.telegram.sendMessage(referrerId, `🎉 Tabriklaymiz! Sizning taklifingiz orqali yangi do'stingiz qo'shildi va hisobingizga *+500 so'm* berildi!`, { parse_mode: 'Markdown' });
          } catch (e) {}
        }
      }

      if (!balances[ctx.from.id]) {
        balances[ctx.from.id] = 1000;
      }

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `💸 *${botRecord.bot_first_name}* xush kelibsiz!\n` +
        `Bu yerda siz osongina pul ishlab, kartangizga yechib olishingiz mumkin.\n\n` +
        `🎁 Sizga *1,000 so'm* start bonusi berildi!\n` +
        `Har bir taklif qilingan do'stingiz uchun: *500 so'm*!\n\n` +
        `Kerakli bo'limni tanlang:`,
        { parse_mode: 'Markdown', ...menuKeyboard }
      );
    });

    bot.hears('💰 Balans', async (ctx) => {
      const b = getBalance(ctx.from.id);
      await ctx.reply(
        `💰 *Sizning hisobingiz:*\n\n` +
        `🆔 ID: \`${ctx.from.id}\`\n` +
        `💵 Balans: *${b.toLocaleString()} so'm*\n` +
        `📌 Minimal yechib olish summasi: *10,000 so'm*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('🎁 Kunlik bonus', async (ctx) => {
      const now = Date.now();
      const last = lastBonus[ctx.from.id] || 0;
      const hoursLeft = 24 - (now - last) / (1000 * 60 * 60);

      if (hoursLeft > 0 && last !== 0) {
        return ctx.reply(`⏳ Siz bugungi bonusni olgansiz. Keyingi bonusgacha: *${Math.ceil(hoursLeft)} soat* qoldi.`, { parse_mode: 'Markdown' });
      }

      const bonus = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
      balances[ctx.from.id] = getBalance(ctx.from.id) + bonus;
      lastBonus[ctx.from.id] = now;

      await ctx.reply(
        `🎁 Tabriklaymiz! Sizga *+${bonus} so'm* kunlik bonus berildi!\n` +
        `💵 Yangi balansingiz: *${balances[ctx.from.id].toLocaleString()} so'm*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('👥 Do\'stlarni taklif qilish', async (ctx) => {
      const botUser = botRecord.bot_username;
      const refLink = `https://t.me/${botUser}?start=${ctx.from.id}`;
      await ctx.reply(
        `👥 *Do'stlarni taklif qiling va pul ishlang!*\n\n` +
        `Har bir taklif qilingan faol do'stingiz uchun sizga *500 so'm* beriladi.\n\n` +
        `🔗 Sizning maxsus taklif havolangiz:\n${refLink}\n\n` +
        `Ushbu havolani do'stlaringizga va guruhlarga ulashing!`,
        Markup.inlineKeyboard([
          [Markup.button.url('📲 Do\'stlarga yuborish', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Pul ishlovchi bot! Ro\'yxatdan o\'ting va 1000 so\'m bonus oling!')}`)]
        ])
      );
    });

    bot.hears('📋 Vazifalar', async (ctx) => {
      await ctx.reply(
        `📋 *Mavjud pullik vazifalar:*\n\n` +
        `1. Rasmiy kanalimizga a'zo bo'ling (+300 so'm)\n` +
        `2. Hamkor guruhga obuna bo'ling (+200 so'm)\n` +
        `3. Postlarga reaksiya qoldiring (+100 so'm)\n\n` +
        `*Yangi vazifalar tez orada joylanadi!*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('💳 Pulni yechish', async (ctx) => {
      const b = getBalance(ctx.from.id);
      if (b < 10000) {
        return ctx.reply(
          `❌ *Mablag' yetarli emas!*\n\n` +
          `Sizning balansingiz: *${b.toLocaleString()} so'm*\n` +
          `Minimal pul yechish: *10,000 so'm*\n\n` +
          `Do'stlaringizni taklif qilib yoki kunlik bonus olib balansingizni to'ldiring.`,
          { parse_mode: 'Markdown' }
        );
      }

      await ctx.reply(
        `💳 *Pul yechib olish:*\n` +
        `Balansingiz: *${b.toLocaleString()} so'm*\n\n` +
        `Karta yoki hamyon raqamingizni hamda summani quyidagi formatda yozib qoldiring:\n` +
        `*KARTA_RAQAM SUMMA* (Masalan: 8600123456789012 10000)`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('📊 Statistika', async (ctx) => {
      const current = db.getBot(botRecord.id) || botRecord;
      await ctx.reply(
        `📊 *Bot statistikasi:*\n\n` +
        `👥 Foydalanuvchilar: *${current.stats?.users_count || 1} ta*\n` +
        `💸 Jami to'lab berilgan: *${(withdrawRequests.length * 10000).toLocaleString()} so'm*\n` +
        `⚡ Bot holati: *Barqaror va faol*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Pul Topar Boti — Admin Paneli*\n\n` +
        `👥 Foydalanuvchilar: *${Object.keys(balances).length} ta*\n` +
        `📥 Yechib olish so'rovlari: *${withdrawRequests.length} ta*`,
        { parse_mode: 'Markdown' }
      );
    });
  }
};
