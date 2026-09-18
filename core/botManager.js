const { Telegraf } = require('telegraf');
const db = require('../database/db');
const { getTemplate } = require('../templates');

class BotManager {
  constructor() {
    this.runningBots = new Map(); // botId -> Telegraf instance
    this.restartingBots = new Set(); // botId set to prevent duplicate restarts
    this.botHealth = new Map(); // botId -> health details
    this.supervisorInterval = null;
  }

  // Tokenni Telegram orqali tekshirish va ma'lumotlarini olish
  async validateToken(token) {
    try {
      const tempBot = new Telegraf(token);
      const me = await tempBot.telegram.getMe();
      return { success: true, botInfo: me };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Botni 24/7 barqaror rejimda ishga tushirish
  async startBot(botRecord, isAutoRecovery = false) {
    if (!botRecord || !botRecord.id || !botRecord.token) {
      return { success: false, error: 'Bot ma\'lumotlari to\'liq emas' };
    }

    // Agar bot allaqachon ishlayotgan bo'lsa, xavfsiz to'xtatamiz
    if (this.runningBots.has(botRecord.id)) {
      await this.stopBot(botRecord.id, false);
    }

    try {
      const template = getTemplate(botRecord.template);
      if (!template) {
        throw new Error(`Shablon topilmadi: ${botRecord.template}`);
      }

      const clientBot = new Telegraf(botRecord.token);

      // 1. Markdown parse va format xatolarini avtomatik xavfsiz oddiy matnga o'tkazish
      clientBot.use(async (ctx, next) => {
        const origReply = ctx.reply.bind(ctx);
        ctx.reply = async (text, extra = {}) => {
          try {
            return await origReply(text, extra);
          } catch (err) {
            if (err.message && (err.message.includes("can't parse entities") || err.message.includes("Bad Request: can't parse entities"))) {
              const plainExtra = { ...extra };
              delete plainExtra.parse_mode;
              const safeText = typeof text === 'string' ? text.replace(/[*_`\[\]]/g, '') : text;
              return await origReply(safeText, plainExtra);
            }
            console.error(`[@${botRecord.bot_username}] Xabar yuborishda xatolik:`, err.message);
          }
        };
        return next();
      });

      // 2. Mijoz botidagi har bir xabarni jonli log qilish va himoya
      clientBot.use(async (ctx, next) => {
        try {
          if (ctx.from) {
            const userStr = `@${ctx.from.username || ctx.from.id} (${ctx.from.first_name || ''})`;
            if (ctx.message && ctx.message.text) {
              console.log(`🤖 [@${botRecord.bot_username}] 👤 ${userStr} yozdi: ${ctx.message.text}`);
            } else if (ctx.callbackQuery && ctx.callbackQuery.data) {
              console.log(`🤖 [@${botRecord.bot_username}] 👤 ${userStr} tugma bosdi: ${ctx.callbackQuery.data}`);
            }
          }
        } catch (e) {}
        return next();
      });

      // 3. Bot shablon handlerlarini ulash
      template.setupBot(clientBot, botRecord, db);

      // 4. Telegraf ichki xatoliklarini ushlash va botni to'xtab qolishdan asrash
      clientBot.catch((err, ctx) => {
        console.error(`[Mijoz Boti: @${botRecord.bot_username}] Handler xatoligi:`, err.message);
      });

      // 5. Polling rejimida ishga tushirish va ulanish uzilganda 24/7 avto-tiklash
      clientBot.launch({
        dropPendingUpdates: true
      }).then(() => {
        console.log(`📡 [@${botRecord.bot_username}] Polling muvaffaqiyatli boshlandi.`);
      }).catch(err => {
        console.error(`⚠️ [@${botRecord.bot_username}] Polling to'xtadi yoki uzildi (${err.message}). 24/7 Nazorat tizimi avto-tiklashni rejalashtirmoqda...`);
        this.handleBotCrash(botRecord.id, err.message);
      });

      this.runningBots.set(botRecord.id, clientBot);
      this.restartingBots.delete(botRecord.id);
      this.botHealth.set(botRecord.id, {
        lastStarted: new Date(),
        status: 'running',
        username: botRecord.bot_username,
        template: botRecord.template,
        ownerId: botRecord.owner_id
      });

      db.updateBotStatus(botRecord.id, 'running');

      const prefix = isAutoRecovery ? '🔄 [24/7 AVTO-TIKLASH]' : '✅';
      console.log(`${prefix} [@${botRecord.bot_username}] boti 24/7 faol ishlamoqda (${template.name})`);
      return { success: true };
    } catch (err) {
      console.error(`❌ [@${botRecord.bot_username}] botini ishga tushirishda xatolik:`, err.message);
      this.runningBots.delete(botRecord.id);
      
      // Agar vaqtinchalik xatolik bo'lsa va obuna faol bo'lsa, qayta urinish
      if (db.isSubscriptionActive(botRecord.owner_id)) {
        this.scheduleAutoRestart(botRecord.id, 10000);
      } else {
        db.updateBotStatus(botRecord.id, 'stopped');
      }
      return { success: false, error: err.message };
    }
  }

  // Kutilmagan uzilish yoki xatolikda botni 24/7 avtomatik qayta tiklash
  handleBotCrash(botId, errorMsg = '') {
    const currentBot = this.runningBots.get(botId);
    if (currentBot) {
      try {
        currentBot.stop('Auto-restart');
      } catch (e) {}
      this.runningBots.delete(botId);
    }

    const botRecord = db.getBot(botId);
    if (botRecord && db.isSubscriptionActive(botRecord.owner_id) && botRecord.status === 'running') {
      this.scheduleAutoRestart(botId, 5000);
    }
  }

  // Botni avtomatik qayta tiklash taymeri
  scheduleAutoRestart(botId, delayMs = 5000) {
    if (this.restartingBots.has(botId)) return;
    this.restartingBots.add(botId);

    const botRecord = db.getBot(botId);
    const botName = botRecord ? `@${botRecord.bot_username}` : botId;
    console.log(`⏱ [24/7 NAZORAT] ${botName} boti ${Math.round(delayMs / 1000)} soniyadan so'ng qayta ishga tushiriladi...`);

    setTimeout(async () => {
      this.restartingBots.delete(botId);
      const freshBot = db.getBot(botId);
      if (freshBot && db.isSubscriptionActive(freshBot.owner_id) && freshBot.status === 'running') {
        await this.startBot(freshBot, true);
      }
    }, delayMs);
  }

  // Botni to'xtatish (Foydalanuvchi yoki tizim buyrug'i bilan)
  async stopBot(botId, isManual = true) {
    this.restartingBots.delete(botId);
    const clientBot = this.runningBots.get(botId);
    if (clientBot) {
      try {
        clientBot.stop('Tizim tomonidan to\'xtatildi');
      } catch (err) {
        console.error(`Botni to'xtatishda xatolik:`, err.message);
      }
      this.runningBots.delete(botId);
    }

    if (isManual) {
      db.updateBotStatus(botId, 'stopped');
      this.botHealth.set(botId, { status: 'stopped', lastStopped: new Date() });
    }
    return true;
  }

  // 🛡 24/7 NAZORAT VA MONITORING TIZIMI (SUPERVISOR / WATCHDOG)
  startSupervisor(intervalMs = 20000) {
    if (this.supervisorInterval) {
      clearInterval(this.supervisorInterval);
    }

    console.log(`🛡 [24/7 NAZORAT TIZIMI] Botlar monitoringi va nazorati har ${Math.round(intervalMs / 1000)} soniyada faol tekshiruvda!`);

    this.supervisorInterval = setInterval(async () => {
      try {
        const allBots = db.getAllBots();
        for (const botRecord of allBots) {
          const isSubActive = db.isSubscriptionActive(botRecord.owner_id);

          if (isSubActive) {
            // Agar obunasi faol bo'lsa va bot 'running' holatida bo'lsa
            if (botRecord.status === 'running') {
              const isAlive = this.runningBots.has(botRecord.id);
              const isRestarting = this.restartingBots.has(botRecord.id);

              if (!isAlive && !isRestarting) {
                console.log(`🛡 [NAZORAT] @${botRecord.bot_username} obunasi faol, lekin ulanish yo'qolgan. 24/7 avtomatik tiklanmoqda...`);
                await this.startBot(botRecord, true);
              }
            }
          } else {
            // Obunasi tugagan botlarni to'xtatish
            if (this.runningBots.has(botRecord.id)) {
              console.log(`⚠️ [NAZORAT] @${botRecord.bot_username} egasining obuna muddati tugagan. Bot to'xtatildi.`);
              await this.stopBot(botRecord.id, false);
              db.updateBotStatus(botRecord.id, 'stopped');
            }
          }
        }
      } catch (err) {
        console.error('🛡 [NAZORAT TIZIMI] Xatolik:', err.message);
      }
    }, intervalMs);
  }

  // Barcha faol botlarni qayta ishga tushirish va 24/7 nazoratni boshlash
  async startAllActiveBots() {
    const allBots = db.getAllBots();
    console.log(`🔄 Bazadagi botlar 24/7 nazorat ostida ishga tushirilmoqda (${allBots.length} ta)...`);

    for (const botRecord of allBots) {
      // Obunasi faol ekanligini tekshiramiz
      if (db.isSubscriptionActive(botRecord.owner_id)) {
        if (botRecord.status === 'running') {
          console.log(`🚀 [@${botRecord.bot_username}] boti 24/7 ishga tushirilmoqda...`);
          await this.startBot(botRecord);
        }
      } else {
        console.log(`⚠️ [@${botRecord.bot_username}] boti to'xtatildi (Obuna muddati tugagan)`);
        db.updateBotStatus(botRecord.id, 'stopped');
      }
    }

    // 24/7 Supervisor nazorat tizimini ishga tushiramiz
    this.startSupervisor(20000);
  }

  isBotRunning(botId) {
    return this.runningBots.has(botId);
  }

  getRunningCount() {
    return this.runningBots.size;
  }

  getSupervisionReport() {
    return {
      runningCount: this.runningBots.size,
      restartingCount: this.restartingBots.size,
      supervisorActive: !!this.supervisorInterval,
      trackedBots: this.botHealth.size
    };
  }
}

module.exports = new BotManager();
