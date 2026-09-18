const { Markup } = require('telegraf');
const db = require('../database/db');
const botManager = require('../core/botManager');
const keyboards = require('../core/keyboards');
const { getTemplate, templates } = require('../templates');
const config = require('../config');
const { cleanName } = require('../core/helpers');

module.exports = (bot) => {
  // Foydalanuvchi holati (session)
  const userStates = {}; // userId -> { state: 'waiting_token', templateId: '...' }

  // /start buyrug'i
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const isNew = !db.getUser(userId);

    // Deep link tekshiruvi (/start ref_12345 yoki /start 12345)
    const text = ctx.message?.text || '';
    const parts = text.split(' ');
    let referrerId = null;
    if (parts.length > 1) {
      const payload = parts[1].trim();
      if (payload.startsWith('ref_')) {
        referrerId = payload.replace('ref_', '');
      } else if (/^\d+$/.test(payload)) {
        referrerId = payload;
      }
    }

    const user = db.getOrCreateUser(ctx.from);

    // Yangi foydalanuvchi bo'lsa va taklif qiluvchi mavjud bo'lsa
    if (isNew && referrerId && String(referrerId) !== String(userId)) {
      const refRes = db.processReferral(userId, referrerId);
      if (refRes.success && refRes.referrer) {
        try {
          await ctx.telegram.sendMessage(
            referrerId,
            `🎉 *Yangi do'stingiz qo'shildi!*\n\n` +
            `👤 Foydalanuvchi: *${cleanName(ctx.from.first_name)}*\n` +
            `💰 Taklif uchun hisobingizga *+500 so'm* qo'shildi!\n` +
            `💵 Hozirgi balansingiz: *${(refRes.referrer.balance || 0).toLocaleString()} so'm*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          console.error('Referal xabarnoma yuborishda xatolik:', e.message);
        }
      }
    }

    const isAdmin = db.isAdmin(ctx.from.id);
    const isPublic = db.isWebappPublic();
    const daysLeft = db.getSubscriptionDaysLeft(ctx.from.id);
    const name = cleanName(ctx.from.first_name);

    await ctx.reply(
      `👋 Assalomu alaykum, *${name}*!\n\n` +
      `🤖 *Bot Konstruktori Platformasiga* xush kelibsiz!\n\n` +
      `Siz bu yerda o'zingiz xohlagan har qanday botni (AI, Nakrutka, Pul topar, Do'kon, Kino va yana 10 dan ortiq) bir zumda yaratishingiz va ishga tushirishingiz mumkin.\n\n` +
      `🎁 *Xushxabar:* Sizga *${config.TRIAL_DAYS} kunlik TEKIN sinov muddati* berildi!\n` +
      `⏳ Qolgan muddat: *${daysLeft} kun*\n` +
      `💰 Balansingiz: *${(user.balance || 0).toLocaleString()} so'm*\n\n` +
      `Yangi bot yaratish yoki bonus olish uchun quyidagi menyudan foydalaning! 👇`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getMainKeyboard(isAdmin)
      }
    );
  });

  // 🌐 Web App (Faqat Adminlar uchun)
  const handleWebAppCommand = async (ctx) => {
    const userId = ctx.from.id;
    const isAdmin = db.isAdmin(userId);

    if (!isAdmin) {
      return ctx.reply('🔒 *Web App boshqaruv paneli faqat administratorlar uchun mo\'ljallangan.*', { parse_mode: 'Markdown' });
    }

    const url = keyboards.getWebAppUrl(userId);
    const isOwner = db.isOwner(userId);
    const roleText = isOwner ? '👑 Bosh Admin' : '🛡 Administrator';

    await ctx.reply(
      `🌐 *Web App Admin Dashboard Paneli*\n\n` +
      `Maqom: *${roleText}*\n\n` +
      `Barcha yaratilgan botlarni 24/7 nazorat qilish va to'liq ma'lumotlarni boshqarish uchun quyidagi tugmalardan birini bosing:\n\n` +
      `🔗 *Havola:* \`${url}\``,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Telegramda Ochish', url)],
          [Markup.button.url('🌐 Brauzerda Ochish (Chrome/Safari)', url)]
        ])
      }
    );
  };

  bot.hears('🌐 Web App', handleWebAppCommand);
  bot.hears('🌐 Web App (Admin)', handleWebAppCommand);
  bot.command('webapp', handleWebAppCommand);
  bot.command('panel', handleWebAppCommand);




  // Yangi bot yaratish tugmasi
  bot.hears('🚀 Yangi Bot Yaratish', async (ctx) => {
    const userId = ctx.from.id;
    if (!db.isSubscriptionActive(userId)) {
      return ctx.reply(
        `⚠️ *Obuna muddatingiz yakunlangan!*\n\n` +
        `Bot yaratishda davom etish uchun iltimos tariflardan birini tanlang.`,
        {
          parse_mode: 'Markdown',
          ...keyboards.getTariffsKeyboard()
        }
      );
    }

    // Limit tekshiruvi (Tarifsiz faqat 1 ta bot)
    const user = db.getOrCreateUser(ctx.from);
    const userBots = db.getUserBots(userId);
    const tariff = config.TARIFFS[user.tariff] || config.TARIFFS.free_trial;
    const maxBots = tariff.maxBots || 1;

    if (!db.isAdmin(userId) && userBots.length >= maxBots) {
      return ctx.reply(
        `⚠️ *Bot yaratish limiti to'lgan!*\n\n` +
        `Sizning hozirgi tarifingiz: *${tariff.name}*\n` +
        `Yaratilgan botlaringiz: *${userBots.length} / ${maxBots} ta*\n\n` +
        `📌 *Tarifsiz foydalanuvchilar faqat 1 ta bot yarata oladi!*\n\n` +
        `Ko'proq bot yaratish uchun quyidagi tariflardan birini tanlang:\n` +
        `• *25 Pro (1 Oylik)* — 10 tagacha bot\n` +
        `• *VIP Premium (1 Yillik)* — 50 tagacha bot`,
        {
          parse_mode: 'Markdown',
          ...keyboards.getTariffsKeyboard()
        }
      );
    }

    await ctx.reply(
      `📋 *Qanday bot yaratmoqchisiz?*\n\n` +
      `Quyidagi 15 dan ortiq professional bot shablonlaridan birini tanlang:`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getTemplatesKeyboard()
      }
    );
  });

  // Shablon tanlanganda
  bot.action(/select_tpl_(.*)/, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const user = db.getOrCreateUser(ctx.from);
    const userBots = db.getUserBots(userId);
    const tariff = config.TARIFFS[user.tariff] || config.TARIFFS.free_trial;
    const maxBots = tariff.maxBots || 1;

    if (!db.isAdmin(userId) && userBots.length >= maxBots) {
      return ctx.reply(
        `⚠️ *Bot yaratish limiti to'lgan!*\n\n` +
        `Sizda allaqachon *${userBots.length} ta* bot mavjud. Tarifsiz maksimal limit — *1 ta bot*.\n\n` +
        `Yana yangi bot yaratish uchun tariflardan birini faollashtiring:`,
        {
          parse_mode: 'Markdown',
          ...keyboards.getTariffsKeyboard()
        }
      );
    }

    const templateId = ctx.match[1];
    const template = getTemplate(templateId);

    if (!template) {
      return ctx.reply('❌ Shablon topilmadi.');
    }

    userStates[ctx.from.id] = {
      state: 'waiting_token',
      templateId: templateId
    };

    await ctx.reply(
      `Selected: *${template.name}*\n` +
      `📝 *Tavsif:* ${template.description}\n\n` +
      `Endi ushbu botingiz uchun Telegram Bot Tokeni kerak.\n\n` +
      `💡 *Tokenni qanday olish mumkin?*\n` +
      `1. [@BotFather](https://t.me/BotFather) botiga kiring va \`/newbot\` buyrug'ini yuboring.\n` +
      `2. Botingizga nom va username tanlang.\n` +
      `3. @BotFather bergan maxsus *API Token*dan nusxa olib, menga yuboring!`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...keyboards.getCancelKeyboard()
      }
    );
  });

  // Mening botlarim
  bot.hears('📁 Mening Botlarim', async (ctx) => {
    const userBots = db.getUserBots(ctx.from.id);

    if (userBots.length === 0) {
      return ctx.reply(
        `📁 Sizda hali yaratilgan botlar mavjud emas.\n\n` +
        `"🚀 Yangi Bot Yaratish" tugmasini bosib birinchi botingizni yarating!`,
        keyboards.getMainKeyboard(db.isAdmin(ctx.from.id))
      );
    }

    let msg = `📁 *Sizning yaratgan botlaringiz (${userBots.length} ta):*\n\n`;
    const buttons = [];

    userBots.forEach((b, idx) => {
      const isRunning = botManager.isBotRunning(b.id);
      const statusIcon = isRunning ? '🟢 Faol' : '🔴 To\'xtatilgan';
      const tpl = getTemplate(b.template);
      msg += `${idx + 1}. *${b.bot_first_name}* (@${b.bot_username})\n` +
        `   Turi: ${tpl ? tpl.name : b.template}\n` +
        `   Holati: ${statusIcon}\n\n`;

      buttons.push([Markup.button.callback(`⚙️ @${b.bot_username} ni boshqarish`, `manage_bot_${b.id}`)]);
    });

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  });

  // Bitta botni boshqarish
  bot.action(/manage_bot_(.*)/, async (ctx) => {
    await ctx.answerCbQuery();
    const botId = ctx.match[1];
    const b = db.getBot(botId);

    if (!b || b.owner_id !== ctx.from.id) {
      return ctx.reply('❌ Bot topilmadi.');
    }

    const isRunning = botManager.isBotRunning(b.id);
    const tpl = getTemplate(b.template);

    await ctx.reply(
      `🤖 *Bot Sozlamalari:* @${b.bot_username}\n\n` +
      `📌 Nomi: *${b.bot_first_name}*\n` +
      `📂 Shablon: *${tpl ? tpl.name : b.template}*\n` +
      `⚡ Holati: *${isRunning ? '🟢 Ishlamoqda' : '🔴 To\'xtatilgan'}*\n` +
      `👥 Bot a'zolari: *${b.stats?.users_count || 0} kishi*\n` +
      `📅 Yaratilgan sana: *${new Date(b.created_at).toLocaleDateString('uz-UZ')}*`,
      {
        parse_mode: 'Markdown',
        ...keyboards.getBotManageKeyboard(b, isRunning)
      }
    );
  });

  // Botni to'xtatish
  bot.action(/bot_stop_(.*)/, async (ctx) => {
    const botId = ctx.match[1];
    const b = db.getBot(botId);
    if (!b || b.owner_id !== ctx.from.id) return;

    await botManager.stopBot(botId);
    await ctx.answerCbQuery('⏹ Bot to\'xtatildi!');
    await ctx.reply(`⏹ @${b.bot_username} muvaffaqiyatli to'xtatildi.`);
  });

  // Botni qayta ishga tushirish
  bot.action(/bot_start_(.*)/, async (ctx) => {
    const botId = ctx.match[1];
    const b = db.getBot(botId);
    if (!b || b.owner_id !== ctx.from.id) return;

    if (!db.isSubscriptionActive(ctx.from.id)) {
      return ctx.reply('⚠️ Obunangiz tugaganligi sababli botni ishga tushirib bo\'lmaydi.');
    }

    await ctx.answerCbQuery('▶️ Ishga tushirilmoqda...');
    const result = await botManager.startBot(b);
    if (result.success) {
      await ctx.reply(`🟢 @${b.bot_username} muvaffaqiyatli ishga tushirildi!`);
    } else {
      await ctx.reply(`❌ Ishga tushirishda xatolik: ${result.error}`);
    }
  });

  // Botni o'chirish
  bot.action(/bot_delete_(.*)/, async (ctx) => {
    const botId = ctx.match[1];
    const b = db.getBot(botId);
    if (!b || b.owner_id !== ctx.from.id) return;

    await botManager.stopBot(botId);
    db.deleteBot(botId);

    await ctx.answerCbQuery('🗑 Bot o\'chirildi!');
    await ctx.reply(`🗑 @${b.bot_username} boti butunlay o'chirildi.`);
  });

  // 🎁 Kunlik bonus funksiyasi
  const handleDailyBonus = async (ctx) => {
    const userId = ctx.from.id;
    const res = db.claimDailyBonus(userId, 200);
    if (res.success) {
      return ctx.reply(
        `🎁 *Tabriklaymiz! Kunlik bonus qabul qilindi!*\n\n` +
        `💰 Sizga *+200 so'm* berildi.\n` +
        `💳 Hozirgi balansingiz: *${res.newBalance.toLocaleString()} so'm*\n\n` +
        `⏳ Keyingi bonusni 24 soatdan so'ng olishingiz mumkin.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👥 Do\'stlarni taklif qilish (+500 so\'m)', 'show_ref_menu_cb')],
            [Markup.button.callback('💎 Tariflar', 'tariff_view_all')]
          ])
        }
      );
    } else {
      const hours = Math.floor(res.timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((res.timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      return ctx.reply(
        `⏳ *Siz bugungi bonusni allaqachon olgansiz!*\n\n` +
        `Keyingi bonusni olishingizga *${hours} soat ${minutes} daqiqa* qoldi.\n\n` +
        `💡 Do'stlaringizni taklif qilib, har bir do'stingiz uchun *500 so'm* ishlashingiz mumkin! 👇`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👥 Referal havolasini olish', 'show_ref_menu_cb')]
          ])
        }
      );
    }
  };

  bot.hears('🎁 Kunlik Bonus', handleDailyBonus);
  bot.command('bonus', handleDailyBonus);
  bot.action('claim_daily_bonus_cb', async (ctx) => {
    await ctx.answerCbQuery();
    await handleDailyBonus(ctx);
  });

  // 👥 Referal tizimi funksiyasi
  const handleReferral = async (ctx) => {
    const userId = ctx.from.id;
    const user = db.getOrCreateUser(ctx.from);
    const botUser = ctx.botInfo?.username || 'MakerBot';
    const refLink = `https://t.me/${botUser}?start=ref_${userId}`;
    const refCount = user.referrals_count || 0;
    const refEarned = user.referral_earnings || 0;
    const balance = user.balance || 0;

    const text =
      `👥 *Do'stlarni taklif qiling va pul ishlang!*\n\n` +
      `Har bir sizning havolangiz orqali kirgan do'stingiz uchun hisobingizga *500 so'm* taqdim etiladi!\n\n` +
      `📊 *Sizning statistikangiz:*\n` +
      `👥 Taklif qilgan do'stlaringiz: *${refCount} ta*\n` +
      `💵 Referaldan ishlangan: *${refEarned.toLocaleString()} so'm*\n` +
      `💰 Hozirgi balansingiz: *${balance.toLocaleString()} so'm*\n\n` +
      `🔗 *Sizning maxsus taklif havolangiz:*\n` +
      `\`${refLink}\`\n\n` +
      `Ushbu havolani do'stlaringizga va guruhlarga yuboring! 👇`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🚀 Telegramda professional AI, Nakrutka, Do\'kon va boshqa botlarni bir necha soniyada yarating!')}`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([
        [Markup.button.url('📲 Do\'stlarga ulashish', shareUrl)],
        [Markup.button.callback('🎁 Kunlik bonus olish', 'claim_daily_bonus_cb')]
      ])
    });
  };

  bot.hears('👥 Referal Tizimi', handleReferral);
  bot.hears('👥 Referal', handleReferral);
  bot.command('referral', handleReferral);
  bot.command('ref', handleReferral);
  bot.action('show_ref_menu_cb', async (ctx) => {
    await ctx.answerCbQuery();
    await handleReferral(ctx);
  });

  // Profilim
  bot.hears('👤 Profilim', async (ctx) => {
    const user = db.getOrCreateUser(ctx.from);
    const daysLeft = db.getSubscriptionDaysLeft(ctx.from.id);
    const userBots = db.getUserBots(ctx.from.id);
    const tariffName = config.TARIFFS[user.tariff]?.name || 'Tekin sinov';
    const balance = user.balance || 0;
    const refCount = user.referrals_count || 0;
    const refEarned = user.referral_earnings || 0;
    const name = cleanName(ctx.from.first_name);

    await ctx.reply(
      `👤 *Sizning Profilingiz:*\n\n` +
      `🆔 ID: \`${ctx.from.id}\`\n` +
      `👤 Ism: *${name}*\n` +
      `💰 Balans: *${balance.toLocaleString()} so'm*\n` +
      `👥 Taklif qilgan do'stlaringiz: *${refCount} ta* (${refEarned.toLocaleString()} so'm)\n` +
      `💎 Tarif: *${tariffName}*\n` +
      `⏳ Obuna muddati: *${daysLeft} kun qoldi*\n` +
      `🤖 Yaratilgan botlar: *${userBots.length} ta*\n\n` +
      `Obunani uzaytirish yoki yangi botlar ochish uchun "💎 Tariflar va Obuna" menyusiga kiring!`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎁 Kunlik Bonus', 'claim_daily_bonus_cb'), Markup.button.callback('👥 Referal', 'show_ref_menu_cb')],
          [Markup.button.callback('💎 Tarif sotib olish', 'tariff_view_all')]
        ])
      }
    );
  });

  // Yordam va Qo'llanma
  bot.hears('❓ Yordam va Qo\'llanma', async (ctx) => {
    await ctx.reply(
      `📖 *Bot yaratish bo'yicha qo'llanma:*\n\n` +
      `1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.\n` +
      `2. \`/newbot\` buyrug'ini yozing.\n` +
      `3. Botingizga ixtiyoriy nom bering (Masalan: _Mening Super Botim_).\n` +
      `4. Botingizga username bering, username oxiri \`bot\` bilan tugashi kerak (Masalan: _super_shop_bot_).\n` +
      `5. @BotFather sizga uzun qizil matn ko'rinishida *HTTP API Token* beradi.\n` +
      `6. Bizning botimizga qaytib "🚀 Yangi Bot Yaratish" tugmasini bosing, kerakli bot turini tanlang va o'sha tokenni yuboring!\n\n` +
      `Botingiz bir zumda online bo'ladi va ishlay boshlaydi! ✨`,
      { parse_mode: 'Markdown', disable_web_page_preview: true }
    );
  });

  // Bekor qilish
  bot.action('cancel_action', async (ctx) => {
    delete userStates[ctx.from.id];
    await ctx.answerCbQuery('Bekor qilindi');
    await ctx.reply('Amal bekor qilindi.', keyboards.getMainKeyboard(db.isAdmin(ctx.from.id)));
  });

  // Token kiritilishini qabul qilish
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const session = userStates[userId];

    if (session && session.state === 'waiting_token') {
      const token = ctx.message.text.trim();

      // Token formati tekshiruvi (odatda: 123456789:ABCdef...)
      if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(token)) {
        return ctx.reply(
          `⚠️ *Token formati noto'g'ri!*\n\n` +
          `Token quyidagi ko'rinishda bo'lishi kerak:\n\`123456789:AAH...f0z_\`\n\n` +
          `Iltimos, @BotFather bergan tokenni to'liq nusxalab yuboring yoki bekor qilishni bosing.`,
          { parse_mode: 'Markdown', ...keyboards.getCancelKeyboard() }
        );
      }

      // Ushbu token bazada mavjudmi?
      const existing = db.getBotByToken(token);
      if (existing) {
        return ctx.reply('❌ Bu bot tokeni allaqachon ro\'yxatdan o\'tgan! Boshqa bot tokenini yuboring.');
      }

      await ctx.sendChatAction('typing');
      const check = await botManager.validateToken(token);

      if (!check.success) {
        return ctx.reply(
          `❌ *Token yaroqsiz yoki xato!*\n\n` +
          `Telegram serveri bu tokenni qabul qilmadi.\n` +
          `Xatolik: ${check.error}\n\n` +
          `Iltimos, @BotFather dan to'g'ri tokenni oling.`,
          { parse_mode: 'Markdown', ...keyboards.getCancelKeyboard() }
        );
      }

      const botInfo = check.botInfo;
      const templateId = session.templateId;
      const template = getTemplate(templateId);

      // Limit tekshiruvi (Tarifsiz faqat 1 ta bot)
      const user = db.getOrCreateUser(ctx.from);
      const userBots = db.getUserBots(userId);
      const tariff = config.TARIFFS[user.tariff] || config.TARIFFS.free_trial;
      const maxBots = tariff.maxBots || 1;

      if (!db.isAdmin(userId) && userBots.length >= maxBots) {
        delete userStates[userId];
        return ctx.reply(
          `⚠️ *Bot yaratish limiti to'lgan!*\n\n` +
          `Sizda allaqachon *${userBots.length} ta* bot mavjud. Tarifsiz maksimal limit — *1 ta bot*.\n\n` +
          `Yangi bot yaratish uchun quyidagi tariflardan birini tanlang:`,
          {
            parse_mode: 'Markdown',
            ...keyboards.getTariffsKeyboard()
          }
        );
      }

      // Botni bazaga saqlash
      const botRecord = db.createBot(userId, token, templateId, botInfo);

      // Botni ishga tushirish
      const startResult = await botManager.startBot(botRecord);

      delete userStates[userId];

      if (startResult.success) {
        await ctx.reply(
          `🎉 *Tabriklaymiz! Botingiz muvaffaqiyatli ishga tushdi!*\n\n` +
          `🤖 Nomi: *${botInfo.first_name}*\n` +
          `🔗 Havola: @${botInfo.username}\n` +
          `📂 Turi: *${template.name}*\n` +
          `⚡ Holati: *🟢 Faol (Online)*\n\n` +
          `Endi botingizga kirib, sinab ko'rishingiz mumkin! Botingizda \`/admin\` buyrug'ini yozsangiz, o'z botingizning admin paneliga kirasiz!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('🚀 Botingizga o\'tish', `https://t.me/${botInfo.username}`)],
              [Markup.button.callback('📁 Botlarim ro\'yxati', 'my_bots_list')]
            ])
          }
        );
      } else {
        await ctx.reply(`⚠️ Botingiz saqlandi, lekin ishga tushirishda xatolik bo'ldi: ${startResult.error}`);
      }

      return;
    }

    return next();
  });

  bot.action('my_bots_list', async (ctx) => {
    await ctx.answerCbQuery();
    const userBots = db.getUserBots(ctx.from.id);
    let msg = `📁 *Sizning botlaringiz:*\n\n`;
    const buttons = [];

    userBots.forEach((b) => {
      const isRunning = botManager.isBotRunning(b.id);
      msg += `• *${b.bot_first_name}* (@${b.bot_username}) — ${isRunning ? '🟢 Faol' : '🔴 To\'xtatilgan'}\n`;
      buttons.push([Markup.button.callback(`⚙️ @${b.bot_username}`, `manage_bot_${b.id}`)]);
    });

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    });
  });
};
