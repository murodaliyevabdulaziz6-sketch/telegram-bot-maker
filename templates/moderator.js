module.exports = {
  id: 'moderator',
  name: '🛡 Guruh Nazoratchisi (Moderator)',
  description: 'Guruhlarda spam, reklama havolalar va haqoratlarni tozalovchi, yangi a\'zolarni kutib oluvchi bot',
  icon: '🛡',
  setupBot: (bot, botRecord, db) => {
    const badWords = ['ahmoq', 'tentak', 'jinni', 'haromi', 'padarlanat', 'dalbayob', 'yiban', 'suka', 'blin', 'blyad'];

    bot.command('start', async (ctx) => {
      if (ctx.chat.type === 'private') {
        await ctx.reply(
          `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
          `🛡 *${botRecord.bot_first_name}* guruh nazoratchi boti.\n\n` +
          `Meni guruhingizga qo'shing va *ADMIN* qiling. Men quyidagilarni avtomatik bajaraman:\n` +
          `• Yangi a'zolarni chiroyli tabrik bilan kutib olish\n` +
          `• Guruhdagi reklama va begona havolalarni (linklarni) o'chirish\n` +
          `• So'kingan va behayo so'zlarni filtrlab tozalash\n` +
          `• Guruh a'zolariga tartib-intizom o'rnatish!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(`🛡 *Guruh nazoratchisi ishga tushdi!* Men guruh xavfsizligini ta'minlayman.`, { parse_mode: 'Markdown' });
      }
    });

    // Yangi a'zolar qo'shilganda kutib olish
    bot.on('new_chat_members', async (ctx) => {
      for (const member of ctx.message.new_chat_members) {
        if (member.id === ctx.botInfo.id) {
          await ctx.reply('👋 Rahmat! Meni guruhingizga qo\'shganingizdan xursandman. To\'liq ishlashim uchun menga administrator huquqini bering.');
        } else {
          await ctx.reply(`👋 Xush kelibsiz guruhimizga, *${member.first_name}*! Guruh qoidalariga rioya qiling!`, { parse_mode: 'Markdown' });
        }
      }
      try {
        await ctx.deleteMessage();
      } catch (e) {}
    });

    // A'zo guruhdan chiqqanda xabarni tozalash
    bot.on('left_chat_member', async (ctx) => {
      try {
        await ctx.deleteMessage();
      } catch (e) {}
    });

    // Xabarlarni tekshirish (Spam, link, so'kinish)
    bot.on('message', async (ctx, next) => {
      if (ctx.chat.type === 'private') return next();

      const text = ctx.message.text || ctx.message.caption || '';
      const lower = text.toLowerCase();

      // 1. Reklama va linklar tekshiruvi
      const hasLink = /(https?:\/\/|t\.me\/|telegram\.me\/|@\w+|www\.)/i.test(text);
      if (hasLink) {
        try {
          await ctx.deleteMessage();
          await ctx.reply(`⚠️ [${ctx.from.first_name}](tg://user?id=${ctx.from.id}), guruhda reklama va havolalar tarqatish taqiqlangan!`, { parse_mode: 'Markdown' });
          return;
        } catch (e) {}
      }

      // 2. Haqoratli so'zlar tekshiruvi
      const hasBadWord = badWords.some(w => lower.includes(w));
      if (hasBadWord) {
        try {
          await ctx.deleteMessage();
          await ctx.reply(`⛔ [${ctx.from.first_name}](tg://user?id=${ctx.from.id}), iltimos odob saqlang! Guruhda haqorat qilish taqiqlangan!`, { parse_mode: 'Markdown' });
          return;
        } catch (e) {}
      }

      return next();
    });

    // Guruh admin buyruqlari
    bot.command('ban', async (ctx) => {
      if (ctx.chat.type === 'private') return;
      if (!ctx.message.reply_to_message) return ctx.reply('Ushbu buyruqni jazolamoqchi bo\'lgan odamning xabariga reply qilib yozing!');

      try {
        const targetUser = ctx.message.reply_to_message.from;
        await ctx.banChatMember(targetUser.id);
        await ctx.reply(`🚫 [${targetUser.first_name}](tg://user?id=${targetUser.id}) guruhdan haydaldi (Ban qilindi)!`, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply('❌ Botda a\'zoni ban qilish uchun adminlik huquqi yetarli emas.');
      }
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Guruh Nazoratchisi Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};
