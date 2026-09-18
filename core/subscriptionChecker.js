const db = require('../database/db');
const botManager = require('./botManager');
const keyboards = require('./keyboards');
const config = require('../config');
const { Markup } = require('telegraf');

class SubscriptionChecker {
  constructor() {
    this.mainBot = null;
    this.interval = null;
  }

  init(mainBot) {
    this.mainBot = mainBot;
    // Har 2 daqiqada barcha foydalanuvchilarning obunasini tekshirib turadi
    this.interval = setInterval(() => this.checkAllUsers(), 2 * 60 * 1000);
    // Dastlabki tekshiruv 10 soniyadan so'ng
    setTimeout(() => this.checkAllUsers(), 10 * 1000);
  }

  async checkAllUsers() {
    if (!this.mainBot) return;

    try {
      const allUsers = db.getAllUsers();
      const now = new Date();

      for (const user of allUsers) {
        // Admin va Ownerlarni tekshirmaymiz (cheksiz ruxsat)
        if (db.isAdmin(user.id)) continue;
        if (!user.subscription_ends_at) continue;

        const endAt = new Date(user.subscription_ends_at);
        const diffMs = endAt.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // 1. Agar obuna muddatiga 5 soat yoki undan kam vaqt qolgan bo'lsa (0 < diffMs <= 5 soat)
        if (diffMs > 0 && diffHours <= 5) {
          if (!user.notified_5h) {
            await this.send5HoursWarning(user, diffMs);
            user.notified_5h = true;
            db.save();
          }
        }

        // 2. Agar obuna muddati tugagan bo'lsa (diffMs <= 0), lekin 24 soat (8-kun) hali to'lmagan bo'lsa (-24 < diffHours <= 0)
        // Bot to'xtaydi, lekin bazadan o'chib ketmaydi!
        if (diffMs <= 0 && diffHours > -24) {
          if (!user.notified_expired) {
            await this.handleExpiredUser(user);
            user.notified_expired = true;
            user.notified_5h = true; // 5h xabarini qayta yubormaslik uchun
            db.save();
          }
        }

        // 3. Agar obuna tugaganiga 24 soat (1 sutka) bo'lsa (diffHours <= -24) -> Ya'ni 8-kun bo'lganda!
        // Bot butunlay avtomatik tarzda o'chirib yuboriladi!
        if (diffHours <= -24) {
          if (!user.notified_deleted) {
            await this.handleAutoDeleteUserBots(user);
            user.notified_deleted = true;
            user.notified_expired = true;
            user.notified_5h = true;
            db.save();
          }
        }

        // 4. Agar foydalanuvchi obunasini yangilagan / tarif sotib olgan bo'lsa (> 5 soat qolgan)
        if (diffHours > 5) {
          if (user.notified_5h || user.notified_expired || user.notified_deleted) {
            user.notified_5h = false;
            user.notified_expired = false;
            user.notified_deleted = false;
            db.save();
          }
        }
      }
    } catch (err) {
      console.error('SubscriptionChecker xatolik:', err.message);
    }
  }

