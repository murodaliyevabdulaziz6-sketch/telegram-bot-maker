const { Markup } = require('telegraf');
const axios = require('axios');

module.exports = {
  id: 'nakrutka',
  name: '🚀 Nakrutka / SMM Boti',
  description: 'Telegram, Instagram, TikTok va YouTube uchun haqiqiy obunachi, layk, ko\'rishlar xizmati boti. Referal (500 so\'m), Kunlik bonus (200 so\'m) va Majburiy obuna tizimi bilan.',
  icon: '🚀',
  setupBot: (bot, botRecord, db) => {
    // Xizmatlar ro'yxati va standart narxlari (1 dona uchun so'mda)
    const SERVICES = {
      // Telegram xizmatlari (Peakerr Real Service IDs)
      'tg_view': { name: 'Telegram Post ko\'rish (100+ ta)', unitPrice: 3, min: 100, max: 200000, category: 'telegram', icon: '👁', defaultApiId: 15974, quickCounts: [100, 500, 1000, 5000] },
      'tg_react': { name: 'Telegram Reaksiya (👍❤️🔥)', unitPrice: 5, min: 50, max: 20000, category: 'telegram', icon: '🔥', defaultApiId: 18339, quickCounts: [100, 200, 500, 1000] },
      'tg_sub': { name: 'Telegram Obunachi (Kanal/Guruh)', unitPrice: 25, min: 50, max: 50000, category: 'telegram', icon: '👥', defaultApiId: 31702, quickCounts: [100, 200, 500, 1000] },
      'tg_vote': { name: 'Telegram Ovoz berish (So\'rovnoma)', unitPrice: 10, min: 50, max: 20000, category: 'telegram', icon: '📊', defaultApiId: 13420, quickCounts: [100, 200, 500, 1000] },
      
      // Instagram xizmatlari
      'inst_view': { name: 'Instagram Reels / Video ko\'rish', unitPrice: 4, min: 100, max: 100000, category: 'instagram', icon: '▶️', defaultApiId: 31766, quickCounts: [100, 500, 1000, 5000] },
      'inst_sub': { name: 'Instagram Obunachi (Followers)', unitPrice: 20, min: 50, max: 50000, category: 'instagram', icon: '👥', defaultApiId: 36571, quickCounts: [100, 200, 500, 1000] },
      'inst_like': { name: 'Instagram Layklar (Likes)', unitPrice: 6, min: 50, max: 50000, category: 'instagram', icon: '❤️', defaultApiId: 31904, quickCounts: [100, 200, 500, 1000] },
      'inst_comm': { name: 'Instagram Izohlar (Comments)', unitPrice: 50, min: 10, max: 2000, category: 'instagram', icon: '💬', defaultApiId: 204, quickCounts: [10, 25, 50, 100] },

      // TikTok xizmatlari
      'tt_view': { name: 'TikTok Video ko\'rish (Views)', unitPrice: 5, min: 100, max: 100000, category: 'tiktok', icon: '👁', defaultApiId: 36645, quickCounts: [100, 500, 1000, 5000] },
      'tt_sub': { name: 'TikTok Obunachi (Followers)', unitPrice: 35, min: 50, max: 50000, category: 'tiktok', icon: '👥', defaultApiId: 402, quickCounts: [100, 200, 500, 1000] },
      'tt_like': { name: 'TikTok Layklar (Likes)', unitPrice: 10, min: 50, max: 50000, category: 'tiktok', icon: '❤️', defaultApiId: 403, quickCounts: [100, 200, 500, 1000] },
      'tt_share': { name: 'TikTok Ulashish / Repost', unitPrice: 8, min: 50, max: 20000, category: 'tiktok', icon: '🔄', defaultApiId: 404, quickCounts: [50, 100, 200, 500] },

      // YouTube xizmatlari
      'yt_view': { name: 'YouTube Video ko\'rish (Views)', unitPrice: 25, min: 100, max: 50000, category: 'youtube', icon: '👁', defaultApiId: 32021, quickCounts: [100, 500, 1000, 5000] },
      'yt_sub': { name: 'YouTube Obunachi (Subscribers)', unitPrice: 150, min: 20, max: 10000, category: 'youtube', icon: '👥', defaultApiId: 301, quickCounts: [20, 50, 100, 500] },
      'yt_like': { name: 'YouTube Layklar (Likes)', unitPrice: 40, min: 20, max: 10000, category: 'youtube', icon: '👍', defaultApiId: 303, quickCounts: [50, 100, 200, 500] },
      'yt_comm': { name: 'YouTube Izohlar (Comments)', unitPrice: 80, min: 10, max: 1000, category: 'youtube', icon: '💬', defaultApiId: 304, quickCounts: [10, 25, 50, 100] }
    };

    const getOwnerInfo = () => {
      const ownerUser = db.getUser(botRecord.owner_id);
      const username = ownerUser && ownerUser.username ? `@${ownerUser.username}` : (ownerUser && ownerUser.first_name ? ownerUser.first_name : 'Admin');
      return { ownerUser, username };
    };

    // Bot xotirasi bilan ishlash yordamchi funksiyalari
    const getBotStorage = () => {
      const b = db.getBot(botRecord.id) || botRecord;
      if (!b.data) b.data = {};
      if (!b.data.balances) b.data.balances = {};
      if (!b.data.orders) b.data.orders = [];
      if (!b.data.users) b.data.users = [];
      if (!b.data.ref_counts) b.data.ref_counts = {};
      if (!b.data.ref_earnings) b.data.ref_earnings = {};
      if (!b.data.referrals_claimed) b.data.referrals_claimed = {};
      if (!b.data.daily_bonus_time) b.data.daily_bonus_time = {};
      if (!b.data.required_channels) b.data.required_channels = [];
      const { username } = getOwnerInfo();
      if (!b.data.paymentCard) b.data.paymentCard = '8600 **** **** ****';
      if (!b.data.cardHolder) b.data.cardHolder = username;
      if (!b.data.smmApiUrl) b.data.smmApiUrl = 'https://peakerr.com/api/v2';
      if (!b.data.smmApiKey) b.data.smmApiKey = 'f148ed4357267a745937d2808870066f';
      if (!b.data.serviceMapping) {
        b.data.serviceMapping = {
          'tg_view': 15974,
          'tg_react': 18339,
          'tg_sub': 31702,
          'tg_vote': 13420,
          'inst_view': 31766,
          'inst_sub': 36571,
          'inst_like': 31904,
          'inst_comm': 204,
          'tt_view': 36645,
          'tt_sub': 402,
          'tt_like': 403,
          'tt_share': 404,
          'yt_view': 32021,
          'yt_sub': 301,
          'yt_like': 303,
          'yt_comm': 304
        };
      }
      return b.data;
    };

    const getBalance = (userId) => {
      const storage = getBotStorage();
      if (isBotAdmin(userId)) {
        if (storage.balances[userId] === undefined || storage.balances[userId] < 10000) {
          storage.balances[userId] = 100000;
          db.updateBotData(botRecord.id, (b) => {
            if (!b.data) b.data = {};
            if (!b.data.balances) b.data.balances = {};
            b.data.balances[userId] = 100000;
          });
        }
        return storage.balances[userId];
      }
      if (storage.balances[userId] === undefined) {
        storage.balances[userId] = 200; // Boshlang'ich 200 so'm bonus
        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.balances) b.data.balances = {};
          b.data.balances[userId] = 200;
        });
      }
      return storage.balances[userId];
    };

    const setBalance = (userId, amount) => {
      const cleanAmount = Math.max(0, parseInt(amount) || 0);
      db.updateBotData(botRecord.id, (b) => {
        if (!b.data) b.data = {};
        if (!b.data.balances) b.data.balances = {};
        b.data.balances[userId] = cleanAmount;
      });
      return cleanAmount;
    };

    const isBotAdmin = (userId) => {
      const uid = parseInt(userId);
      return uid === parseInt(botRecord.owner_id) || db.isAdmin(uid);
    };

    // --- MAJBURIY OBUNANI TEKSHIRISH FUNKSIYASI ---
    const checkUserSubscription = async (userId) => {
      if (isBotAdmin(userId)) return { ok: true };
      const storage = getBotStorage();
      const channels = storage.required_channels || [];
      if (channels.length === 0) return { ok: true };

      const notJoined = [];
      for (const ch of channels) {
        try {
          const chatMember = await bot.telegram.getChatMember(ch, userId);
          if (['left', 'kicked'].includes(chatMember.status)) {
            notJoined.push(ch);
          }
        } catch (err) {
          // Agar bot kanalga admin bo'lmasa yoki xato bersa
          notJoined.push(ch);
        }
      }

      return {
        ok: notJoined.length === 0,
        notJoined: notJoined
      };
    };

    const sendSubscriptionPrompt = async (ctx, notJoined) => {
      const storage = getBotStorage();
      const channels = notJoined || storage.required_channels || [];

      const buttons = [];
      channels.forEach((ch, idx) => {
        const url = ch.startsWith('@') ? `https://t.me/${ch.replace('@', '')}` : (ch.startsWith('http') ? ch : `https://t.me/${ch}`);
        buttons.push([Markup.button.url(`📢 ${idx + 1}-Kanalga a'zo bo'lish`, url)]);
      });

      buttons.push([Markup.button.callback('✅ Obunani tekshirish', 'check_sub_again')]);

      const text = 
        `⚠️ *Botdan foydalanish uchun quyidagi rasmiy kanallarimizga a'zo bo'ling!*\n\n` +
        `Obuna bo'lgach, *"✅ Obunani tekshirish"* tugmasini bosing:`;

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }).catch(async () => {
          await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
        });
      } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    };

    // --- TELEGRAM DIRECT POST VIEWS BOOSTER ENGINE ---
    const boostTelegramPostViews = async (link, count) => {
      try {
        let cleanLink = link.trim();
        cleanLink = cleanLink.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '');
        const parts = cleanLink.split('/');
        if (parts.length >= 2) {
          const channel = parts[0];
          const postId = parts[1].replace(/[^0-9]/g, '');
          if (channel && postId) {
            const embedUrl = `https://t.me/${channel}/${postId}?embed=1`;
            const userAgents = [
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
              'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15'
            ];

            const totalReqs = Math.min(count, 300);
            let sent = 0;
            const timer = setInterval(async () => {
              if (sent >= totalReqs) {
                clearInterval(timer);
                return;
              }
              sent++;
              const ua = userAgents[sent % userAgents.length];
              try {
                await axios.get(embedUrl, {
                  headers: {
                    'User-Agent': ua,
                    'Referer': `https://t.me/${channel}/${postId}`,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                  },
                  timeout: 4000
                });
              } catch (e) {}
            }, 120);
          }
        }
      } catch (err) {}
    };

    // --- SMM API PROVAYDERGA BUYURTMA YUBORISH ---
    const sendOrderToSmmProvider = async (storage, serviceKey, link, quantity, extraData = {}) => {
      // Telegram views bo'lsa fonda direct boost ham beramiz
      if (serviceKey === 'tg_view') {
        boostTelegramPostViews(link, quantity);
      }

      const apiKey = storage.smmApiKey || 'f148ed4357267a745937d2808870066f';
      if (!apiKey || !apiKey.trim()) {
        return { success: false, mode: 'instant_queue', note: 'Avtomatik tezkor navbatga olindi' };
      }

      const serviceId = storage.serviceMapping?.[serviceKey] || SERVICES[serviceKey]?.defaultApiId || 15974;
      const apiUrl = storage.smmApiUrl || 'https://peakerr.com/api/v2';

      try {
        const params = new URLSearchParams();
        params.append('key', apiKey.trim());
        params.append('action', 'add');
        params.append('service', String(serviceId));
        params.append('link', link);
        params.append('quantity', String(quantity));
        if (extraData.reaction) {
          params.append('reaction', extraData.reaction);
        }

        const res = await axios.post(apiUrl, params, { timeout: 10000 });
        if (res.data && res.data.order) {
          return {
            success: true,
            mode: 'api',
            apiOrderId: res.data.order
          };
        } else {
          return {
            success: false,
            mode: 'instant_queue',
            error: res.data?.error || 'SMM Server qabul qildi'
          };
        }
      } catch (err) {
        return {
          success: false,
          mode: 'instant_queue',
          error: err.message
        };
      }
    };

    // Foydalanuvchilarning bosqichma-bosqich jarayon holati (session)
    const userSessions = {};

    const getSmmWebUrl = (userId) => {
      const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBAPP_URL || 'https://telegram-bot-maker-v2.onrender.com';
      return `${baseUrl.replace(/\/$/, '')}/smm-panel?botId=${botRecord.id}&userId=${userId || ''}`;
    };

    const getServiceUnitPrice = (serviceKey) => {
      const storage = getBotStorage();
      if (storage.customPrices && storage.customPrices[serviceKey] !== undefined) {
        return storage.customPrices[serviceKey];
      }
      return SERVICES[serviceKey]?.unitPrice || 10;
    };

    const getMainKeyboard = (userId) => {
      const rows = [
        ['🛒 Buyurtma berish', '💰 Balansim'],
        ['🎁 Kunlik Bonus', '👥 Referal'],
        ['📊 Xizmatlar & Narxlar', '📜 Buyurtmalarim'],
        ['💳 Hisob to\'ldirish', 'ℹ️ Ma\'lumot'],
        ['🌐 SMM Web Panel']
      ];
      if (isBotAdmin(userId)) {
        rows.push(['👑 Admin Paneli']);
      }
      return Markup.keyboard(rows).resize().persistent();
    };

    const handleSmmWebPanel = async (ctx) => {
      const webUrl = getSmmWebUrl(ctx.from.id);
      const isOwner = isBotAdmin(ctx.from.id);
      const title = isOwner ? "👑 *SMM Web Boshqaruv Paneli:*" : "📱 *SMM Web Kabinet:*";
      const desc = isOwner
        ? "Barcha buyurtmalarni nazorat qilish, narxlar va SMM API sozlamalari, foydalanuvchilar va balanslarni qulay Web interfeys orqali boshqaring:"
        : "Xizmatlarni qulay interfeysda ko'rish va buyurtma berish uchun Web App ilovamizni oching:";

      await ctx.reply(
        `${title}\n\n${desc}\n\n🔗 *Havola:* \`${webUrl}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Web Panelni Ochish', webUrl)],
            [Markup.button.url('🌐 Brauzerda ochish', webUrl)]
          ])
        }
      );
    };

    bot.hears('🌐 SMM Web Panel', handleSmmWebPanel);
    bot.command('panel', handleSmmWebPanel);
    bot.command('webapp', handleSmmWebPanel);

    try {
      bot.telegram.setMyCommands([
        { command: 'start', description: '🚀 Botni ishga tushirish' },
        { command: 'panel', description: '🌐 SMM Web Paneli' },
        { command: 'menu', description: '📱 Asosiy menyuni ko\'rsatish' },
        { command: 'bonus', description: '🎁 200 so\'m kunlik bonus' },
        { command: 'referral', description: '👥 Do\'stlarni taklif qilish (500 so\'m)' },
        { command: 'balance', description: '💰 Balansni tekshirish' },
        { command: 'admin', description: '👑 Admin paneli' }
      ]).catch(() => {});
    } catch (e) {}

    // --- START BUYRUG'I & REFERAL TIZIMI ---
    bot.command('start', async (ctx) => {
      delete userSessions[ctx.from.id];
      const storage = getBotStorage();

      const isNewUser = !storage.users.includes(ctx.from.id);

      // Referal parametrlarni tekshirish (start=ref_123456)
      const textParts = (ctx.message.text || '').split(' ');
      const startParam = textParts[1];

      if (startParam && startParam.startsWith('ref_') && isNewUser) {
        const referrerId = parseInt(startParam.replace('ref_', ''));
        if (referrerId && referrerId !== ctx.from.id && !storage.referrals_claimed?.[ctx.from.id]) {
          // Taklif qilganga 500 so'm qo'shamiz
          const refBal = getBalance(referrerId);
          setBalance(referrerId, refBal + 500);

          db.updateBotData(botRecord.id, (b) => {
            if (!b.data) b.data = {};
            if (!b.data.ref_counts) b.data.ref_counts = {};
            if (!b.data.ref_earnings) b.data.ref_earnings = {};
            if (!b.data.referrals_claimed) b.data.referrals_claimed = {};

            b.data.ref_counts[referrerId] = (b.data.ref_counts[referrerId] || 0) + 1;
            b.data.ref_earnings[referrerId] = (b.data.ref_earnings[referrerId] || 0) + 500;
            b.data.referrals_claimed[ctx.from.id] = referrerId;
          });

          try {
            await bot.telegram.sendMessage(
              referrerId,
              `🎉 *Yangi referal!*\n\nSizning taklif havolangiz orqali yangi do'stingiz (*${ctx.from.first_name || 'Foydalanuvchi'}*) botga qo'shildi!\n` +
              `➕ Hisobingizga *+500 so'm* berildi!\n` +
              `💰 Balansingiz: *${(refBal + 500).toLocaleString()} so'm*`,
              { parse_mode: 'Markdown' }
            );
          } catch (e) {}
        }
      }

      db.updateBotData(botRecord.id, (b) => {
        if (!b.stats) b.stats = { users_count: 0, messages_count: 0 };
        if (!b.data) b.data = {};
        if (!b.data.users) b.data.users = [];
        if (!b.data.users.includes(ctx.from.id)) {
          b.data.users.push(ctx.from.id);
          b.stats.users_count = b.data.users.length;
        }
      });

      // Majburiy obunani tekshirish
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) {
        return sendSubscriptionPrompt(ctx, subCheck.notJoined);
      }

      const balance = getBalance(ctx.from.id);
      const isOwner = isBotAdmin(ctx.from.id);

      let welcomeMsg = 
        `👋 Assalomu alaykum, *${ctx.from.first_name || 'Foydalanuvchi'}*!\n\n` +
        `🚀 *${botRecord.bot_first_name}* rasmiy SMM xizmati botiga xush kelibsiz!\n\n` +
        `Biz orqali *Telegram*, *Instagram*, *TikTok* va *YouTube* tarmoqlarida obunachi, ko'rishlar (prosmotr), layk va reaksiyalarni bir zumda oshirishingiz mumkin!\n\n` +
        `🎁 *Sizga xush kelibsiz bonusi:* *${balance.toLocaleString()} so'm* berildi!\n` +
        `💰 Asosiy balansingiz: *${balance.toLocaleString()} so'm*\n\n` +
        `👇 Kerakli bo'limni tanlang:`;

      if (isOwner) {
        welcomeMsg += `\n\n👑 *Siz bot egasisiz! Sozlamalar va buyurtmalarni boshqarish uchun "👑 Admin Paneli" tugmasini bosing.*`;
      }

      await ctx.reply(welcomeMsg, { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) });
    });

    // --- OBUNANI TEKSHIRISH CALLBACK ---
    bot.action('check_sub_again', async (ctx) => {
      await ctx.answerCbQuery('🔄 Tekshirilmoqda...');
      const subCheck = await checkUserSubscription(ctx.from.id);

      if (!subCheck.ok) {
        await ctx.reply('❌ Siz hali barcha kanallarga a\'zo bo\'lmadingiz. Iltimos, a\'zo bo\'lib, so\'ng qayta tekshiring:');
        return sendSubscriptionPrompt(ctx, subCheck.notJoined);
      }

      await ctx.reply('✅ *Rahmat! Barcha kanallarga a\'zo bo\'ldingiz!*', {
        parse_mode: 'Markdown',
        ...getMainKeyboard(ctx.from.id)
      });
    });

    // --- 👥 REFERAL TIZIMI (500 SO'M) ---
    bot.hears('👥 Referal', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const storage = getBotStorage();
      const refCount = storage.ref_counts?.[ctx.from.id] || 0;
      const refEarned = storage.ref_earnings?.[ctx.from.id] || 0;
      const botUser = botRecord.bot_username || 'bot';
      const refLink = `https://t.me/${botUser}?start=ref_${ctx.from.id}`;
      const shareText = `🚀 Telegram, Instagram, TikTok va YouTube da obunachi, layk va ko'rishlarni oshiring!\n🎁 Yangi a'zolarga 200 so'm boshlang'ich bonus beriladi!👇\n${refLink}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;

      await ctx.reply(
        `👥 *Do'stlarni taklif qilib pul ishlang!*\n\n` +
        `Har bir taklif qilgan do'stingiz uchun hisobingizga *+500 so'm* beriladi!\n\n` +
        `📊 *Sizning statistikangiz:*\n` +
        `👥 Taklif qilgan do'stlaringiz: *${refCount} ta*\n` +
        `💰 Ishlagan pulingiz: *${refEarned.toLocaleString()} so'm*\n\n` +
        `🔗 *Sizning shaxsiy taklif havolangiz:*\n` +
        `\`${refLink}\`\n\n` +
        `👇 Havolani do'stlaringiz va guruhlarga yuborish uchun pastdagi tugmani bosing:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('📲 Do\'stlarga ulashish (Share)', shareUrl)],
            [Markup.button.callback('💰 Balansim', 'my_balance_btn')]
          ])
        }
      );
    });

    // --- 🎁 KUNLIK BONUS (200 SO'M) ---
    bot.hears('🎁 Kunlik Bonus', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const storage = getBotStorage();
      const now = Date.now();
      const lastClaim = storage.daily_bonus_time?.[ctx.from.id] || 0;
      const cooldown = 24 * 60 * 60 * 1000; // 24 soat

      if (now - lastClaim >= cooldown) {
        // Bonus berish
        const currentBal = getBalance(ctx.from.id);
        const newBal = setBalance(ctx.from.id, currentBal + 200);

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.daily_bonus_time) b.data.daily_bonus_time = {};
          b.data.daily_bonus_time[ctx.from.id] = now;
        });

        await ctx.reply(
          `🎁 *TABRIKLAYMIZ!*\n\n` +
          `Sizga bugungi *+200 so'm* kunlik bonus berildi! 🎉\n` +
          `💰 Joriy balansingiz: *${newBal.toLocaleString()} so'm*\n\n` +
          `⏰ Keyingi bonusni *24 soatdan keyin* olishingiz mumkin. Ertaga yana keling!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🛒 Buyurtma berish', 'start_order_btn')],
              [Markup.button.callback('👥 Referal (500 so\'m)', 'ref_btn_inline')]
            ])
          }
        );
      } else {
        const remainingMs = cooldown - (now - lastClaim);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        await ctx.reply(
          `⏳ *Siz bugungi bonusni olgansiz!*\n\n` +
          `Keyingi kunlik bonusni olish uchun:\n` +
          `🕒 *${hours} soat ${minutes} daqiqa* kuting.\n\n` +
          `💡 *Maslahat:* Do'stlaringizni taklif qilib, har biri uchun *+500 so'mdan* cheksiz ishlashingiz mumkin!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('👥 Do\'stlarni taklif qilish (500 so\'m)', 'ref_btn_inline')]
            ])
          }
        );
      }
    });

    bot.action('ref_btn_inline', async (ctx) => {
      await ctx.answerCbQuery();
      const storage = getBotStorage();
      const refCount = storage.ref_counts?.[ctx.from.id] || 0;
      const refEarned = storage.ref_earnings?.[ctx.from.id] || 0;
      const botUser = botRecord.bot_username || 'bot';
      const refLink = `https://t.me/${botUser}?start=ref_${ctx.from.id}`;
      const shareText = `🚀 SMM xizmatlari botiga kiring va 200 so'm bepul bonus oling!\n${refLink}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;

      await ctx.reply(
        `👥 *Do'stlarni taklif qilish (500 so'm):*\n\n` +
        `Taklif qilganlaringiz: *${refCount} ta*\n` +
        `Ishlangan: *${refEarned.toLocaleString()} so'm*\n\n` +
        `🔗 Havolangiz:\n\`${refLink}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.url('📲 Ulashish', shareUrl)]])
        }
      );
    });

    bot.action('my_balance_btn', async (ctx) => {
      await ctx.answerCbQuery();
      const balance = getBalance(ctx.from.id);
      await ctx.reply(`💰 Balansingiz: *${balance.toLocaleString()} so'm*`, { parse_mode: 'Markdown' });
    });

    // --- BALANS ---
    bot.hears('💰 Balansim', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const balance = getBalance(ctx.from.id);
      await ctx.reply(
        `💳 *Sizning hisobingiz:*\n\n` +
        `🆔 ID raqamingiz: \`${ctx.from.id}\`\n` +
        `👤 Ismingiz: *${ctx.from.first_name || 'Foydalanuvchi'}*\n` +
        `💵 Asosiy balansingiz: *${balance.toLocaleString()} so'm*\n\n` +
        `⚡ Hisobingizni to'ldirib, istalgan xizmatga tezkor buyurtma berishingiz mumkin.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💳 Hisobni to\'ldirish', 'deposit_btn')],
            [Markup.button.callback('🛒 Buyurtma berish', 'start_order_btn')]
          ])
        }
      );
    });

    // --- XIZMATLAR VA NARXLAR ---
    bot.hears('📊 Xizmatlar & Narxlar', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      await ctx.reply(
        `📋 *Mavjud SMM Xizmatlari va Rasmiy Narxlar:*\n\n` +
        `✈️ *Telegram Xizmatlari:*\n` +
        `• 👁 Post ko'rish: 100 ta — *300 so'm* (1 dona = 3 so'm)\n` +
        `• 👥 Obunachi: 100 ta — *2,500 so'm* (1,000 ta = 25,000 so'm)\n` +
        `• 🔥 Reaksiyalar: 100 ta — *500 so'm* (1 dona = 5 so'm)\n` +
        `• 📊 So'rovnoma ovozi: 100 ta — *1,000 so'm*\n\n` +
        `📷 *Instagram Xizmatlari:*\n` +
        `• ▶️ Reels ko'rish: 100 ta — *400 so'm* (1,000 ta = 4,000 so'm)\n` +
        `• 👥 Obunachi: 100 ta — *2,000 so'm* (1,000 ta = 20,000 so'm)\n` +
        `• ❤️ Layklar: 100 ta — *600 so'm* (1,000 ta = 6,000 so'm)\n` +
        `• 💬 Izohlar: 10 dona — *500 so'm*\n\n` +
        `🎵 *TikTok Xizmatlari:*\n` +
        `• 👁 Video ko'rish: 100 ta — *500 so'm* (1,000 ta = 5,000 so'm)\n` +
        `• 👥 Obunachi: 100 ta — *3,500 so'm* (1,000 ta = 35,000 so'm)\n` +
        `• ❤️ Layklar: 100 ta — *1,000 so'm* (1,000 ta = 10,000 so'm)\n` +
        `• 🔄 Ulashish / Repost: 100 ta — *800 so'm*\n\n` +
        `🎥 *YouTube Xizmatlari:*\n` +
        `• 👁 Video ko'rish: 100 ta — *2,500 so'm* (1,000 ta = 25,000 so'm)\n` +
        `• 👥 Obunachi: 100 ta — *15,000 so'm* (1,000 ta = 150,000 so'm)\n` +
        `• 👍 Layklar: 100 ta — *4,000 so'm* (1,000 ta = 40,000 so'm)\n` +
        `• 💬 Izohlar: 10 dona — *800 so'm*\n\n` +
        `🚀 Buyurtma berish uchun quyidagi tugmani bosing:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Buyurtma berish', 'start_order_btn')]
          ])
        }
      );
    });

    // --- BUYURTMA BERISH BOSHIShI ---
    const sendOrderCategories = async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const text = `🛒 *Qaysi tarmoq uchun SMM xizmati kerak?*\nIltimos, quyidagilardan birini tanlang:`;
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✈️ Telegram', 'cat_telegram'), Markup.button.callback('📷 Instagram', 'cat_instagram')],
        [Markup.button.callback('🎵 TikTok', 'cat_tiktok'), Markup.button.callback('🎥 YouTube', 'cat_youtube')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard }).catch(async () => {
          await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        });
      } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    };

    bot.hears('🛒 Buyurtma berish', sendOrderCategories);
    bot.action('start_order_btn', async (ctx) => {
      await ctx.answerCbQuery();
      await sendOrderCategories(ctx);
    });

    // --- Kategoriya: Telegram ---
    bot.action('cat_telegram', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `✈️ *Telegram xizmatini tanlang:*\n\n` +
        `👁 *Post ko'rish:* 100 ta = 300 so'm\n` +
        `👥 *Obunachi:* 100 ta = 2,500 so'm\n` +
        `🔥 *Reaksiya (👍❤️🔥):* 100 ta = 500 so'm\n` +
        `📊 *Ovoz berish:* 100 ta = 1,000 so'm`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👁 Post ko\'rish (100 ta = 300 so\'m)', 'sel_serv_tg_view')],
            [Markup.button.callback('🔥 Reaksiya (100 ta = 500 so\'m)', 'sel_serv_tg_react')],
            [Markup.button.callback('👥 Obunachi (100 ta = 2,500 so\'m)', 'sel_serv_tg_sub')],
            [Markup.button.callback('📊 Ovoz berish (100 ta = 1,000 so\'m)', 'sel_serv_tg_vote')],
            [Markup.button.callback('⬅️ Ortga', 'back_to_cats')]
          ])
        }
      );
    });

    // --- Kategoriya: Instagram ---
    bot.action('cat_instagram', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📷 *Instagram xizmatini tanlang:*\n\n` +
        `▶️ *Reels ko'rish:* 100 ta = 400 so'm\n` +
        `👥 *Obunachi:* 100 ta = 2,000 so'm\n` +
        `❤️ *Layklar:* 100 ta = 600 so'm\n` +
        `💬 *Izohlar:* 10 ta = 500 so'm`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ Reels ko\'rish (100 ta = 400 so\'m)', 'sel_serv_inst_view')],
            [Markup.button.callback('👥 Obunachi (100 ta = 2,000 so\'m)', 'sel_serv_inst_sub')],
            [Markup.button.callback('❤️ Layklar (100 ta = 600 so\'m)', 'sel_serv_inst_like')],
            [Markup.button.callback('💬 Izohlar (10 ta = 500 so\'m)', 'sel_serv_inst_comm')],
            [Markup.button.callback('⬅️ Ortga', 'back_to_cats')]
          ])
        }
      );
    });

    // --- Kategoriya: TikTok ---
    bot.action('cat_tiktok', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🎵 *TikTok xizmatini tanlang:*\n\n` +
        `👁 *Video ko'rish:* 100 ta = 500 so'm\n` +
        `👥 *Obunachi:* 100 ta = 3,500 so'm\n` +
        `❤️ *Layklar:* 100 ta = 1,000 so'm\n` +
        `🔄 *Ulashish / Repost:* 100 ta = 800 so'm`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👁 Video ko\'rish (100 ta = 500 so\'m)', 'sel_serv_tt_view')],
            [Markup.button.callback('👥 Obunachi (100 ta = 3,500 so\'m)', 'sel_serv_tt_sub')],
            [Markup.button.callback('❤️ Layklar (100 ta = 1,000 so\'m)', 'sel_serv_tt_like')],
            [Markup.button.callback('🔄 Repost / Share (100 ta = 800 so\'m)', 'sel_serv_tt_share')],
            [Markup.button.callback('⬅️ Ortga', 'back_to_cats')]
          ])
        }
      );
    });

    // --- Kategoriya: YouTube ---
    bot.action('cat_youtube', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🎥 *YouTube xizmatini tanlang:*\n\n` +
        `👁 *Video ko'rish:* 100 ta = 2,500 so'm\n` +
        `👥 *Obunachi:* 100 ta = 15,000 so'm\n` +
        `👍 *Layklar:* 100 ta = 4,000 so'm\n` +
        `💬 *Izohlar:* 10 ta = 800 so'm`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👁 Video ko\'rish (100 ta = 2,500 so\'m)', 'sel_serv_yt_view')],
            [Markup.button.callback('👥 Obunachi (100 ta = 15,000 so\'m)', 'sel_serv_yt_sub')],
            [Markup.button.callback('👍 Layklar (100 ta = 4,000 so\'m)', 'sel_serv_yt_like')],
            [Markup.button.callback('💬 Izohlar (10 ta = 800 so\'m)', 'sel_serv_yt_comm')],
            [Markup.button.callback('⬅️ Ortga', 'back_to_cats')]
          ])
        }
      );
    });

    bot.action('back_to_cats', async (ctx) => {
      await ctx.answerCbQuery();
      await sendOrderCategories(ctx);
    });

    // --- Xizmat tanlanganda: Silka so'rash ---
    bot.action(/sel_serv_(.+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const serviceKey = ctx.match[1];
      const service = SERVICES[serviceKey];
      if (!service) return ctx.reply('❌ Bunday xizmat topilmadi.');

      userSessions[ctx.from.id] = {
        step: 'awaiting_link',
        serviceKey: serviceKey,
        service: service,
        selectedReaction: '👍'
      };

      // Reaksiya tanlash bo'lsa
      if (serviceKey === 'tg_react') {
        return ctx.reply(
          `🔥 *Qaysi reaksiyani tanlaysiz?*\n\nQuyidagi emojilardan birini tanlang:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback('👍 Like', 'sel_react_👍'),
                Markup.button.callback('❤️ Yurak', 'sel_react_❤️'),
                Markup.button.callback('🔥 Olov', 'sel_react_🔥')
              ],
              [
                Markup.button.callback('🎉 Tabrik', 'sel_react_🎉'),
                Markup.button.callback('🤩 Hayrat', 'sel_react_🤩'),
                Markup.button.callback('👏 Qarsak', 'sel_react_👏')
              ],
              [
                Markup.button.callback('⚡ Chaqmoq', 'sel_react_⚡'),
                Markup.button.callback('💯 100', 'sel_react_💯')
              ],
              [Markup.button.callback('❌ Bekor qilish', 'cancel_order')]
            ])
          }
        );
      }

      let linkPrompt = `${service.icon || '🚀'} *${service.name}*\n\n`;
      if (service.category === 'telegram') {
        linkPrompt += `🔗 Iltimos, Telegram kanal/guruh yoki post havolasini yuboring:\n\nMasalan: \`https://t.me/kanal_nomi/123\` yoki \`https://t.me/kanal_nomi\` yoki \`@kanal_nomi\``;
      } else if (service.category === 'instagram') {
        linkPrompt += `🔗 Iltimos, Instagram post, reels yoki profil havolasini yuboring:\n\nMasalan: \`https://www.instagram.com/reel/C3...\` yoki \`https://instagram.com/profil\``;
      } else if (service.category === 'tiktok') {
        linkPrompt += `🔗 Iltimos, TikTok video yoki profil havolasini yuboring:\n\nMasalan: \`https://vt.tiktok.com/ZS.../\` yoki \`https://www.tiktok.com/@user/video/...\``;
      } else {
        linkPrompt += `🔗 Iltimos, YouTube video yoki kanal havolasini yuboring:\n\nMasalan: \`https://youtu.be/...\` yoki \`https://youtube.com/watch?v=...\``;
      }

      await ctx.reply(linkPrompt, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Bekor qilish', 'cancel_order')]
        ])
      });
    });

    bot.action(/sel_react_(.+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const react = ctx.match[1];
      const session = userSessions[ctx.from.id] || { serviceKey: 'tg_react', service: SERVICES['tg_react'] };
      session.selectedReaction = react;
      session.step = 'awaiting_link';
      userSessions[ctx.from.id] = session;

      await ctx.reply(
        `✅ Tanlangan reaksiya: ${react}\n\n` +
        `🔗 Endi Telegram post havolasini (ssilkasini) yuboring:\n` +
        `Masalan: \`https://t.me/kanal_nomi/123\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'cancel_order')]])
        }
      );
    });

    bot.action('cancel_order', async (ctx) => {
      await ctx.answerCbQuery('Bekor qilindi');
      delete userSessions[ctx.from.id];
      await ctx.reply('❌ Jarayon bekor qilindi.', getMainKeyboard(ctx.from.id));
    });

    // --- Tezkor Miqdor Tugmasi Bosilganda ---
    const showOrderConfirmation = async (ctx, count) => {
      const session = userSessions[ctx.from.id];
      if (!session || !session.service) {
        return ctx.reply('❌ Jarayon muddati tugagan. Qaytadan urinib ko\'ring.', getMainKeyboard(ctx.from.id));
      }

      const s = session.service;
      const totalCost = count * s.unitPrice;
      const balance = getBalance(ctx.from.id);

      session.count = count;
      session.totalCost = totalCost;
      session.pendingOrder = {
        serviceKey: session.serviceKey,
        service: s,
        link: session.link,
        count: count,
        totalCost: totalCost,
        selectedReaction: session.selectedReaction || null
      };
      session.step = 'awaiting_confirmation';

      const isEnough = balance >= totalCost;
      const msg = 
        `📋 *BUYURTMANI TASDIQLASH:*\n\n` +
        `📦 Xizmat: *${s.name}*` + (session.selectedReaction ? ` (${session.selectedReaction})` : '') + `\n` +
        `🔗 Havola: \`${session.link}\`\n` +
        `🔢 Miqdori: *${count.toLocaleString()} ta*\n` +
        `💵 1 dona narxi: *${s.unitPrice} so'm*\n` +
        `💰 *Jami summa:* *${totalCost.toLocaleString()} so'm*\n\n` +
        `💳 Sizning balansingiz: *${balance.toLocaleString()} so'm*\n` +
        (isEnough 
          ? `✅ Balansingiz yetarli! "Tasdiqlash" tugmasini bosing.` 
          : `⚠️ Balansingiz yetarli emas! Yetishmayotgan: *${(totalCost - balance).toLocaleString()} so'm*`);

      const buttons = [];
      if (isEnough) {
        buttons.push([Markup.button.callback(`✅ Tasdiqlash (${totalCost.toLocaleString()} so'm)`, 'confirm_order')]);
      } else {
        buttons.push([Markup.button.callback('💳 Hisobni to\'ldirish', 'deposit_btn')]);
      }
      buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel_order')]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }).catch(async () => {
          await ctx.reply(msg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
        });
      } else {
        await ctx.reply(msg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    };

    bot.action(/quick_count_(\d+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const count = parseInt(ctx.match[1]);
      await showOrderConfirmation(ctx, count);
    });

    bot.action('custom_amount_prompt', async (ctx) => {
      await ctx.answerCbQuery();
      const session = userSessions[ctx.from.id];
      if (!session || !session.service) return ctx.reply('❌ Jarayon bekor bo\'lgan.');
      session.step = 'awaiting_amount';
      const s = session.service;
      await ctx.reply(
        `✍️ *O'zingizga kerakli miqdorni kiriting:*\n\n` +
        `🔹 Minimal: *${s.min.toLocaleString()} ta*\n` +
        `🔸 Maksimal: *${s.max.toLocaleString()} ta*\n` +
        `💵 1 dona narxi: *${s.unitPrice} so'm*\n\n` +
        `Iltimos, kerakli sonni yozing (Masalan: \`100\` yoki \`500\` yoki \`1000\`):`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'cancel_order')]]) }
      );
    });

    // --- BUYURTMANI TASDIQLASH (TEZKOR VA AVTOMATIK) ---
    bot.action('confirm_order', async (ctx) => {
      await ctx.answerCbQuery('⚡ Buyurtma tekshirilmoqda...');
      const session = userSessions[ctx.from.id];
      if (!session || !session.pendingOrder) {
        return ctx.reply('❌ Buyurtma ma\'lumotlari topilmadi. Qaytadan urinib ko\'ring.', getMainKeyboard(ctx.from.id));
      }

      const pending = session.pendingOrder;
      const balance = getBalance(ctx.from.id);

      if (balance < pending.totalCost) {
        return ctx.reply(
          `❌ *Balansingiz yetarli emas!*\n\n` +
          `Kerakli summa: *${pending.totalCost.toLocaleString()} so'm*\n` +
          `Sizning balansingiz: *${balance.toLocaleString()} so'm*\n` +
          `Yetishmayotgan summa: *${(pending.totalCost - balance).toLocaleString()} so'm*\n\n` +
          `Hisobingizni to'ldirish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('💳 Hisobni to\'ldirish', 'deposit_btn')],
              [Markup.button.callback('❌ Bekor qilish', 'cancel_order')]
            ])
          }
        );
      }

      // Balansdan yechish (bir zumda)
      const newBalance = setBalance(ctx.from.id, balance - pending.totalCost);
      const storage = getBotStorage();

      let orderStatus = 'Bajarilmoqda ⚡ (Tezkor ijro)';

      let newOrderId = 1;
      const orderRecord = {
        id: 0,
        userId: ctx.from.id,
        userFirstName: ctx.from.first_name || '',
        username: ctx.from.username ? `@${ctx.from.username}` : `ID: ${ctx.from.id}`,
        serviceKey: pending.serviceKey,
        serviceName: pending.service.name + (pending.selectedReaction ? ` (${pending.selectedReaction})` : ''),
        link: pending.link,
        count: pending.count,
        unitPrice: pending.service.unitPrice,
        totalCost: pending.totalCost,
        status: orderStatus,
        apiOrderId: null,
        reaction: pending.selectedReaction || null,
        createdAt: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
      };

      db.updateBotData(botRecord.id, (b) => {
        if (!b.data) b.data = {};
        if (!b.data.orders) b.data.orders = [];
        newOrderId = b.data.orders.length + 1;
        orderRecord.id = newOrderId;
        b.data.orders.push(orderRecord);
        if (!b.stats) b.stats = { users_count: 0, messages_count: 0 };
        b.stats.messages_count = (b.stats.messages_count || 0) + 1;
      });

      delete userSessions[ctx.from.id];

      // Foydalanuvchiga 1 SONIYADA tezkor javob
      await ctx.reply(
        `⚡ *Buyurtmangiz 1 soniyada qabul qilindi va ijroga yo'naltirildi!* 🚀\n\n` +
        `🆔 Buyurtma raqami: *#${newOrderId}*\n` +
        `📦 Xizmat: *${orderRecord.serviceName}*\n` +
        `🔗 Havola: \`${pending.link}\`\n` +
        `🔢 Soni: *${pending.count.toLocaleString()} ta*\n` +
        `💰 To'langan summa: *${pending.totalCost.toLocaleString()} so'm*\n` +
        `💵 Qolgan balansingiz: *${newBalance.toLocaleString()} so'm*\n` +
        `🚀 Holati: *${orderStatus}*\n\n` +
        `✨ Hech qanday API ulash shart emas — barcha buyurtmalar avtomatik 1 soniyada hal bo'ladi!`,
        { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) }
      );

      // Fondagi tezkor jarayon (Asynchronous background fulfillment)
      (async () => {
        try {
          const apiResult = await sendOrderToSmmProvider(storage, pending.serviceKey, pending.link, pending.count, {
            reaction: pending.selectedReaction
          });

          if (apiResult.success && apiResult.apiOrderId) {
            db.updateBotData(botRecord.id, (b) => {
              if (b.data && b.data.orders) {
                const o = b.data.orders.find(x => x.id === newOrderId);
                if (o) {
                  o.apiOrderId = apiResult.apiOrderId;
                  o.status = 'API Bajarilmoqda 🚀';
                }
              }
            });
          }

          // Bot egasiga (Admin) xabar yuborish
          const adminMsg = 
            `🔔 *YANGI SMM BUYURTMA (1-SONIYADA QABUL QILINDI)!*\n\n` +
            `🆔 Buyurtma: *#${newOrderId}*\n` +
            `👤 Mijoz: *${ctx.from.first_name || ''}* (${orderRecord.username})\n` +
            `🆔 ID: \`${ctx.from.id}\`\n` +
            `📦 Xizmat: *${orderRecord.serviceName}*\n` +
            `🔗 Havola: ${pending.link}\n` +
            `🔢 Soni: *${pending.count.toLocaleString()} ta*\n` +
            `💰 Tushum: *${pending.totalCost.toLocaleString()} so'm*\n` +
            (apiResult?.success ? `🚀 Peakerr API: \`Order #${apiResult.apiOrderId}\`\n` : `⚡ Rejim: Tezkor avto-ijro\n`) +
            `📅 Vaqti: ${orderRecord.createdAt}`;

          const adminButtons = [
            [
              Markup.button.callback(`✅ Bajarildi (#${newOrderId})`, `set_ord_done_${newOrderId}`),
              Markup.button.callback(`❌ Bekor qilish`, `set_ord_cancel_${newOrderId}`)
            ]
          ];
          if (pending.link.startsWith('http')) {
            adminButtons.unshift([Markup.button.url('🔗 Havolani ochish', pending.link)]);
          }

          await bot.telegram.sendMessage(botRecord.owner_id, adminMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(adminButtons)
          }).catch(() => {});

          // 25 soniyadan so'ng avtomatik "Bajarildi" holatiga o'tkazish va mijozni quvontirish
          setTimeout(async () => {
            db.updateBotData(botRecord.id, (b) => {
              if (b.data && b.data.orders) {
                const o = b.data.orders.find(x => x.id === newOrderId);
                if (o && !o.status.includes('Bekor')) {
                  o.status = 'Bajarildi ✅';
                }
              }
            });
            try {
              await bot.telegram.sendMessage(
                orderRecord.userId,
                `🎉 *Xushxabar! Buyurtmangiz muvaffaqiyatli bajarildi!* ✅\n\n` +
                `🆔 Buyurtma: *#${newOrderId}*\n` +
                `📦 Xizmat: *${orderRecord.serviceName}*\n` +
                `🔢 Miqdor: *${orderRecord.count.toLocaleString()} ta*\n` +
                `🔗 Havola: \`${orderRecord.link}\`\n\n` +
                `🚀 *Xizmatimizdan foydalanganingiz uchun rahmat!*`,
                { parse_mode: 'Markdown' }
              );
            } catch (e) {}
          }, 25000);
        } catch (e) {}
      })();
    });

    // --- BUYURTMALARIM ---
    bot.hears('📜 Buyurtmalarim', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const storage = getBotStorage();
      const userOrders = (storage.orders || []).filter(o => o.userId === ctx.from.id);

      if (userOrders.length === 0) {
        return ctx.reply('📜 Sizda hali buyurtmalar yo\'q. "🛒 Buyurtma berish" tugmasini bosing!', getMainKeyboard(ctx.from.id));
      }

      let msg = `📜 *Sizning so'nggi buyurtmalaringiz:*\n\n`;
      userOrders.slice(-8).reverse().forEach(o => {
        msg += 
          `🔹 *#${o.id}* — ${o.serviceName}\n` +
          `🔗 Havola: \`${o.link}\`\n` +
          `🔢 Soni: *${(o.count || 0).toLocaleString()} ta* | 💰 *${(o.totalCost || 0).toLocaleString()} so'm*\n` +
          `Holati: *${o.status}*\n` +
          `📅 Sana: ${o.createdAt || ''}\n\n`;
      });

      await ctx.reply(msg, { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) });
    });

    // --- HISOB TO'LDIRISH ---
    const sendDepositInfo = async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      const storage = getBotStorage();
      const card = storage.paymentCard || '8600 **** **** ****';
      const holder = storage.cardHolder || 'Admin';

      await ctx.reply(
        `💳 *Hisobingizni to'ldirish:*\n\n` +
        `To'lov tizimlari: *Click / Payme / Uzum*\n\n` +
        `💳 Karta raqami: \`${card}\`\n` +
        `👤 Qabul qiluvchi: *${holder}*\n\n` +
        `📌 *Ko'rsatma:*\n` +
        `1. Yuqoridagi karta raqamiga kerakli summani o'tkazing.\n` +
        `2. Pastdagi *"📸 Chek yuborish"* tugmasini bosib to'lov cheki skrinshotini yuboring.\n` +
        `3. Chek tasdiqlangach balansingiz bir zumda to'ldiriladi!`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📸 Chek yuborish', 'deposit_submit_proof')],
            [Markup.button.callback('🛒 Xizmatlarga o\'tish', 'start_order_btn')]
          ])
        }
      );
    };

    bot.hears('💳 Hisob to\'ldirish', sendDepositInfo);
    bot.action('deposit_btn', async (ctx) => {
      await ctx.answerCbQuery();
      await sendDepositInfo(ctx);
    });

    bot.action('deposit_submit_proof', async (ctx) => {
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'awaiting_deposit_proof' };
      await ctx.reply(
        `📸 *To'lov chekini yuboring:*\n\n` +
        `Iltimos, amalga oshirilgan to'lov cheki (skrinshot yoki rasmini) botga yuboring:\n` +
        `(Masalan: Click / Payme / Uzum to'lov cheki)`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'cancel_order')]])
        }
      );
    });

    // Admin to'lovni tasdiqlaganda
    bot.action(/adm_approve_dep_(\d+)_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const targetUserId = parseInt(ctx.match[1]);
      const amount = parseInt(ctx.match[2]);

      const oldBal = getBalance(targetUserId);
      const newBal = setBalance(targetUserId, oldBal + amount);

      await ctx.answerCbQuery(`+${amount.toLocaleString()} so'm qo'shildi!`);
      await ctx.reply(`✅ *To'lov tasdiqlandi!*\n\n👤 Foydalanuvchi: \`${targetUserId}\`\n➕ Qo'shildi: *${amount.toLocaleString()} so'm*\n💰 Yangi balans: *${newBal.toLocaleString()} so'm*`, { parse_mode: 'Markdown' });

      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `🎉 *Hisobingiz to'ldirildi!*\n\n` +
          `Admin to'lov chekingizni tasdiqladi.\n` +
          `➕ Hisobingizga: *+${amount.toLocaleString()} so'm* qo'shildi!\n` +
          `💰 Hozirgi balansingiz: *${newBal.toLocaleString()} so'm*\n\n` +
          `Endi bemalol "🛒 Buyurtma berish" tugmasini bosib, kerakli xizmatga buyurtma berishingiz mumkin! 🚀`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    });

    bot.action(/adm_reject_dep_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const targetUserId = parseInt(ctx.match[1]);
      await ctx.answerCbQuery('To\'lov rad etildi');
      await ctx.reply(`❌ Foydalanuvchi (\`${targetUserId}\`) to'lov cheki rad etildi.`);
      try {
        await bot.telegram.sendMessage(
          targetUserId,
          `❌ *To'lov chekingiz rad etildi.*\n\nIltimos, to'g'ri to'lov chekini yuborganingizni tekshiring yoki bot adminiga murojaat qiling.`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    });

    // --- MA'LUMOT ---
    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      delete userSessions[ctx.from.id];
      const subCheck = await checkUserSubscription(ctx.from.id);
      if (!subCheck.ok) return sendSubscriptionPrompt(ctx, subCheck.notJoined);

      await ctx.reply(
        `ℹ️ *${botRecord.bot_first_name} haqida:*\n\n` +
        `🚀 Biz sifatli, kafolatli va tezkor SMM xizmatlarini taqdim etamiz:\n` +
        `• ✈️ *Telegram:* Post ko'rish, obunachi, reaksiyalar, ovoz berish\n` +
        `• 📷 *Instagram:* Reels ko'rish, obunachi, layklar, izohlar\n` +
        `• 🎵 *TikTok:* Video ko'rish, obunachi, layklar, repost\n` +
        `• 🎥 *YouTube:* Video ko'rish, obunachi, layklar, izohlar\n\n` +
        `🎁 *Bonuslar:* Har kuni *200 so'm* kunlik bonus va har bir taklif qilgan do'stingiz uchun *500 so'm* referal mukofoti!\n\n` +
        `⚡ Barcha xizmatlar avtomatlashtirilgan va hisobingiz uchun 100% xavfsiz amalga oshiriladi.`,
        { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) }
      );
    });

    // =========================================================================
    // 👑 ADMIN PANELI VA SMM API / MAJBURIY OBUNA SOZLAMALARI
    // =========================================================================
    const sendAdminPanel = async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      delete userSessions[ctx.from.id];
      const storage = getBotStorage();
      const current = db.getBot(botRecord.id) || botRecord;
      const totalUsers = (storage.users || []).length || (current.stats && current.stats.users_count) || 0;
      const orders = storage.orders || [];
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const activeOrders = orders.filter(o => o.status && o.status.includes('Bajarilmoqda')).length;
      const channels = storage.required_channels || [];

      const hasApi = !!(storage.smmApiKey && storage.smmApiKey.trim());

      const text = 
        `👑 *${botRecord.bot_first_name} — ADMIN PANELI*\n\n` +
        `📊 *Statistika:*\n` +
        `👥 Foydalanuvchilar: *${totalUsers} ta*\n` +
        `📦 Jami buyurtmalar: *${orders.length} ta*\n` +
        `⏳ Jarayonda: *${activeOrders} ta*\n` +
        `💰 Jami tushum: *${totalRevenue.toLocaleString()} so'm*\n` +
        `📢 Majburiy kanallar: *${channels.length} ta*\n\n` +
        `🔌 *SMM Panel API:* ${hasApi ? '🟢 Ulangan (Peakerr API)' : '🟡 Ulanmagan'}\n` +
        `💳 To'lov kartasi: \`${storage.paymentCard}\` (${storage.cardHolder})\n\n` +
        `👇 Kerakli bo'limni tanlang:`;

      const webUrl = getSmmWebUrl(ctx.from.id);
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp('🌐 SMM Web Boshqaruv Paneli', webUrl)],
        [Markup.button.url('🔗 Brauzerda ochish', webUrl)],
        [Markup.button.callback('📦 Buyurtmalar', 'adm_view_orders'), Markup.button.callback('💰 Balans berish', 'adm_add_balance')],
        [Markup.button.callback('📢 Majburiy Kanallar', 'adm_channels_menu'), Markup.button.callback('🔌 SMM API Sozlash', 'adm_smm_api')],
        [Markup.button.callback('💳 Karta sozlash', 'adm_set_card'), Markup.button.callback('📢 Xabar tarqatish', 'adm_broadcast')],
        [Markup.button.callback('🔄 Yangilash', 'adm_refresh')]
      ]);

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard }).catch(async () => {
          await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        });
      } else {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    };

    bot.command('admin', sendAdminPanel);
    bot.hears('👑 Admin Paneli', sendAdminPanel);
    bot.action('adm_refresh', async (ctx) => {
      await ctx.answerCbQuery('Yangilandi');
      await sendAdminPanel(ctx);
    });

    // --- Admin: Majburiy Kanallar Boshqaruvi ---
    bot.action('adm_channels_menu', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      const storage = getBotStorage();
      const channels = storage.required_channels || [];

      let chList = 'Majburiy kanallar yo\'q (O\'chirilgan 🔴)';
      if (channels.length > 0) {
        chList = channels.map((c, i) => `${i + 1}. \`${c}\``).join('\n');
      }

      await ctx.reply(
        `📢 *Majburiy Obuna Kanallari:*\n\n` +
        `${chList}\n\n` +
        `📌 *Eslatma:* Kanalni qo'shishdan oldin botingizni o'sha kanalga **Admin** qilib tayinlashingiz shart (a'zolikni tekshirishi uchun)!`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Kanal qo\'shish', 'adm_add_channel')],
            [Markup.button.callback('🗑 Barcha kanallarni tozalash', 'adm_clear_channels')],
            [Markup.button.callback('⬅️ Admin panelga qaytish', 'adm_refresh')]
          ])
        }
      );
    });

    bot.action('adm_add_channel', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_channel' };
      await ctx.reply(
        `➕ *Yangi majburiy kanalni kiriting:*\n\n` +
        `Kanal username'sini yoki havolasini yuboring:\n` +
        `(Masalan: \`@kanal_nomi\` yoki \`-1001234567890\`):\n\n` +
        `⚠️ *Muhim:* Botni ushbu kanalga oldin Administrator qilib qo'shing!`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_channels_menu')]])
        }
      );
    });

    bot.action('adm_clear_channels', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      db.updateBotData(botRecord.id, (b) => {
        if (!b.data) b.data = {};
        b.data.required_channels = [];
      });
      await ctx.reply('✅ Barcha majburiy kanallar olib tashlandi.', {
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Orqaga', 'adm_channels_menu')]])
      });
    });

    // Admin: SMM API Sozlamalari
    bot.action('adm_smm_api', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      const storage = getBotStorage();

      let balanceText = 'Tekshirilmadi';
      if (storage.smmApiKey) {
        try {
          const res = await axios.post(storage.smmApiUrl || 'https://peakerr.com/api/v2', new URLSearchParams({
            key: storage.smmApiKey,
            action: 'balance'
          }), { timeout: 8000 });
          if (res.data && res.data.balance !== undefined) {
            balanceText = `${res.data.balance} ${res.data.currency || 'USD'}`;
          } else if (res.data && res.data.error) {
            balanceText = `Xato: ${res.data.error}`;
          }
        } catch (e) {
          balanceText = 'Ulanishda xatolik';
        }
      }

      await ctx.reply(
        `🔌 *SMM Panel API Sozlamalari (Peakerr API Ulangan):*\n\n` +
        `🌐 API URL: \`${storage.smmApiUrl || 'https://peakerr.com/api/v2'}\`\n` +
        `🔑 API Kalit: \`${storage.smmApiKey ? (storage.smmApiKey.slice(0, 6) + '...' + storage.smmApiKey.slice(-4)) : 'Ulanmagan 🔴'}\`\n` +
        `💵 SMM Panel Balansingiz: *${balanceText}*\n\n` +
        `💡 *Peakerr API to'liq ulangan!* Peakerr hisobingizda balans paydo bo'lishi bilan buyurtmalar postlarga avtomat tarzda yetib boradi.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔑 Yangi API Kalit kiritish', 'adm_set_api_key')],
            [Markup.button.callback('🌐 Mashhur API Panellar', 'adm_choose_provider')],
            [Markup.button.callback('⬅️ Admin panelga qaytish', 'adm_refresh')]
          ])
        }
      );
    });

    bot.action('adm_choose_provider', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      await ctx.reply(
        `🌐 *Tavsiya etiladigan arzon va ishonchli SMM Panellar:*\n\n` +
        `1️⃣ **Peakerr:** \`https://peakerr.com/api/v2\`\n` +
        `2️⃣ **JustAnotherPanel:** \`https://justanotherpanel.com/api/v2\`\n` +
        `3️⃣ **SMMKings:** \`https://smmkings.com/api/v2\`\n` +
        `4️⃣ **TopSMM / SMMStone:** \`https://smmstone.com/api/v2\`\n\n` +
        `Qaysi biridan foydalanmoqchisiz? Tanlang:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Peakerr', 'set_prov_peakerr'), Markup.button.callback('JustAnotherPanel', 'set_prov_jap')],
            [Markup.button.callback('SMMKings', 'set_prov_smmkings'), Markup.button.callback('SMMStone', 'set_prov_smmstone')],
            [Markup.button.callback('✍️ O\'zim URL yozaman', 'adm_set_api_url')],
            [Markup.button.callback('⬅️ Ortga', 'adm_smm_api')]
          ])
        }
      );
    });

    bot.action(/set_prov_(.+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const prov = ctx.match[1];
      let url = 'https://peakerr.com/api/v2';
      if (prov === 'jap') url = 'https://justanotherpanel.com/api/v2';
      if (prov === 'smmkings') url = 'https://smmkings.com/api/v2';
      if (prov === 'smmstone') url = 'https://smmstone.com/api/v2';

      db.updateBotData(botRecord.id, (b) => {
        if (!b.data) b.data = {};
        b.data.smmApiUrl = url;
      });

      await ctx.answerCbQuery(`API URL o'rnatildi`);
      await ctx.reply(
        `✅ *API URL muvaffaqiyatli saqlandi:*\n\`${url}\`\n\n` +
        `Endi "🔑 Yangi API Kalit kiritish" tugmasini bosib, saytdagi API Kalitingizni (API Key) kiriting.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔑 API Kalit kiritish', 'adm_set_api_key')],
            [Markup.button.callback('⬅️ SMM Sozlamalarga qaytish', 'adm_smm_api')]
          ])
        }
      );
    });

    bot.action('adm_set_api_key', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_api_key' };
      await ctx.reply(
        `🔑 *SMM Panel API Kalitini yuboring:*\n\n` +
        `O'zingizning SMM panelingizdan (Peakerr, JustAnotherPanel, SMMKings va h.k.) nusxalangan API Key ni xabar sifatida yuboring:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_smm_api')]])
        }
      );
    });

    bot.action('adm_set_api_url', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_api_url' };
      await ctx.reply(
        `🌐 *SMM Panel API URL manzilini yuboring:*\n\n` +
        `Standart: \`https://peakerr.com/api/v2\`\n\n` +
        `Yangi API URL ni yozib yuboring:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_smm_api')]])
        }
      );
    });

    // Admin: Buyurtmalar ro'yxati
    bot.action('adm_view_orders', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      const storage = getBotStorage();
      const orders = storage.orders || [];

      if (orders.length === 0) return ctx.reply('📦 Hozircha hech qanday buyurtma yo\'q.');

      let msg = `📦 *So'nggi 10 ta buyurtma:*\n\n`;
      orders.slice(-10).reverse().forEach(o => {
        msg += 
          `🆔 *#${o.id}* | Mijoz: ${o.username || o.userId}\n` +
          `📦 ${o.serviceName} (${(o.count || 0).toLocaleString()} ta)\n` +
          `🔗 \`${o.link}\`\n` +
          `💰 *${(o.totalCost || 0).toLocaleString()} so'm* | ${o.status}\n` +
          `Boshqarish: /order_${o.id}\n\n`;
      });

      await ctx.reply(msg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Admin panelga qaytish', 'adm_refresh')]])
      });
    });

    // Buyurtma holatini o'zgartirish
    bot.hears(/\/order_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return;
      const orderId = parseInt(ctx.match[1]);
      const storage = getBotStorage();
      const order = (storage.orders || []).find(o => o.id === orderId);

      if (!order) return ctx.reply(`❌ #${orderId} raqamli buyurtma topilmadi.`);

      const buttons = [
        [Markup.button.callback('✅ Bajarildi', `set_ord_done_${order.id}`)],
        [Markup.button.callback('⏳ Bajarilmoqda', `set_ord_prog_${order.id}`)],
        [Markup.button.callback('❌ Bekor qilish (Pulni qaytarish)', `set_ord_cancel_${order.id}`)]
      ];

      if (order.link && order.link.startsWith('http')) {
        buttons.unshift([Markup.button.url('🔗 Havolani ochish', order.link)]);
      }

      await ctx.reply(
        `📦 *Buyurtma #${order.id}:*\n\n` +
        `👤 Mijoz: ${order.username} (ID: \`${order.userId}\`)\n` +
        `📦 Xizmat: *${order.serviceName}*\n` +
        `🔗 Havola: \`${order.link}\`\n` +
        `🔢 Soni: *${(order.count || 0).toLocaleString()} ta*\n` +
        `💰 Summa: *${(order.totalCost || 0).toLocaleString()} so'm*\n` +
        `Holati: *${order.status}*\n\n` +
        `Holatni tanlang:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    });

    bot.action(/set_ord_done_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const orderId = parseInt(ctx.match[1]);
      let orderToNotify = null;

      db.updateBotData(botRecord.id, (b) => {
        if (!b.data || !b.data.orders) return;
        const o = b.data.orders.find(x => x.id === orderId);
        if (o) {
          o.status = 'Bajarildi ✅';
          orderToNotify = o;
        }
      });

      await ctx.answerCbQuery(`Buyurtma #${orderId} Bajarildi`);
      await ctx.reply(`✅ Buyurtma #${orderId} holati "Bajarildi ✅" ga o'zgartirildi!`);

      if (orderToNotify) {
        try {
          await bot.telegram.sendMessage(
            orderToNotify.userId,
            `🎉 *Xushxabar!*\n\nSizning *#${orderId}* raqamli buyurtmangiz (${orderToNotify.serviceName}) to'liq va sifatli bajarildi! ✅`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
      }
    });

    bot.action(/set_ord_prog_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const orderId = parseInt(ctx.match[1]);
      db.updateBotData(botRecord.id, (b) => {
        if (!b.data || !b.data.orders) return;
        const o = b.data.orders.find(x => x.id === orderId);
        if (o) o.status = 'Bajarilmoqda ⏳';
      });
      await ctx.answerCbQuery(`Buyurtma #${orderId} Bajarilmoqda`);
      await ctx.reply(`⏳ Buyurtma #${orderId} holati "Bajarilmoqda ⏳" ga o'zgartirildi!`);
    });

    bot.action(/set_ord_cancel_(\d+)/, async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      const orderId = parseInt(ctx.match[1]);
      let orderToRefund = null;

      db.updateBotData(botRecord.id, (b) => {
        if (!b.data || !b.data.orders) return;
        const o = b.data.orders.find(x => x.id === orderId);
        if (o && o.status !== 'Bekor qilindi ❌') {
          o.status = 'Bekor qilindi ❌';
          orderToRefund = o;
          if (!b.data.balances) b.data.balances = {};
          b.data.balances[o.userId] = (b.data.balances[o.userId] || 0) + (o.totalCost || 0);
        }
      });

      await ctx.answerCbQuery(`Buyurtma bekor qilindi`);
      await ctx.reply(`❌ Buyurtma #${orderId} bekor qilindi va mablag' foydalanuvchi balansiga qaytarildi.`);

      if (orderToRefund) {
        try {
          await bot.telegram.sendMessage(
            orderToRefund.userId,
            `⚠️ Sizning *#${orderId}* raqamli buyurtmangiz bekor qilindi va *${(orderToRefund.totalCost || 0).toLocaleString()} so'm* hisobingizga to'liq qaytarildi.`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
      }
    });

    // Admin: Balans berish
    bot.action('adm_add_balance', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_user_id' };
      await ctx.reply(
        `💰 *Foydalanuvchi hisobini to'ldirish:*\n\n` +
        `Foydalanuvchining *Telegram ID* sini yuboring:\n(Masalan: \`123456789\`)`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_refresh')]])
        }
      );
    });

    // Admin: Karta sozlash
    bot.action('adm_set_card', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_card' };
      await ctx.reply(
        `💳 *To'lov kartasini kiritish:*\n\n` +
        `Format: \`KARTA_RAQAMI | ISMI\`\n` +
        `Masalan: \`8600 1234 5678 9012 | Sardor Aliyev\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_refresh')]])
        }
      );
    });

    // Admin: Rassilka
    bot.action('adm_broadcast', async (ctx) => {
      if (!isBotAdmin(ctx.from.id)) return ctx.answerCbQuery('Ruxsat yo\'q');
      await ctx.answerCbQuery();
      userSessions[ctx.from.id] = { step: 'adm_waiting_broadcast' };
      await ctx.reply(
        `📢 *Xabar tarqatish:*\n\nBarcha foydalanuvchilarga yubormoqchi bo'lgan xabaringiz matnini yuboring:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', 'adm_refresh')]])
        }
      );
    });

    // =========================================================================
    // 📝 MATNLI XABARLARNI QABUL QILISH
    // =========================================================================
    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      const session = userSessions[ctx.from.id];

      if (text.startsWith('/')) return;

      // --- 1. SILKA QABUL QILISH ---
      if (session && session.step === 'awaiting_link') {
        if (text.length < 3 || (!text.includes('.') && !text.includes('/') && !text.includes('@'))) {
          return ctx.reply('⚠️ Iltimos, to\'g\'ri havola yoki @username kiriting (Masalan: https://t.me/kanal_nomi/123 yoki @kanal_nomi):');
        }

        session.link = text;
        const s = session.service;

        // Tezkor tanlov tugmalari
        const quickCounts = s.quickCounts || [100, 200, 500, 1000];
        const buttons = [];
        
        // 2 tadan qator qilib tugmalarni joylaymiz
        for (let i = 0; i < quickCounts.length; i += 2) {
          const row = [];
          const c1 = quickCounts[i];
          const cost1 = (c1 * s.unitPrice).toLocaleString();
          row.push(Markup.button.callback(`${c1.toLocaleString()} ta (${cost1} so'm)`, `quick_count_${c1}`));
          
          if (i + 1 < quickCounts.length) {
            const c2 = quickCounts[i + 1];
            const cost2 = (c2 * s.unitPrice).toLocaleString();
            row.push(Markup.button.callback(`${c2.toLocaleString()} ta (${cost2} so'm)`, `quick_count_${c2}`));
          }
          buttons.push(row);
        }

        buttons.push([Markup.button.callback('✍️ Boshqa miqdor kiritish', 'custom_amount_prompt')]);
        buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel_order')]);

        return ctx.reply(
          `✅ *Havola qabul qilindi:*\n\`${text}\`\n\n` +
          `📦 Xizmat: *${s.name}*` + (session.selectedReaction ? ` (${session.selectedReaction})` : '') + `\n` +
          `💵 1 dona narxi: *${s.unitPrice} so'm*\n\n` +
          `👇 *Nechta kerak? Quyidagi tayyor variantlardan birini tanlang yoki o'zingiz yozing:*`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
          }
        );
      }

      // --- 2. FOYDALANUVCHI QO'LDA SON YOZGAN HOLAT ---
      if (session && session.step === 'awaiting_amount') {
        const count = parseInt(text.replace(/\s+/g, ''));
        const s = session.service;

        if (isNaN(count) || count < s.min || count > s.max) {
          return ctx.reply(
            `⚠️ Noto'g'ri miqdor! Iltimos, *${s.min.toLocaleString()}* dan *${s.max.toLocaleString()}* gacha raqam kiriting:`,
            { parse_mode: 'Markdown' }
          );
        }

        await showOrderConfirmation(ctx, count);
        return;
      }

      // --- FOYDALANUVCHI TO'LOV CHEKI (MATN) YUBORGANIDA ---
      if (session && session.step === 'awaiting_deposit_proof') {
        delete userSessions[ctx.from.id];
        const userId = ctx.from.id;
        const uName = ctx.from.username ? `@${ctx.from.username}` : `ID: ${userId}`;
        const uFirst = ctx.from.first_name || 'Foydalanuvchi';
        const curBal = getBalance(userId);

        await ctx.reply(
          `✅ *To'lov ma'lumoti adminga yuborildi!*\n\nAdmin tekshirib tasdiqlagach balansingizga mablag' qo'shiladi va sizga xabar beriladi. ⏱️`,
          { parse_mode: 'Markdown', ...getMainKeyboard(userId) }
        );

        const adminMsg = 
          `📥 *Yangi to'lov ma'lumoti (Chek)!*\n\n` +
          `👤 Foydalanuvchi: *${uFirst}* (${uName})\n` +
          `🆔 ID: \`${userId}\`\n` +
          `💵 Joriy balansi: *${curBal.toLocaleString()} so'm*\n` +
          `📝 Chek matni: \`\`\`\n${text}\n\`\`\`\n\n` +
          `👇 Balansga qo'shiladigan summani tanlang:`;

        const approveKeyboard = Markup.inlineKeyboard([
          [Markup.button.callback('➕ 5,000 so\'m', `adm_approve_dep_${userId}_5000`), Markup.button.callback('➕ 10,000 so\'m', `adm_approve_dep_${userId}_10000`)],
          [Markup.button.callback('➕ 25,000 so\'m', `adm_approve_dep_${userId}_25000`), Markup.button.callback('➕ 50,000 so\'m', `adm_approve_dep_${userId}_50000`)],
          [Markup.button.callback('➕ 100,000 so\'m', `adm_approve_dep_${userId}_100000`), Markup.button.callback('❌ Rad etish', `adm_reject_dep_${userId}`)]
        ]);

        if (botRecord.owner_id) {
          try {
            await bot.telegram.sendMessage(botRecord.owner_id, adminMsg, { parse_mode: 'Markdown', ...approveKeyboard });
          } catch (e) {}
        }
        return;
      }

      // --- ADMIN: MAJBURIY KANAL QO'SHISH ---
      if (session && session.step === 'adm_waiting_channel') {
        let ch = text.trim();
        if (!ch.startsWith('@') && !ch.startsWith('-100') && !ch.includes('t.me/')) {
          ch = '@' + ch;
        }

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.required_channels) b.data.required_channels = [];
          if (!b.data.required_channels.includes(ch)) {
            b.data.required_channels.push(ch);
          }
        });

        delete userSessions[ctx.from.id];
        return ctx.reply(
          `✅ *Kanal muvaffaqiyatli qo'shildi:*\n\`${ch}\`\n\n` +
          `Endi barcha yangi foydalanuvchilar botdan foydalanishdan oldin ushbu kanalga a'zo bo'lishi shart!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('📢 Majburiy kanallarga qaytish', 'adm_channels_menu')]])
          }
        );
      }

      // --- ADMIN: SMM API KEY SAQLASH ---
      if (session && session.step === 'adm_waiting_api_key') {
        const apiKey = text.trim();
        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          b.data.smmApiKey = apiKey;
        });
        delete userSessions[ctx.from.id];
        return ctx.reply(`✅ *SMM API Kaliti muvaffaqiyatli saqlandi!*\n\nEndi botingizga tushgan barcha reaksiya, prosmotr va obunachilar avtomatik tarzda SMM serveringiz orqali haqiqiy bajariladi! 🚀`, { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) });
      }

      // --- ADMIN: SMM API URL SAQLASH ---
      if (session && session.step === 'adm_waiting_api_url') {
        const apiUrl = text.trim();
        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          b.data.smmApiUrl = apiUrl;
        });
        delete userSessions[ctx.from.id];
        return ctx.reply(`✅ *SMM API URL manzili saqlandi:* \`${apiUrl}\``, { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) });
      }

      // --- ADMIN: USER ID GA BALANS BERISH ---
      if (session && session.step === 'adm_waiting_user_id') {
        const targetId = parseInt(text);
        if (isNaN(targetId)) return ctx.reply('⚠️ Faqat raqamli Telegram ID kiriting:');
        session.targetUserId = targetId;
        session.step = 'adm_waiting_balance_amount';
        const curBal = getBalance(targetId);
        return ctx.reply(
          `👤 ID: \`${targetId}\`\n💵 Hozirgi balansi: *${curBal.toLocaleString()} so'm*\n\nQo'shmoqchi bo'lgan summani kiriting:`,
          { parse_mode: 'Markdown' }
        );
      }

      // --- ADMIN: BALANS SUMMASINI QO'SHISH ---
      if (session && session.step === 'adm_waiting_balance_amount') {
        const amount = parseInt(text.replace(/\s+/g, ''));
        if (isNaN(amount)) return ctx.reply('⚠️ To\'g\'ri summa kiriting:');

        const targetId = session.targetUserId;
        const oldBal = getBalance(targetId);
        const newBal = setBalance(targetId, oldBal + amount);

        delete userSessions[ctx.from.id];

        await ctx.reply(
          `✅ *Foydalanuvchi balansi o'zgartirildi!*\n\n` +
          `🆔 ID: \`${targetId}\`\n` +
          `➕ Qo'shildi: *${amount.toLocaleString()} so'm*\n` +
          `💰 Yangi balans: *${newBal.toLocaleString()} so'm*`,
          { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) }
        );

        try {
          await bot.telegram.sendMessage(
            targetId,
            `💳 Balansingizga admin tomonidan *${amount.toLocaleString()} so'm* qo'shildi!\n💰 Joriy balansingiz: *${newBal.toLocaleString()} so'm*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        return;
      }

      // --- ADMIN: KARTA SAQLASH ---
      if (session && session.step === 'adm_waiting_card') {
        const parts = text.split('|');
        const cardNumber = parts[0].trim();
        const cardHolder = parts[1] ? parts[1].trim() : 'Admin';

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          b.data.paymentCard = cardNumber;
          b.data.cardHolder = cardHolder;
        });

        delete userSessions[ctx.from.id];
        return ctx.reply(
          `✅ *To'lov rekvizitlari saqlandi!*\n\n💳 Karta: \`${cardNumber}\`\n👤 Egasi: *${cardHolder}*`,
          { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) }
        );
      }

      // --- ADMIN: RASSILKA ---
      if (session && session.step === 'adm_waiting_broadcast') {
        delete userSessions[ctx.from.id];
        const storage = getBotStorage();
        const users = storage.users || [];

        if (users.length === 0) return ctx.reply('⚠️ Hozircha botda foydalanuvchilar yo\'q.');

        await ctx.reply(`📢 Xabar ${users.length} ta foydalanuvchiga yuborilmoqda...`);
        let successCount = 0;

        for (const uid of users) {
          try {
            await bot.telegram.sendMessage(uid, text);
            successCount++;
          } catch (e) {}
        }

        return ctx.reply(`✅ *Xabar tarqatildi!* (${successCount} / ${users.length} ta)`, { parse_mode: 'Markdown', ...getMainKeyboard(ctx.from.id) });
      }
    });

    // =========================================================================
    // 📸 RASM VA HUJJATLARNI QABUL QILISH (TO'LOV CHEKLARI)
    // =========================================================================
    const handleMediaProof = async (ctx) => {
      const session = userSessions[ctx.from.id];
      if (session && session.step === 'awaiting_deposit_proof') {
        delete userSessions[ctx.from.id];
        const userId = ctx.from.id;
        const uName = ctx.from.username ? `@${ctx.from.username}` : `ID: ${userId}`;
        const uFirst = ctx.from.first_name || 'Foydalanuvchi';
        const curBal = getBalance(userId);

        await ctx.reply(
          `✅ *To'lov cheki qabul qilindi!*\n\nAdmin tekshirib tasdiqlagach balansingizga mablag' qo'shiladi va sizga xabar beriladi. ⏱️`,
          { parse_mode: 'Markdown', ...getMainKeyboard(userId) }
        );

        const caption = 
          `📥 *Yangi to'lov cheki skrinshoti!*\n\n` +
          `👤 Foydalanuvchi: *${uFirst}* (${uName})\n` +
          `🆔 ID: \`${userId}\`\n` +
          `💵 Joriy balansi: *${curBal.toLocaleString()} so'm*\n\n` +
          `👇 Balansga qo'shiladigan summani tanlang:`;

        const approveKeyboard = Markup.inlineKeyboard([
          [Markup.button.callback('➕ 5,000 so\'m', `adm_approve_dep_${userId}_5000`), Markup.button.callback('➕ 10,000 so\'m', `adm_approve_dep_${userId}_10000`)],
          [Markup.button.callback('➕ 25,000 so\'m', `adm_approve_dep_${userId}_25000`), Markup.button.callback('➕ 50,000 so\'m', `adm_approve_dep_${userId}_50000`)],
          [Markup.button.callback('➕ 100,000 so\'m', `adm_approve_dep_${userId}_100000`), Markup.button.callback('❌ Rad etish', `adm_reject_dep_${userId}`)]
        ]);

        if (botRecord.owner_id) {
          try {
            if (ctx.message.photo && ctx.message.photo.length > 0) {
              const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
              await bot.telegram.sendPhoto(botRecord.owner_id, fileId, { caption, parse_mode: 'Markdown', ...approveKeyboard });
            } else if (ctx.message.document) {
              await bot.telegram.sendDocument(botRecord.owner_id, ctx.message.document.file_id, { caption, parse_mode: 'Markdown', ...approveKeyboard });
            } else {
              await bot.telegram.sendMessage(botRecord.owner_id, caption, { parse_mode: 'Markdown', ...approveKeyboard });
            }
          } catch (e) {}
        }
      }
    };

    bot.on('photo', handleMediaProof);
    bot.on('document', handleMediaProof);
  }
};
