const { Markup } = require('telegraf');

module.exports = {
  id: 'custom_buttons',
  name: '🔘 Tugma & Kino Qo\'shadigan Bot',
  description: 'O\'zingiz xohlagan menyu tugmalari (buyruq, matn, havola) va Kino kodlarini bemalol qo\'shish boti',
  icon: '🔘',
  setupBot: (bot, botRecord, db) => {
    // Bot ma'lumotlarini olish va initsializatsiya qilish
    const getBotCustomData = () => {
      const b = db.getBot(botRecord.id);
      if (!b.data) b.data = {};
      const ownerUser = db.getUser(botRecord.owner_id);
      const ownerUsername = ownerUser && ownerUser.username ? `@${ownerUser.username}` : (ownerUser && ownerUser.first_name ? ownerUser.first_name : 'Admin');
      if (!b.data.buttons) {
        b.data.buttons = [
          { id: 'btn_1', title: '🎬 Kinolar', type: 'text', content: 'Kino kodini yuboring (masalan: 101, 777) yoki /kinolar buyrug\'ini bosing!' },
          { id: 'btn_2', title: '📢 Kanalimiz', type: 'url', content: 'https://t.me/telegram' },
          { id: 'btn_3', title: '📞 Aloqa / Admin', type: 'text', content: `Admin bilan bog'lanish: ${ownerUsername}` }
        ];
      }
      if (!b.data.movies) {
        b.data.movies = {
          '1': { title: 'Qasoskorlar: Intiho', link: 'https://t.me/telegram' },
          '101': { title: 'Avatar: Suv Yo\'li', link: 'https://t.me/telegram' },
          '777': { title: 'Forsaj 10', link: 'https://t.me/telegram' }
        };
      }
      return b.data;
    };

    // Klaviatura yasash funksiyasi
    const renderKeyboard = (ctx, customData) => {
      const isOwner = ctx.from && String(ctx.from.id) === String(botRecord.owner_id);
      const rows = [];
      const btns = customData.buttons || [];

      for (let i = 0; i < btns.length; i += 2) {
        const row = [btns[i].title];
        if (btns[i + 1]) row.push(btns[i + 1].title);
        rows.push(row);
      }

      if (isOwner) {
        rows.push(['⚙️ Botni Sozlash (Admin)']);
      }

      return Markup.keyboard(rows).resize();
    };

    const userState = {}; // userId -> { step, temp }

    // /start
    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      const data = getBotCustomData();
      const isOwner = String(ctx.from.id) === String(botRecord.owner_id);
      const firstName = ctx.from.first_name || 'Foydalanuvchi';

      let text = `👋 Assalomu alaykum, *${firstName}*!\n\n` +
        `🤖 *${botRecord.bot_first_name}* ga xush kelibsiz!\n\n` +
        `Kerakli bo'limni tanlash uchun pastdagi tugmalardan foydalaning yoki kino kodini yuboring.`;

      if (isOwner) {
        text += `\n\n👑 *Siz bot egasisiz!*\nYangi tugmalar, buyruqlar va kinolar qo'shish uchun *⚙️ Botni Sozlash (Admin)* tugmasini bosing.`;
      }

      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...renderKeyboard(ctx, data)
      });
    });

    // Kinolar ro'yxati
    bot.command('kinolar', async (ctx) => {
      const data = getBotCustomData();
      const movies = data.movies || {};
      const keys = Object.keys(movies);

      if (keys.length === 0) {
        return ctx.reply('🎬 Hozircha kinolar qo\'shilmagan.');
      }

      let msg = `🎬 *Mavjud Kinolar Ro'yxati:*\n\n`;
      keys.forEach((code) => {
        msg += `🔑 Kod: \`${code}\` — *${movies[code].title}*\n`;
      });
      msg += `\nFilmni ko'rish uchun uning kodini yozib yuboring!`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // Admin boshqaruv menyusi (faqat bot egasiga)
    bot.hears('⚙️ Botni Sozlash (Admin)', async (ctx) => {
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const btnCount = (data.buttons || []).length;
      const movieCount = Object.keys(data.movies || {}).length;

      await ctx.reply(
        `🛠 *Bot Sozlamalari & Boshqaruv:*\n\n` +
        `🔘 Mavjud Tugmalar: *${btnCount} ta*\n` +
        `🎬 Mavjud Kinolar: *${movieCount} ta*\n\n` +
        `Kerakli amalni tanlang:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Yangi Tugma Qo\'shish', 'adm_add_btn')],
            [Markup.button.callback('🎬 Yangi Kino Qo\'shish', 'adm_add_movie')],
            [Markup.button.callback('📋 Tugmalar Ro\'yxati / O\'chirish', 'adm_list_btns')],
            [Markup.button.callback('🎥 Kinolar Ro\'yxati / O\'chirish', 'adm_list_movies')],
            [Markup.button.callback('❌ Menyuni Yopish', 'adm_close')]
          ])
        }
      );
    });

    // Inline callbacklar
    bot.action('adm_close', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
    });

    // 1. Yangi tugma qo'shish
    bot.action('adm_add_btn', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      userState[ctx.from.id] = { step: 'btn_title' };
      await ctx.reply(
        `📝 *1-Qadam:* Yangi tugma nomini kiriting:\n\n` +
        `Masalan: \`📱 Biz haqimizda\`, \`💰 Narxlar\`, \`🚀 VIP Kanal\`\n\n` +
        `Bekor qilish uchun: /cancel`,
        { parse_mode: 'Markdown' }
      );
    });

    // 2. Yangi kino qo'shish
    bot.action('adm_add_movie', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      userState[ctx.from.id] = { step: 'movie_code' };
      await ctx.reply(
        `🎬 *1-Qadam:* Yangi kino uchun *KOD* (raqam) kiriting:\n\n` +
        `Masalan: \`12\`, \`505\`, \`999\`\n\n` +
        `Bekor qilish uchun: /cancel`,
        { parse_mode: 'Markdown' }
      );
    });

    // Tugmalar ro'yxati
    bot.action('adm_list_btns', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const btns = data.buttons || [];

      if (btns.length === 0) {
        return ctx.reply('Tugmalar mavjud emas.');
      }

      const rows = btns.map((b) => [
        Markup.button.callback(`🗑 O'chirish: ${b.title}`, `del_btn_${b.id}`)
      ]);
      rows.push([Markup.button.callback('⬅️ Orqaga', 'adm_close')]);

      await ctx.reply('📋 O\'chirmoqchi bo\'lgan tugmangizni tanlang:', Markup.inlineKeyboard(rows));
    });

    // Tugmani o'chirish
    bot.action(/del_btn_(.*)/, async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;
      const btnId = ctx.match[1];

      db.updateBotData(botRecord.id, (b) => {
        if (b.data && b.data.buttons) {
          b.data.buttons = b.data.buttons.filter(x => x.id !== btnId);
        }
      });

      const updated = getBotCustomData();
      await ctx.reply(`✅ Tugma o'chirildi!`, renderKeyboard(ctx, updated));
    });

    // Kinolar ro'yxati va o'chirish
    bot.action('adm_list_movies', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const movies = data.movies || {};
      const keys = Object.keys(movies);

      if (keys.length === 0) {
        return ctx.reply('Kinolar mavjud emas.');
      }

      const rows = keys.slice(0, 10).map((code) => [
        Markup.button.callback(`🗑 O'chirish: [${code}] ${movies[code].title}`, `del_mov_${code}`)
      ]);
      rows.push([Markup.button.callback('⬅️ Orqaga', 'adm_close')]);

      await ctx.reply('🎬 O\'chirmoqchi bo\'lgan kinoni tanlang:', Markup.inlineKeyboard(rows));
    });

    bot.action(/del_mov_(.*)/, async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;
      const code = ctx.match[1];

      db.updateBotData(botRecord.id, (b) => {
        if (b.data && b.data.movies) {
          delete b.data.movies[code];
        }
      });

      await ctx.reply(`✅ [${code}] kodi bilan saqlangan kino o'chirildi!`);
    });

    // /cancel
    bot.command('cancel', async (ctx) => {
      delete userState[ctx.from.id];
      const data = getBotCustomData();
      await ctx.reply('❌ Amal bekor qilindi.', renderKeyboard(ctx, data));
    });

    // Matn va qadamlarni boshqarish
    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      const userId = ctx.from.id;
      const isOwner = String(userId) === String(botRecord.owner_id);
      const state = userState[userId];
      const data = getBotCustomData();

      // QADAM 1: Tugma sarlavhasi
      if (state && state.step === 'btn_title' && isOwner) {
        state.title = text;
        state.step = 'btn_content';
        return ctx.reply(
          `✅ Tugma nomi: *${text}*\n\n` +
          `📝 *2-Qadam:* Foydalanuvchi ushbu tugmani bosganda bot nima deb javob bersin?\n` +
          `Istalgan matn, ma'lumot yoki havola yozing:`,
          { parse_mode: 'Markdown' }
        );
      }

      // QADAM 2: Tugma javobi
      if (state && state.step === 'btn_content' && isOwner) {
        const title = state.title;
        const content = text;
        const newBtn = {
          id: 'btn_' + Date.now(),
          title: title,
          type: 'text',
          content: content
        };

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.buttons) b.data.buttons = [];
          b.data.buttons.push(newBtn);
        });

        delete userState[userId];
        const updated = getBotCustomData();

        return ctx.reply(
          `🎉 *Tabriklaymiz!*\n\n` +
          `Yangi tugma: *"${title}"* muvaffaqiyatli qo'shildi va pastdagi menyuga joylashtirildi! 👇`,
          {
            parse_mode: 'Markdown',
            ...renderKeyboard(ctx, updated)
          }
        );
      }

      // KINO QADAM 1: Kodi
      if (state && state.step === 'movie_code' && isOwner) {
        state.code = text;
        state.step = 'movie_title';
        return ctx.reply(
          `✅ Film kodi: \`${text}\`\n\n` +
          `🎬 *2-Qadam:* Film nomini kiriting (Masalan: *Avatar 3*, *Forsaj 11*):`,
          { parse_mode: 'Markdown' }
        );
      }

      // KINO QADAM 2: Nomi
      if (state && state.step === 'movie_title' && isOwner) {
        state.movie_title = text;
        state.step = 'movie_link';
        return ctx.reply(
          `✅ Film nomi: *${text}*\n\n` +
          `🔗 *3-Qadam:* Filmni ko'rish yoki yuklab olish havolasini (Telegram kanal yoki sayt ssilkasi) kiriting:`,
          { parse_mode: 'Markdown' }
        );
      }

      // KINO QADAM 3: Ssilkasi
      if (state && state.step === 'movie_link' && isOwner) {
        const code = state.code;
        const movieTitle = state.movie_title;
        const link = text;

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.movies) b.data.movies = {};
          b.data.movies[code] = {
            title: movieTitle,
            link: link
          };
        });

        delete userState[userId];
        const updated = getBotCustomData();

        return ctx.reply(
          `🎉 *Kino qo'shildi!*\n\n` +
          `🔑 Kodi: \`${code}\`\n` +
          `🎬 Nomi: *${movieTitle}*\n` +
          `🔗 Havola: ${link}\n\n` +
          `Endi foydalanuvchilar \`${code}\` deb yozsa bot darhol shu kinoni beradi!`,
          {
            parse_mode: 'Markdown',
            ...renderKeyboard(ctx, updated)
          }
        );
      }

      // Agar oddiy foydalanuvchi biror menyu tugmasini bosgan bo'lsa
      const matchedBtn = (data.buttons || []).find(b => b.title === text);
      if (matchedBtn) {
        return ctx.reply(matchedBtn.content);
      }

      // Agar kino kodini yozgan bo'lsa
      const movie = (data.movies || {})[text];
      if (movie) {
        return ctx.reply(
          `🎬 *Topilgan Film:*\n\n` +
          `📌 Nomi: *${movie.title}*\n` +
          `🔑 Kodi: \`${text}\`\n\n` +
          `Tomosha qilish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('▶️ Filmni Tomosha Qilish', movie.link)]
            ])
          }
        );
      }

      // Boshqa matn bo'lsa
      if (!text.startsWith('/')) {
        await ctx.reply(
          `ℹ️ Siz yozgan buyruq yoki kino kodi topilmadi.\n` +
          `Menyudagi tugmalardan foydalaning yoki /kinolar buyrug'ini bosing!`,
          renderKeyboard(ctx, data)
        );
      }
    });
  }
};