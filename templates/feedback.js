module.exports = {
  id: 'feedback',
  name: '📩 Qabul / Aloqa (Feedback) Boti',
  description: 'Mijozlardan murojaat va savollarni qabul qilib, adminga yetkazuvchi va javob qaytaruvchi bot',
  icon: '📩',
  setupBot: (bot, botRecord, db) => {
    // Xabarlar mosligi: adminMessageId -> userOriginalChatId
    const replyMapping = {};

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `📩 *${botRecord.bot_first_name}* qabul botiga xush kelibsiz!\n\n` +
        `Siz bu yerda o'z savol, taklif, shikoyat yoki murojaatingizni yozib qoldirishingiz mumkin. Xabaringiz to'g'ridan-to'g'ri administratorga yetkaziladi va sizga shu bot orqali javob qaytariladi.\n\n` +
        `Murojaatingizni yozing yoki rasm/ovoz yuboring: 👇`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Aloqa Boti — Admin Paneli*\n\n` +
        `Mijozlar sizga xabar yuborganda, bot ularni sizga jo'natadi.\n` +
        `Mijozga javob berish uchun o'sha xabarga shunchaki *Reply (Javob berish)* qilib yozing!`,
        { parse_mode: 'Markdown' }
      );
    });

    // Foydalanuvchi yoki admin xabar yozganda
    bot.on('message', async (ctx) => {
      const isOwner = ctx.from.id === botRecord.owner_id || db.isAdmin(ctx.from.id);

      // Agar admin xabarga reply qilayotgan bo'lsa
      if (isOwner && ctx.message.reply_to_message) {
        const originalAdminMsgId = ctx.message.reply_to_message.message_id;
        const targetUserId = replyMapping[originalAdminMsgId];

        if (targetUserId) {
          try {
            await bot.telegram.sendMessage(
              targetUserId,
              `📩 *Administratordan javob:*\n\n${ctx.message.text || 'Fayl biriktirildi'}`,
              { parse_mode: 'Markdown' }
            );
            return ctx.reply('✅ Javobingiz foydalanuvchiga muvaffaqiyatli yetkazildi!');
          } catch (err) {
            return ctx.reply('❌ Foydalanuvchiga javob yetkazilmadi (botni bloklagan bo\'lishi mumkin).');
          }
        }
      }

      // Agar oddiy foydalanuvchi murojaat yuborayotgan bo'lsa
      if (!isOwner) {
        const user = ctx.from;
        const userInfo = `👤 *Yangi murojaat!*\n` +
          `Ism: ${user.first_name} ${user.last_name || ''}\n` +
          `Username: @${user.username || 'mavjud emas'}\n` +
          `ID: \`${user.id}\`\n\n` +
          `💬 *Xabar matni:*`;

        try {
          // Adminga forward / xabar jo'natish
          const sent = await bot.telegram.sendMessage(botRecord.owner_id, userInfo, { parse_mode: 'Markdown' });
          const forwarded = await bot.telegram.forwardMessage(botRecord.owner_id, ctx.chat.id, ctx.message.message_id);

          // replyMapping saqlash
          replyMapping[forwarded.message_id] = user.id;
          replyMapping[sent.message_id] = user.id;

          await ctx.reply('✅ Xabaringiz qabul qilindi va adminga yetkazildi! Tez orada javob olasiz.');
        } catch (err) {
          console.error('Feedback xabar yuborishda xatolik:', err);
          await ctx.reply('⚠️ Xabarni adminga yetkazishda xatolik yuz berdi.');
        }
      }
    });
  }
};
