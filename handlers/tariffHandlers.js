const { Markup } = require('telegraf');
const db = require('../database/db');
const keyboards = require('../core/keyboards');
const config = require('../config');

module.exports = (bot) => {
  const pendingPaymentUsers = {}; // userId -> tariffId

  // Tariflar bo'limi
  const showTariffs = async (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const daysLeft = db.getSubscriptionDaysLeft(ctx.from.id);

    const text = 
      `💎 *Tariflar va Obuna Rejalari:*\n\n` +
      `Sizning hozirgi holatingiz: *${config.TARIFFS[user.tariff]?.name || 'Tekin sinov'}*\n` +
      `Qolgan muddat: *${daysLeft} kun*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎁 *1. 3 Kunlik Bepul Sinov*\n` +
      `• Narxi: *0 so'm (Mutlaqo Bepul)*\n` +
      `• Muddat: 3 kun\n` +
      `• Limit: Faqat 1 ta bot\n\n` +
      `🌱 *2. Starter (1 Oylik)*\n` +
      `• Narxi: *15,000 so'm* / oy\n` +
      `• Muddat: 30 kun\n` +
      `• Limit: 3 tagacha bot\n\n` +
      `⭐ *3. 25 Pro (1 Oylik)*\n` +
      `• Narxi: *25,000 so'm* / oy\n` +
      `• Muddat: 30 kun\n` +
      `• Limit: 10 tagacha bot\n\n` +
      `💼 *4. Business (3 Oylik)*\n` +
      `• Narxi: *60,000 so'm* (Chegirma bilan!)\n` +
      `• Muddat: 90 kun (3 oy)\n` +
      `• Limit: 25 tagacha bot\n\n` +
      `👑 *5. VIP Premium (1 Yillik)*\n` +
      `• Narxi: *150,000 so'm*\n` +
      `• Muddat: 365 kun (1 yil)\n` +
      `• Limit: 50 tagacha bot\n\n` +
      `♾ *6. Cheksiz Umrbod (Lifetime)*\n` +
      `• Narxi: *300,000 so'm* (Bir martalik to'lov!)\n` +
      `• Muddat: Umrbod / Cheksiz\n` +
      `• Limit: Cheksiz botlar (999 ta)\n` +
      `• Barcha yangi chiqadigan funksiyalardan doimiy foydalanish\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `O'zingizga ma'qul tarifni tanlang:`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...keyboards.getTariffsKeyboard()
    });
  };

  bot.hears('💎 Tariflar va Obuna', showTariffs);
  bot.action('tariff_view_all', async (ctx) => {
    await ctx.answerCbQuery();
    await showTariffs(ctx);
  });

  // Tarif tanlanganda
  bot.action(/tariff_(.*)/, async (ctx) => {
    await ctx.answerCbQuery();
    const tariffId = ctx.match[1];

    if (tariffId === 'free_trial') {
      const user = db.getUser(ctx.from.id);
      return ctx.reply(
        `🎁 *3 Kunlik Tekin Sinov*\n\n` +
        `Ushbu sinov siz ro'yxatdan o'tganingizda avtomatik taqdim etilgan.\n` +
        `Qolgan sinov muddati: *${db.getSubscriptionDaysLeft(ctx.from.id)} kun*.\n\n` +
        `Muddatingizni uzaytirish uchun *25 Pro* yoki *VIP Premium* tariflarini tanlashingiz mumkin!`,
        { parse_mode: 'Markdown' }
      );
    }

    const tariff = config.TARIFFS[tariffId];
    if (!tariff) return ctx.reply('❌ Tarif topilmadi.');

    pendingPaymentUsers[ctx.from.id] = tariffId;
    const user = db.getOrCreateUser(ctx.from);
    const balance = user.balance || 0;

    const paymentButtons = [];
    if (balance >= tariff.price) {
      paymentButtons.push([
        Markup.button.callback(`⚡ Balansdan to'lash (${tariff.price.toLocaleString()} so'm)`, `pay_balance_${tariffId}`)
      ]);
    }
    paymentButtons.push([Markup.button.callback('❌ Bekor qilish', 'cancel_action')]);

    const paymentText = 
      `💳 *To'lov Ma'lumotlari:*\n\n` +
      `Tanlangan tarif: *${tariff.name}*\n` +
      `To'lov summasi: *${tariff.price.toLocaleString()} so'm*\n` +
      `Sizning balansingiz: *${balance.toLocaleString()} so'm*\n\n` +
      (balance >= tariff.price 
        ? `✅ *Balansingizda yetarli mablag' mavjud!* Quyidagi "⚡ Balansdan to'lash" tugmasini bosib bir zumda faollashtirishingiz mumkin.\n\n` 
        : `To'lov uchun karta raqami:\n💳 \`${config.CARD_NUMBER}\`\n👤 Karta egasi: *${config.CARD_HOLDER}*\n\n` +
          `📌 *To'lov yo'riqnomasi:*\n` +
          `1. Yuqoridagi kartaga *${tariff.price.toLocaleString()} so'm* o'tkazing.\n` +
          `2. To'lov cheki (skrinshot yoki kvitansiya rasmini) menga shu yerda rasm sifatida yuboring!\n` +
          `3. Administratorlar chekni tekshirib, obunangizni 5 daqiqa ichida faollashtiradilar.`
      );

    await ctx.reply(paymentText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(paymentButtons)
    });
  });

  // Balans orqali to'lovni tasdiqlash
  bot.action(/pay_balance_(.*)/, async (ctx) => {
    await ctx.answerCbQuery();
    const tariffId = ctx.match[1];
    const tariff = config.TARIFFS[tariffId];
    if (!tariff) return ctx.reply('❌ Tarif topilmadi.');

    const userId = ctx.from.id;
    const user = db.getUser(userId);
    const balance = user ? (user.balance || 0) : 0;

    if (balance < tariff.price) {
      return ctx.reply('❌ Balansingizda mablag\' yetarli emas.');
    }

    db.subtractBalance(userId, tariff.price);
    db.setTariff(userId, tariffId);
    delete pendingPaymentUsers[userId];

    await ctx.reply(
      `🎉 *Tabriklaymiz!*\n\n` +
      `*${tariff.name}* tarifi balansingizdan *${tariff.price.toLocaleString()} so'm* yechilgan holda muvaffaqiyatli faollashtirildi!\n` +
      `Qolgan balansingiz: *${(user.balance).toLocaleString()} so'm*\n` +
      `Obuna muddati: *${tariff.days} kun* ga uzaytirildi.`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getMainKeyboard(db.isAdmin(userId))
      }
    );

    // Adminlarga xabar
    const admins = db.getAdmins();
    for (const adm of admins) {
      try {
        await bot.telegram.sendMessage(
          adm,
          `⚡ *Balans orqali yangi tarif faollashtirildi!*\n\n` +
          `👤 Foydalanuvchi: [${ctx.from.first_name}](tg://user?id=${userId})\n` +
          `🆔 ID: \`${userId}\`\n` +
          `💎 Tarif: *${tariff.name}*\n` +
          `💰 Yechildi: *${tariff.price.toLocaleString()} so'm*`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    }
  });

  // Chek (rasm) qabul qilish
  bot.on('photo', async (ctx, next) => {
    const tariffId = pendingPaymentUsers[ctx.from.id];
    if (!tariffId) return next();

    const photo = ctx.message.photo.pop().file_id;
    const payment = db.createPayment(ctx.from.id, tariffId, photo);

    delete pendingPaymentUsers[ctx.from.id];

    await ctx.reply(
      `✅ *To'lov cheki qabul qilindi!*\n\n` +
      `Kvitansiya tekshirish uchun administratorlarga yuborildi.\n` +
      `Obunangiz tasdiqlangach, sizga darhol xabarnoma keladi. Rahmat!`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getMainKeyboard(db.isAdmin(ctx.from.id))
      }
    );

    // Adminlarga xabar va rasm yuborish
    const admins = db.getAdmins();
    const adminMsg = 
      `💳 *Yangi to'lov cheki! (#${payment.id})*\n\n` +
      `👤 Foydalanuvchi: [${ctx.from.first_name}](tg://user?id=${ctx.from.id})\n` +
      `🆔 ID: \`${ctx.from.id}\`\n` +
      `💎 Tarif: *${payment.tariff_name}*\n` +
      `💰 Summa: *${payment.amount.toLocaleString()} so'm*`;

    for (const adminId of admins) {
      try {
        await bot.telegram.sendPhoto(adminId, photo, {
          caption: adminMsg,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Tasdiqlash', `pay_approve_${payment.id}`),
              Markup.button.callback('❌ Rad etish', `pay_reject_${payment.id}`)
            ]
          ])
        });
      } catch (err) {
        console.error(`Adminga (${adminId}) to'lov chekini yuborishda xatolik:`, err.message);
      }
    }
  });
};
