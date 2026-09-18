const { Markup } = require('telegraf');

module.exports = {
  id: 'quotes',
  name: '✨ Status & Aforizmlar Boti',
  description: 'Har kungi motivatsiya, ibratli so\'zlar, donishmandlar hikmati va ajoyib statuslar boti',
  icon: '✨',
  setupBot: (bot, botRecord, db) => {
    const quotesList = [
      "«Muvaffaqiyat — bu yiqilmaslikda emas, har yiqilganda qayta tura olishda.» — Konfutsiy",
      "«Agar orzularingiz sizni qo'rqitmasa, demak ular yetarlicha katta emas.» — Richard Brenson",
      "«Bugun qilgan mehnatingiz — ertangi kuningizning poydevoridir.»",
      "«Vaqt — eng qimmatli boylik, uni behuda narsalarga sarflamang.» — Stiv Jobs",
      "«Katta maqsadlarga erishish uchun kichik qadamlardan boshlash kerak.» — Lao Tszı",
      "«Bilim — eng qudratli quroldir, uning yordamida dunyoni o'zgartirish mumkin.» — Nelson Mandela",
      "«Haqiqiy do'st — butun dunyo sendan yuz o'girganda ham yoningda qolgan insondir.»",
      "«Sabr — achchiq daraxt, lekin uning mevasi juda shirin.»",
      "«O'z ustingda ishlashdan to'xtama, har kuni kechagidan yaxshiroq bo'lishga intil!»"
    ];

    const mainKeyboard = Markup.keyboard([
      ['🎲 Tasodifiy aforizm', '🔥 Motivatsiya'],
      ['💡 Biznes & Muvaffaqiyat', 'ℹ️ Bot haqida']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `✨ *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu yerda siz o'zingiz uchun ilhom, motivatsiya va ibratli hikmatlarni topishingiz mumkin.\n\n` +
        `Quyidagi tugmalardan birini bosing:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendRandomQuote = async (ctx) => {
      const q = quotesList[Math.floor(Math.random() * quotesList.length)];
      await ctx.reply(
        `✨ *Ibratli so'z:*\n\n${q}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🎲 Boshqa aforizm', 'next_quote')],
            [Markup.button.url('📲 Do\'stlarga ulashish', `https://t.me/share/url?url=${encodeURIComponent('https://t.me/' + botRecord.bot_username)}&text=${encodeURIComponent(q)}`)]
          ])
        }
      );
    };

    bot.hears('🎲 Tasodifiy aforizm', sendRandomQuote);
    bot.hears('🔥 Motivatsiya', sendRandomQuote);
    bot.hears('💡 Biznes & Muvaffaqiyat', sendRandomQuote);

    bot.action('next_quote', async (ctx) => {
      await ctx.answerCbQuery();
      await sendRandomQuote(ctx);
    });

    bot.hears('ℹ️ Bot haqida', async (ctx) => {
      await ctx.reply("Kundalik hayotingizga ma'no va energiya bag'ishlovchi iqtiboslar to'plami.");
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Status Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};
