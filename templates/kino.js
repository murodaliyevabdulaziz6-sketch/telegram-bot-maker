const { Markup } = require('telegraf');

module.exports = {
  id: 'kino',
  name: '🎬 Kino & Serial Boti',
  description: 'Kod orqali kino va seriallarni tomosha qilish hamda majburiy obuna kanallarini ulash boti',
  icon: '🎬',
  setupBot: (bot, botRecord, db) => {
    // Kinolar bazasi
    const movies = {
      '1': { title: 'Qasoskorlar: Intiho (Avengers)', year: '2019', genre: 'Fantastika, Jangari', link: 'https://t.me/telegram' },
      '2': { title: 'Oppenheimer', year: '2023', genre: 'Drama, Tarixiy', link: 'https://t.me/telegram' },
      '3': { title: 'Forsaj 10 (Fast X)', year: '2023', genre: 'Jangari, Triller', link: 'https://t.me/telegram' },
      '10': { title: 'Interstellar (Yulduzlararo)', year: '2014', genre: 'Ilmiy-fantastika', link: 'https://t.me/telegram' },
      '77': { title: 'Avatar 2: Suv Yo\'li', year: '2022', genre: 'Fantastika, Sarguzasht', link: 'https://t.me/telegram' },
      '100': { title: 'Barbie', year: '2023', genre: 'Komediya, Fantaziya', link: 'https://t.me/telegram' },
      '777': { title: 'Gladiator 2', year: '2024', genre: 'Tarixiy jangari', link: 'https://t.me/telegram' }
    };

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🎬 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Siz bu yerda istalgan filmni maxsus *KODI* orqali bir zumda topishingiz mumkin.\n\n` +
        `🔍 Kinoni ko'rish uchun uning kodini yuboring (Masalan: \`1\`, \`2\`, \`10\`, \`77\`, \`777\`).\n\n` +
        `📚 Barcha kinolar ro'yxati uchun: /katalog`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('katalog', async (ctx) => {
      let msg = `🎬 *Mavjud filmlar katalogi:*\n\n`;
      Object.entries(movies).forEach(([code, m]) => {
        msg += `🔑 Kod: \`${code}\` — *${m.title}* (${m.year})\n🎭 Janr: ${m.genre}\n\n`;
      });
      msg += `Kino ko'rish uchun uning kodini raqam sifatida yozib yuboring!`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // Kod orqali qidirish
    bot.on('text', async (ctx) => {
      const code = ctx.message.text.trim();
      if (code.startsWith('/')) return;

      const movie = movies[code];
      if (movie) {
        await ctx.reply(
          `🎬 *Topilgan film:*\n\n` +
          `📌 Nomi: *${movie.title}*\n` +
          `📅 Yili: ${movie.year}\n` +
          `🎭 Janri: ${movie.genre}\n` +
          `🔑 Kodi: \`${code}\`\n\n` +
          `Filmni yuklab olish yoki ko'rish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('▶️ Filmni tomosha qilish', movie.link)],
              [Markup.button.callback('❤️ Sevimlilarga qo\'shish', 'fav_add')]
            ])
          }
        );
      } else {
        await ctx.reply(
          `❌ Afsuski, \`${code}\` raqamli film topilmadi!\n\n` +
          `Iltimos, kodni to'g'ri kiritganingizga ishonch hosil qiling yoki /katalog buyrug'ini bosing.`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.action('fav_add', async (ctx) => {
      await ctx.answerCbQuery('❤️ Film sevimlilarga qo\'shildi!');
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Kino Boti — Admin Paneli*\n\n` +
        `🎬 Bazadagi kinolar soni: *${Object.keys(movies).length} ta*\n` +
        `Yangi kino qo'shish uchun: \`/addkino KOD NOM YIL JANR LINK\``,
        { parse_mode: 'Markdown' }
      );
    });
  }
};