  // 5 soat qolganda ogohlantirish
  async send5HoursWarning(user, diffMs) {
    try {
      const minutesLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60)));
      const hoursLeft = Math.floor(minutesLeft / 60);
      const remMins = minutesLeft % 60;
      const timeLeftStr = hoursLeft > 0 ? `${hoursLeft} soat ${remMins} daqiqa` : `${remMins} daqiqa`;

      const userBots = db.getUserBots(user.id);
      const botNames = userBots.length > 0 
        ? userBots.map(b => `@${b.bot_username}`).join(', ')
        : 'Botlaringiz';

      const text = 
        `⚠️ *DIQQAT: 3 KUNLIK HOSTING MUDDATINGIZ TUGAMOQDA!*\n\n` +
        `Hurmatli *${user.first_name || 'foydalanuvchi'}*, sizning botingiz uchun berilgan 3 kunlik bepul 24/7 hosting muddati **5 SOATDAN SO'NG TUGAYDI!**\n\n` +
        `⏱ Qolgan vaqt: *${timeLeftStr}*\n` +
        `🤖 Botingiz: *${botNames}*\n\n` +
        `⚠️ *Muhim eslatma:*\n` +
        `• 5 soatdan so'ng botingiz faoliyati avtomatik ravishda **TO'XTATILADI**.\n` +
        `• Agar 24 soat ichida (4-kun bo'lguncha) tarif olib obunani uzaytirmasangiz, botingiz va barcha sozlamalari **BUTUNLAY O'CHIRIB YUBORILADI!**\n\n` +
        `Botlaringiz 24/7 uzluksiz ishlashini ta'minlash va o'chib ketishini oldini olish uchun hoziroq tarifni o'zgartiring / uzaytiring! 👇`;

      await this.mainBot.telegram.sendMessage(user.id, text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💎 Tarifni O\'zgartirish / Uzaytirish', 'tariff_view_all')],
          [Markup.button.callback('📁 Mening Botlarim', 'my_bots_list')]
        ])
      });
      console.log(`📢 [5 Soat Ogohlantirish] ID: ${user.id} ga 5 soatlik obuna ogohlantirishi yuborildi.`);
    } catch (err) {
      console.error(`Foydalanuvchiga (ID: ${user.id}) 5h ogohlantirish yuborishda xatolik:`, err.message);
    }
  }

  // 3 kun to'lganda (muddati tugaganda) - Bot to'xtaydi, lekin O'CHMAYDI!
  async handleExpiredUser(user) {
    try {
      const userBots = db.getUserBots(user.id);
      let stoppedCount = 0;

      for (const b of userBots) {
        if (b.status === 'running' || botManager.isBotRunning(b.id)) {
          await botManager.stopBot(b.id);
          db.updateBotStatus(b.id, 'stopped');
          stoppedCount++;
        }
      }

      const botNames = userBots.length > 0 
        ? userBots.map(b => `@${b.bot_username}`).join(', ')
        : 'Botlaringiz';

      const text = 
        `⛔ *3 KUNLIK HOSTING MUDDATINGIZ YAKUNLANDI!*\n\n` +
        `Hurmatli *${user.first_name || 'foydalanuvchi'}*, sizning 3 kunlik 24/7 bepul hosting muddatingiz to'liq yakunlandi.\n\n` +
        `🛑 Barcha botlaringiz (*${botNames}*) faoliyati avtomatik ravishda **TO'XTATILDI** (lekin hozircha o'chirilmadi, saqlanib turibdi).\n\n` +
        `⏳ *DIQQAT (4-kun qoidasi):*\n` +
        `Sizga 24 soat imtiyozli kutish vaqti berildi. Agar 24 soat ichida (ertaga shu vaqtgacha) tarif sotib olib obunani uzaytirmasangiz, botingiz **AVTOMATIK TARZDA BUTUNLAY O'CHIB KETADI!**\n\n` +
        `🚀 Botingizni darhol qayta yoqish va o'chib ketishidan saqlab qolish uchun quyidagi tugma orqali tarif sotib oling:`;

      await this.mainBot.telegram.sendMessage(user.id, text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💎 Obunani Uzaytirish / Tariflar', 'tariff_view_all')],
          [Markup.button.callback('📁 Mening Botlarim', 'my_bots_list')]
        ])
      });
      console.log(`🛑 [3 Kun To'xtadi] ID: ${user.id} ning ${stoppedCount} ta boti to'xtatildi (o'chirilmadi) va xabar yuborildi.`);
    } catch (err) {
      console.error(`Foydalanuvchiga (ID: ${user.id}) muddat tugaganini yuborishda xatolik:`, err.message);
    }
  }

  // 4-kun bo'lganda (tugaganiga 24 soat bo'lganda) - Bot to'xtatiladi, lekin ma'lumotlari bazada va Web App da 100% saqlanib qoladi!
  async handleAutoDeleteUserBots(user) {
    try {
      const userBots = db.getUserBots(user.id);
      if (userBots.length === 0) return;

      const botNames = userBots.map(b => `@${b.bot_username}`).join(', ');
      let stoppedCount = 0;

      for (const b of userBots) {
        await botManager.stopBot(b.id);
        db.updateBotStatus(b.id, 'stopped');
        stoppedCount++;
      }

      const text = 
        `🛑 *BOTINGIZ VAQTINCHALIK TO'XTATILDI!*\n\n` +
        `Hurmatli *${user.first_name || 'foydalanuvchi'}*, 4 kunlik bepul sinov muddati yakunlandi.\n\n` +
        `⏸ Botingiz (*${botNames}*) to'xtatildi, lekin barcha sozlamalari va ma'lumotlari xavfsiz saqlanib turibdi!\n\n` +
        `💎 Botingizni 24/7 qayta faollashtirish uchun istalgan tarifni tanlang va obunani uzaytiring:`;

      await this.mainBot.telegram.sendMessage(user.id, text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💎 Obunani Faollashtirish / Tariflar', 'tariff_view_all')],
          [Markup.button.callback('📁 Mening Botlarim', 'my_bots_list')]
        ])
      });
      console.log(`⏸ [Muddat Tugadi] ID: ${user.id} ning ${stoppedCount} ta boti to'xtatildi (bazada saqlandi).`);
    } catch (err) {
      console.error(`Foydalanuvchining (ID: ${user.id}) botlarini to'xtatishda xatolik:`, err.message);
    }
  }
}

module.exports = new SubscriptionChecker();
