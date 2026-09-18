const { Markup } = require('telegraf');

module.exports = {
  id: 'autopost',
  name: '📢 Avto-Post & Inline Tugmali Post Boti',
  description: 'Telegram kanallar uchun chiroyli inline havolali tugmali postlar yaratuvchi bot',
  icon: '📢',
  setupBot: (bot, botRecord, db) => {
    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `📢 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu bot orqali kanalingiz uchun chiroyli ko'rinishdagi tugmali (inline link) postlar tayyorlashingiz mumkin.\n\n` +
        `Post yaratish uchun matn va tugmalarni quyidagi formatda yuboring:\n\n` +
        `*Post matni* | *Tugma nomi* - *https://havola.uz*\n\n` +
        `Misol:\n` +
        `\`Yangi aksiya boshlandi! | Kanalimizga obuna bo'ling - https://t.me/telegram\``,
        { parse_mode: 'Markdown' }
      );
    });

    bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith('/')) return;

      if (!text.includes('|') || !text.includes('-')) {
        return ctx.reply(
          `⚠️ Iltimos, postni to'g'ri formatda yuboring:\n\n` +
          `*Matn | Tugma matni - Havola (URL)*\n\n` +
          `Misol:\n\`Bizning rasmiy kanalimiz | Kanalga o'tish - https://t.me/telegram\``,
          { parse_mode: 'Markdown' }
        );
      }

      const parts = text.split('|');
      const content = parts[0].trim();
      const btnPart = parts[1].trim().split('-');
      const btnTitle = btnPart[0].trim();
      const btnUrl = btnPart[1].trim();

      try {
        await ctx.reply(content, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url(btnTitle, btnUrl)]
          ])
        });
        await ctx.reply('👆 Sizning tugmali postingiz tayyor! Uni kanalingizga forward qilishingiz mumkin.');
      } catch (err) {
        await ctx.reply('❌ Havola noto\'g\'ri kiritildi. Havola https:// bilan boshlanishi kerak.');
      }
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Avto-Post Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};
