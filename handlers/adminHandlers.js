const { Markup } = require('telegraf');
const db = require('../database/db');
const botManager = require('../core/botManager');
const keyboards = require('../core/keyboards');
const { getTemplate } = require('../templates');
const config = require('../config');
const { cleanName } = require('../core/helpers');

module.exports = (bot) => {
  const adminStates = {}; // adminId -> { state: 'waiting_broadcast' | 'waiting_add_admin' }

  // Admin panel ochish
  const openAdminPanel = async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) {
      return ctx.reply('⛔ Kechirasiz, sizda administrator huquqi mavjud emas.');
    }

    const isOwner = db.isOwner(ctx.from.id);
    const isPublic = db.isWebappPublic();
    const stats = db.getStats();

    await ctx.reply(
      `👑 *Asosiy Administrator Paneli*\n\n` +
      `Sizning maqomingiz: *${isOwner ? '👑 Bosh Admin (Ega)' : '🛡 Yordamchi Admin'}*\n` +
      `Web App holati: *${isPublic ? '🟢 Hamma uchun ochiq (ON)' : '🔴 Faqat admin uchun (OFF)'}*\n\n` +
      `Quyidagi boshqaruv bo'limlaridan birini tanlang:`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getAdminKeyboard(isOwner, isPublic, ctx.from.id)
      }
    );
  };

  bot.hears('👑 Admin Panel', openAdminPanel);
  bot.command('admin', openAdminPanel);

  // Web App ON/OFF almashtirish
  bot.action('admin_toggle_webapp', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const newStatus = db.toggleWebappPublic();
    const isOwner = db.isOwner(ctx.from.id);

    await ctx.answerCbQuery(
      newStatus ? '🟢 Web App barcha foydalanuvchilar uchun yoqildi!' : '🔴 Web App faqat adminlar uchun belgilandi!'
    );

    try {
      await ctx.editMessageText(
        `👑 *Asosiy Administrator Paneli*\n\n` +
        `Sizning maqomingiz: *${isOwner ? '👑 Bosh Admin (Ega)' : '🛡 Yordamchi Admin'}*\n` +
        `Web App holati: *${newStatus ? '🟢 Hamma uchun ochiq (ON)' : '🔴 Faqat admin uchun (OFF)'}*\n\n` +
        `Quyidagi boshqaruv bo'limlaridan birini tanlang:`,
        {
          parse_mode: 'Markdown',
          ...keyboards.getAdminKeyboard(isOwner, newStatus, ctx.from.id)
        }
      );
    } catch (e) {}
  });

  // Yangilanishlar tarixi (Faqat Ega / Adminlar uchun)
  const showUpdatesInfo = async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    if (ctx.callbackQuery) await ctx.answerCbQuery();

    const updatesText = 
      `✨ *BOT KONSTRUKTORI — SO'NGGI YANGILANISHLAR (v2.5)*\n\n` +
      `Hurmatli Bot Egasi, botingizga quyidagi barcha yangi funksiyalar va yaxshilanishlar qo'shildi:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 *1. TELEGRAM WEB APP (MINI APP) BOSHQARUV:* \n` +
      `• *Mijoz Botlari Nazorati:* Barcha yaratilgan botlar, ularning faolligi, foydalanuvchilar va xabarlar soni.\n` +
      `• *⚡ 24/7 Hosting va Xavfsizlik:* Botlar uzluksiz 24/7 rejimda nazoratda ishlaydi, xavfsizlik 100% ta'minlangan.\n` +
      `• *👤 Mijozlar Ma'lumotlari:* Mijoz ID si, username, amaldagi tarifi, obunaning qolgan kunlari.\n` +
      `• *⚡ Tezkor Boshqaruv:* Botlarni to'xtatish (\`⏹\`), ishga tushirish (\`▶️\`) va o'chirish (\`🗑\`).\n` +
      `• *🔍 Qidiruv va Filtr:* Bot nomi, username yoki mijoz ID si bo'yicha qidirish.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚙️ *2. WEB APP ON / OFF REJIMI:* \n` +
      `• *🟢 ON (Hamma ko'radi):* Barcha mijozlar Web App orqali o'z shaxsiy kabinetlarini ko'ra olishadi.\n` +
      `• *🔴 OFF (Faqat Admin):* Web App oddiy foydalanuvchilarga yopiladi va faqat bot egasi va adminlarga ko'rinadi.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 *3. TARJIMON BOTI (TUBDAN YANGILANDI):* \n` +
      `• *Google Web Engine:* Bepul, cheklovlarsiz va tezkor tarjima dvigateli.\n` +
      `• *30+ Xalqaro Tillar:* O'zbek, Rus, Ingliz, Turk, Arab, Koreys, Nemis, Xitoy, Fransuz, Ispan va h.k.\n` +
      `• *🌐 Avto-Aniqlash:* Yuborilgan matn tilini avtomatik aniqlab o'zbekchaga o'girish.\n` +
      `• *🔁 Swap Tugmasi:* Bitta bosish bilan tillarni teskari almashtirish.\n` +
      `• *🔊 Ovozli Talaffuz (TTS):* Tarjima qilingan so'zlarning to'g'ri talaffuzini eshitish.\n` +
      `• *🛡 HTML Format:* Maxsus belgilar tufayli xabar buzilishi to'liq bartaraf etildi.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *4. TIZIM VA HOSTING 24/7:* \n` +
      `• Ziddiyatli Render bot instansiyalari to'xtatildi, 409 Conflict xatolari yo'qotildi.\n` +
      `• Tizim maksimal tezlik va xavfsizlik bilan 24/7 rejimda ishlamoqda!`;

    await ctx.reply(updatesText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Admin menyuga qaytish', 'admin_back')]
      ])
    });
  };

  bot.action('admin_updates_info', showUpdatesInfo);
  bot.hears('✨ Yangilanishlar', showUpdatesInfo);
  bot.hears('🔄 Yangilanishlar', showUpdatesInfo);
  bot.hears('Yangilanishlar', showUpdatesInfo);


  // Statistika
  bot.action('admin_stats', async (ctx) => {

    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();

    const stats = db.getStats();
    const runningCount = botManager.getRunningCount();

    const text = 
      `📊 *Tizim Statistikasi:*\n\n` +
      `👥 Jami foydalanuvchilar: *${stats.totalUsers} ta*\n` +
      `🤖 Jami yaratilgan botlar: *${stats.totalBots} ta*\n` +
      `⚡ Hozir faol (Online) botlar: *${runningCount} ta*\n` +
      `💳 Jami to'lov urinishlari: *${stats.totalPayments} ta*\n` +
      `✅ Tasdiqlangan to'lovlar: *${stats.approvedPayments} ta*\n` +
      `⏳ Kutilayotgan cheklar: *${stats.pendingPayments} ta*\n` +
      `💰 Jami daromad: *${stats.totalIncome.toLocaleString()} so'm*\n` +
      `🛡 Administratorlar soni: *${stats.adminsCount} ta*`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Admin menyuga qaytish', 'admin_back')]
      ])
    });
  });


  // Mijoz botlari ro'yxati
  bot.action('admin_bots', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();

    const allBots = db.getAllBots();
    if (allBots.length === 0) {
      return ctx.reply('Tizimda hali birorta ham mijoz boti yaratilmagan.');
    }

    let msg = `🤖 *Barcha mijoz botlari (${allBots.length} ta):*\n\n`;
    const buttons = [];

    allBots.slice(-15).forEach((b, idx) => {
      const isRunning = botManager.isBotRunning(b.id);
      const tpl = getTemplate(b.template);
      msg += `${idx + 1}. *${b.bot_first_name}* (@${b.bot_username})\n` +
        `   Ega ID: \`${b.owner_id}\`\n` +
        `   Turi: ${tpl ? tpl.name : b.template}\n` +
        `   Holat: ${isRunning ? '🟢 Faol' : '🔴 To\'xtagan'}\n\n`;

      buttons.push([
        Markup.button.callback(`🗑 O'chirish: @${b.bot_username}`, `adm_del_bot_${b.id}`)
      ]);
    });

    buttons.push([Markup.button.callback('⬅️ Admin menyuga qaytish', 'admin_back')]);

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  });

  // Admin tomonidan botni o'chirish
  bot.action(/adm_del_bot_(.*)/, async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const botId = ctx.match[1];
    const b = db.getBot(botId);

    if (!b) {
      return ctx.answerCbQuery('Bot topilmadi!');
    }

    await botManager.stopBot(botId);
    db.deleteBot(botId);

    await ctx.answerCbQuery('🗑 Bot butunlay o\'chirildi!');
    await ctx.reply(`✅ Admin tomonidan *@${b.bot_username}* boti butunlay o'chirildi va to'xtatildi!`, {
      parse_mode: 'Markdown'
    });
  });

  // Kutilayotgan to'lovlar
  bot.action('admin_payments', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();

    const pending = db.getPendingPayments();
    if (pending.length === 0) {
      return ctx.reply('✅ Hozirda ko\'rib chiqilmagan yangi to\'lovlar mavjud emas.');
    }

    await ctx.reply(`💳 Hozirda *${pending.length} ta* to'lov kutilmoqda:`, { parse_mode: 'Markdown' });

    for (const p of pending) {
      try {
        await ctx.replyWithPhoto(p.photo_id, {
          caption: 
            `🆔 To'lov #${p.id}\n` +
            `👤 Foydalanuvchi ID: \`${p.user_id}\`\n` +
            `💎 Tarif: *${p.tariff_name}*\n` +
            `💰 Summa: *${p.amount.toLocaleString()} so'm*`,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Tasdiqlash', `pay_approve_${p.id}`),
              Markup.button.callback('❌ Rad etish', `pay_reject_${p.id}`)
            ]
          ])
        });
      } catch (err) {}
    }
  });

  // To'lovni tasdiqlash
  bot.action(/pay_approve_(.*)/, async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const paymentId = ctx.match[1];
    const payment = db.approvePayment(paymentId);

    if (!payment) {
      return ctx.answerCbQuery('To\'lov allaqachon ko\'rib chiqilgan yoki topilmadi.');
    }

    await ctx.answerCbQuery('✅ To\'lov tasdiqlandi!');
    try {
      await ctx.editMessageCaption(
        ctx.callbackQuery.message.caption + `\n\n✅ *TASDIQLANDI* (Admin: ${ctx.from.first_name})`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {}

    // Foydalanuvchiga xushxabar jo'natish
    try {
      await bot.telegram.sendMessage(
        payment.user_id,
        `🎉 *Ajoyib xabar!*\n\n` +
        `Sizning *${payment.tariff_name}* tarifi bo'yicha qilgan to'lovingiz qabul qilindi va tasdiqlandi!\n` +
        `Obunangiz 30 kunga faollashtirildi. Botlaringizdan cheklovlarsiz foydalanishingiz mumkin! 🚀`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.log('Foydalanuvchiga to\'lov tasdiqlanganini yetkazib bo\'lmadi:', err.message);
    }
  });

  // To'lovni rad etish
  bot.action(/pay_reject_(.*)/, async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const paymentId = ctx.match[1];
    const payment = db.rejectPayment(paymentId);

    if (!payment) {
      return ctx.answerCbQuery('To\'lov allaqachon ko\'rib chiqilgan yoki topilmadi.');
    }

    await ctx.answerCbQuery('❌ To\'lov rad etildi.');
    try {
      await ctx.editMessageCaption(
        ctx.callbackQuery.message.caption + `\n\n❌ *RAD ETILDI* (Admin: ${ctx.from.first_name})`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {}

    try {
      await bot.telegram.sendMessage(
        payment.user_id,
        `❌ *To'lov rad etildi.*\n\n` +
        `Siz yuborgan kvitansiya qabul qilinmadi. Mablag' hisobga tushmagan yoki chek noaniq bo'lishi mumkin.\n` +
        `Iltimos, qayta to'lov qilib chekni yuboring yoki adminga murojaat qiling.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {}
  });

  // Adminlarni boshqarish (Faqat Ega / Owner uchun)
  bot.action('admin_manage_admins', async (ctx) => {
    if (!db.isOwner(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Bu bo\'lim faqat Bosh Admin (Ega) uchun!');
    }
    await ctx.answerCbQuery();

    const admins = db.getAdmins();
    let msg = `👥 *Administratorlar Ro'yxati:*\n\n`;
    admins.forEach((aid, i) => {
      const isOwner = db.isOwner(aid);
      msg += `${i + 1}. ID: \`${aid}\` ${isOwner ? '👑 (Bosh Admin / Ega)' : '🛡 (Admin)'}\n`;
    });

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Yangi Admin Qo\'shish', 'admin_add_prompt')],
        [Markup.button.callback('⬅️ Admin menyuga qaytish', 'admin_back')]
      ])
    });
  });

  bot.action('admin_add_prompt', async (ctx) => {
    if (!db.isOwner(ctx.from.id)) return;
    await ctx.answerCbQuery();

    adminStates[ctx.from.id] = { state: 'waiting_add_admin' };
    await ctx.reply(
      `➕ Yangi administratorning *Telegram ID* sini yuboring:\n\n` +
      `Foydalanuvchi o'z ID sini bilishi uchun @userinfobot ga kirishi mumkin.`,
      { parse_mode: 'Markdown', ...keyboards.getCancelKeyboard() }
    );
  });

  // Xabar tarqatish (Rassilka)
  bot.action('admin_broadcast', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();

    adminStates[ctx.from.id] = { state: 'waiting_broadcast' };
    await ctx.reply(
      `📢 *Barcha foydalanuvchilarga xabar tarqatish:*\n\n` +
      `Barcha a'zolarga jo'natmoqchi bo'lgan xabaringizni yuboring (Matn yoki Rasm bilan birga).\n` +
      `Xabar darhol hamma a'zolarga tarqatiladi.`,
      { parse_mode: 'Markdown', ...keyboards.getCancelKeyboard() }
    );
  });

  // Foydalanuvchilar (Mijozlar) ro'yxati
  bot.action('admin_users', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();

    const allUsers = db.getAllUsers();
    if (allUsers.length === 0) {
      return ctx.reply('Tizimda hali foydalanuvchilar mavjud emas.');
    }

    let msg = `👥 *Barcha Foydalanuvchilar (${allUsers.length} ta):*\n\n`;
    allUsers.slice(-20).forEach((u, i) => {
      const tariff = config.TARIFFS[u.tariff] || { name: u.tariff || 'Standart' };
      const days = db.getSubscriptionDaysLeft(u.id);
      msg += `${i + 1}. *${cleanName(u.first_name)}* ${u.username ? '(@' + u.username + ')' : ''}\n` +
        `   🆔 ID: \`${u.id}\`\n` +
        `   💰 Balans: *${(u.balance || 0).toLocaleString()} so'm*\n` +
        `   💎 Tarif: *${tariff.name}* (${days} kun qoldi)\n\n`;
    });

    msg += `💡 *Tezkor Balans Boshqaruvi Buyruqlari:*\n` +
      `• Pul qo'shish: \`/add_money <ID> <summa>\`\n` +
      `• Pul ayirish: \`/sub_money <ID> <summa>\`\n` +
      `• Kun qo'shish: \`/add_days <ID> <kun>\`\n` +
      `• Kun ayirish: \`/sub_days <ID> <kun>\`\n` +
      `• Tarif berish: \`/set_tariff <ID> <pro_month/vip_year/...>\`\n\n` +
      `_Yoki to'liq vizual boshqaruv uchun Web App dan foydalaning._`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🌐 Web App orqali boshqarish', keyboards.getWebAppUrl(ctx.from.id))],
        [Markup.button.callback('⬅️ Admin menyuga qaytish', 'admin_back')]
      ])
    });
  });

  // Tezkor buyruq: /add_money <ID> <summa>
  bot.command(['add_money', 'add_balance', 'pul_qoshish'], async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const parts = ctx.message.text.split(' ').filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply('ℹ️ Ishlatish: `/add_money <User_ID> <Summa>`\nMisol: `/add_money 8422157752 50000`', { parse_mode: 'Markdown' });
    }
    const targetId = parts[1];
    const amount = parseFloat(parts[2]);
    if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Noto\'g\'ri summa kiritildi.');

    const newBal = db.addBalance(targetId, amount);
    if (newBal === false) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    await ctx.reply(`✅ ID: \`${targetId}\` ga *${amount.toLocaleString()} so'm* qo'shildi!\nYangi balansi: *${newBal.toLocaleString()} so'm*`, { parse_mode: 'Markdown' });
  });

  // Tezkor buyruq: /sub_money <ID> <summa>
  bot.command(['sub_money', 'sub_balance', 'pul_ayirish'], async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const parts = ctx.message.text.split(' ').filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply('ℹ️ Ishlatish: `/sub_money <User_ID> <Summa>`\nMisol: `/sub_money 8422157752 20000`', { parse_mode: 'Markdown' });
    }
    const targetId = parts[1];
    const amount = parseFloat(parts[2]);
    if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Noto\'g\'ri summa kiritildi.');

    const newBal = db.subtractBalance(targetId, amount);
    if (newBal === false) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    await ctx.reply(`➖ ID: \`${targetId}\` dan *${amount.toLocaleString()} so'm* ayirildi!\nYangi balansi: *${newBal.toLocaleString()} so'm*`, { parse_mode: 'Markdown' });
  });

  // Tezkor buyruq: /add_days <ID> <kun>
  bot.command(['add_days', 'kun_qoshish'], async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const parts = ctx.message.text.split(' ').filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply('ℹ️ Ishlatish: `/add_days <User_ID> <Kun>`\nMisol: `/add_days 8422157752 30`', { parse_mode: 'Markdown' });
    }
    const targetId = parts[1];
    const days = parseInt(parts[2]);
    if (isNaN(days) || days <= 0) return ctx.reply('❌ Noto\'g\'ri kun soni.');

    const daysLeft = db.addDays(targetId, days);
    if (daysLeft === false) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    await ctx.reply(`⏳ ID: \`${targetId}\` ga *${days} kun* qo'shildi!\nQolgan obuna muddati: *${daysLeft} kun*`, { parse_mode: 'Markdown' });
  });

  // Tezkor buyruq: /sub_days <ID> <kun>
  bot.command(['sub_days', 'kun_ayirish', 'kun_ayir'], async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const parts = ctx.message.text.split(' ').filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply('ℹ️ Ishlatish: `/sub_days <User_ID> <Kun>`\nMisol: `/sub_days 8422157752 10`', { parse_mode: 'Markdown' });
    }
    const targetId = parts[1];
    const days = parseInt(parts[2]);
    if (isNaN(days) || days <= 0) return ctx.reply('❌ Noto\'g\'ri kun soni.');

    const daysLeft = db.subtractDays(targetId, days);
    if (daysLeft === false) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    await ctx.reply(`➖ ID: \`${targetId}\` dan *${days} kun* ayirildi!\nQolgan obuna muddati: *${daysLeft} kun*`, { parse_mode: 'Markdown' });
  });

  // Tezkor buyruq: /set_tariff <ID> <tariffId>
  bot.command(['set_tariff', 'tarif_berish'], async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    const parts = ctx.message.text.split(' ').filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply('ℹ️ Ishlatish: `/set_tariff <User_ID> <Tarif>`\nTariflar: `starter`, `pro_month`, `business_3m`, `vip_year`, `unlimited_forever`\nMisol: `/set_tariff 8422157752 pro_month`', { parse_mode: 'Markdown' });
    }
    const targetId = parts[1];
    const tariffId = parts[2];

    const ok = db.setTariff(targetId, tariffId);
    if (!ok) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    const tariff = config.TARIFFS[tariffId] || { name: tariffId };
    await ctx.reply(`💎 ID: \`${targetId}\` ga *${tariff.name}* tarifi muvaffaqiyatli o'rnatildi!`, { parse_mode: 'Markdown' });
  });

  // Admin menyusiga qaytish
  bot.action('admin_back', async (ctx) => {
    if (!db.isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();
    await openAdminPanel(ctx);
  });

  bot.action('admin_close', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Asosiy menyudasiz.', keyboards.getMainKeyboard(db.isAdmin(ctx.from.id)));
  });

  // Admin matn kiritishlarini qayta ishlash
  bot.on('message', async (ctx, next) => {
    const adminId = ctx.from.id;
    const session = adminStates[adminId];

    if (!session) return next();

    // 1. Yangi admin qo'shish
    if (session.state === 'waiting_add_admin') {
      const newAdminId = parseInt(ctx.message.text?.trim());
      delete adminStates[adminId];

      if (isNaN(newAdminId)) {
        return ctx.reply('❌ Noto\'g\'ri Telegram ID kiritildi.');
      }

      const added = db.addAdmin(newAdminId);
      if (added) {
        await ctx.reply(`✅ Foydalanuvchi [ID: \`${newAdminId}\`] muvaffaqiyatli administrator qilindi!`, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply('⚠️ Bu foydalanuvchi allaqachon adminlar ro\'yxatida mavjud.');
      }
      return;
    }

    // 2. Rassilka (Xabar tarqatish)
    if (session.state === 'waiting_broadcast') {
      delete adminStates[adminId];
      const allUsers = db.getAllUsers();

      await ctx.reply(`📢 Xabar tarqatish boshlandi... Jami: ${allUsers.length} ta foydalanuvchi.`);

      let sentCount = 0;
      let failedCount = 0;

      for (const u of allUsers) {
        try {
          if (ctx.message.text) {
            await bot.telegram.sendMessage(u.id, ctx.message.text);
          } else if (ctx.message.photo) {
            const photoId = ctx.message.photo.pop().file_id;
            await bot.telegram.sendPhoto(u.id, photoId, { caption: ctx.message.caption });
          }
          sentCount++;
        } catch (err) {
          failedCount++;
        }
      }

      await ctx.reply(
        `✅ *Xabar tarqatish yakunlandi!*\n\n` +
        `📤 Muvaffaqiyatli yetkazildi: *${sentCount} ta*\n` +
        `🚫 Yetkazilmadi (bloklangan): *${failedCount} ta*`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    return next();
  });
};
