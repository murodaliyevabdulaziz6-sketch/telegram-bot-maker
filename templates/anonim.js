const { Markup } = require('telegraf');

module.exports = {
  id: 'anonim',
  name: '🎭 Anonim Chat Boti',
  description: 'Begona odamlar bilan sirli va anonim muloqot qilish boti',
  icon: '🎭',
  setupBot: (bot, botRecord, db) => {
    // Navbatdagi va faol chatdoshlar
    let queue = [];
    const activeChats = {}; // userId -> partnerId

    const chatKeyboard = Markup.keyboard([
      ['🛑 Suhbatni to\'xtatish', '➡️ Keyingi suhbatdosh']
    ]).resize();

    const startKeyboard = Markup.keyboard([
      ['🔎 Yangi suhbatdosh qidirish']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🎭 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu yerda siz butunlay anonim holda tasodifiy insonlar bilan suhbatlashishingiz mumkin. Shaxsingiz va profilingiz sir saqlanadi.\n\n` +
        `Suhbatni boshlash uchun quyidagi tugmani bosing:`,
        { parse_mode: 'Markdown', ...startKeyboard }
      );
    });

    const startSearch = async (ctx) => {
      const userId = ctx.from.id;

      if (activeChats[userId]) {
        return ctx.reply('Siz allaqachon suhbatdasiz! To\'xtatish uchun: 🛑 Suhbatni to\'xtatish');
      }

      if (queue.includes(userId)) {
        return ctx.reply('⏳ Suhbatdosh qidirilmoqda... Iltimos kuting.');
      }

      // Navbatda odam bormi?
      if (queue.length > 0) {
        const partnerId = queue.shift();
        if (partnerId !== userId) {
          activeChats[userId] = partnerId;
          activeChats[partnerId] = userId;

          await ctx.reply('🎉 *Suhbatdosh topildi!* Salom deb yozing!', { parse_mode: 'Markdown', ...chatKeyboard });
          try {
            await bot.telegram.sendMessage(partnerId, '🎉 *Suhbatdosh topildi!* Salom deb yozing!', { parse_mode: 'Markdown', ...chatKeyboard });
          } catch (e) {}
          return;
        }
      }

      queue.push(userId);
      await ctx.reply('🔎 Suhbatdosh qidirilmoqda... Yangi foydalanuvchi ulanganda xabar beramiz.');
    };

    bot.hears('🔎 Yangi suhbatdosh qidirish', startSearch);
    bot.command('search', startSearch);

    const stopChat = async (ctx) => {
      const userId = ctx.from.id;
      const partnerId = activeChats[userId];

      queue = queue.filter(id => id !== userId);

      if (partnerId) {
        delete activeChats[userId];
        delete activeChats[partnerId];

        await ctx.reply('🛑 Siz suhbatni to\'xtatdingiz.', startKeyboard);
        try {
          await bot.telegram.sendMessage(partnerId, '🛑 Suhbatdoshingiz muloqotni yakunladi.', startKeyboard);
        } catch (e) {}
      } else {
        await ctx.reply('Siz hozir hech kim bilan gaplashmayapsiz.', startKeyboard);
      }
    };

    bot.hears('🛑 Suhbatni to\'xtatish', stopChat);
    bot.command('stop', stopChat);

    bot.hears('➡️ Keyingi suhbatdosh', async (ctx) => {
      await stopChat(ctx);
      await startSearch(ctx);
    });

    // Xabarlarni o'zaro uzatish
    bot.on('message', async (ctx) => {
      const text = ctx.message.text;
      if (text && (text.startsWith('/') || ['🔎 Yangi suhbatdosh qidirish', '🛑 Suhbatni to\'xtatish', '➡️ Keyingi suhbatdosh'].includes(text))) {
        return;
      }

      const partnerId = activeChats[ctx.from.id];
      if (partnerId) {
        try {
          if (ctx.message.text) {
            await bot.telegram.sendMessage(partnerId, ctx.message.text);
          } else if (ctx.message.photo) {
            const photo = ctx.message.photo.pop().file_id;
            await bot.telegram.sendPhoto(partnerId, photo, { caption: ctx.message.caption });
          } else if (ctx.message.voice) {
            await bot.telegram.sendVoice(partnerId, ctx.message.voice.file_id);
          } else if (ctx.message.sticker) {
            await bot.telegram.sendSticker(partnerId, ctx.message.sticker.file_id);
          }
        } catch (err) {
          ctx.reply('⚠️ Xabarni yuborib bo\'lmadi.');
        }
      } else {
        await ctx.reply('Siz hech kim bilan ulanmagansiz. "🔎 Yangi suhbatdosh qidirish" tugmasini bosing.');
      }
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Anonim Chat Boti — Admin Paneli*\n\n` +
        `👥 Faol jonli suhbatlar: *${Object.keys(activeChats).length / 2} juftlik*\n` +
        `⏳ Navbatda kutayotganlar: *${queue.length} kishi*`,
        { parse_mode: 'Markdown' }
      );
    });
  }
};
