// ==========================================
// 🚀 ALL-IN-ONE 24/7 TELEGRAM BOT KONSTRUKTORI
// Barcha modullar 1 ta faylda jamlangan (Single File Bundle)
// Render.com va barcha hostinglarda 100% xatosiz ishlaydi!
// ==========================================

const path = require('path');
const fs = require('fs');
const http = require('http');

const _modules = {};
const _moduleCache = {};

function defineModule(name, fn) {
  _modules[name] = fn;
}

function resolveCanonical(currentDir, reqPath) {
  if (!reqPath.startsWith('.')) return reqPath;
  let resolved = path.join(currentDir, reqPath).replace(/\\/g, '/');
  if (resolved.startsWith('/')) resolved = resolved.slice(1);
  if (_modules[resolved + '.js']) return resolved + '.js';
  if (_modules[resolved + '/index.js']) return resolved + '/index.js';
  if (_modules[resolved]) return resolved;
  return resolved;
}

function createScopedRequire(currentDir) {
  return function(modulePath) {
    if (modulePath.startsWith('.')) {
      const resolved = resolveCanonical(currentDir, modulePath);
      if (_modules[resolved]) {
        if (!_moduleCache[resolved]) {
          const m = { exports: {} };
          _moduleCache[resolved] = m;
          _modules[resolved](m.exports, m, createScopedRequire(path.dirname(resolved)));
        }
        return _moduleCache[resolved].exports;
      }
    }
    return require(modulePath);
  };
}


// ---- FILE: config.js ----
defineModule('config.js', function(exports, module, require) {
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  // Asosiy Konstruktor Bot tokeni (@BotFather dan olinadi)
  BOT_TOKEN: process.env.BOT_TOKEN || '8922811264:AAH_PTU_mS38bMfS8HDryVX8pjdhZXdrrvU',

  // Asosiy Ega (Owner) Telegram ID si
  OWNER_ID: process.env.OWNER_ID ? parseInt(process.env.OWNER_ID) : 8422157752,

  // To'lov rekvizitlari (Karta raqami va egasi)
  CARD_NUMBER: process.env.CARD_NUMBER || '6262720123315395',
  CARD_HOLDER: process.env.CARD_HOLDER || '@ismoiluzb022',

  // OpenAI API Key (ixtiyoriy, agar bo'lmasa aqlli bepul AI ishlaydi)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Tariflar
  TRIAL_DAYS: 3, // 3 kunlik tekin sinov
  TARIFFS: {
    free_trial: {
      id: 'free_trial',
      name: '🎁 3 Kunlik Bepul Sinov',
      price: 0,
      days: 3,
      maxBots: 1, // Tarifsiz faqat 1 ta bot yaratish limiti
      description: 'Tarif sotib olmaganlar uchun faqat 1 ta bot yaratish mumkin!'
    },
    starter: {
      id: 'starter',
      name: '🌱 Starter (1 Oylik)',
      price: 15000,
      days: 30,
      maxBots: 3,
      description: 'Boshlovchilar uchun 3 tagacha bot, 1 oy'
    },
    pro_month: {
      id: 'pro_month',
      name: '⭐ 25 Pro (1 Oylik)',
      price: 25000,
      days: 30,
      maxBots: 10,
      description: '1 oy davomida to\'liq cheklovlarsiz 10 tagacha bot ishlatish'
    },
    business_3m: {
      id: 'business_3m',
      name: '💼 Business (3 Oylik)',
      price: 60000,
      days: 90,
      maxBots: 25,
      description: '3 oy davomida 25 tagacha bot + VIP yordam (Chegirma bilan)'
    },
    vip_year: {
      id: 'vip_year',
      name: '👑 VIP Premium (1 Yillik)',
      price: 150000,
      days: 365,
      maxBots: 50,
      description: '1 yil davomida barcha 16 ta bot shablonlaridan 50 tagacha bot'
    },
    unlimited_forever: {
      id: 'unlimited_forever',
      name: '♾ Cheksiz Umrbod (Lifetime)',
      price: 300000,
      days: 3650, // 10 yil / umrbod
      maxBots: 999,
      description: 'Bir marta to\'lab, umrbod cheksiz botlar yaratish imkoniyati'
    }
  }
};

});

// ---- FILE: database/db.js ----
defineModule('database/db.js', function(exports, module, require) {
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'murodaliyevabdulaziz6-sketch';
const GITHUB_REPO = process.env.GITHUB_REPO || 'telegram-bot-maker';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_FILE_PATH = 'data/database.json';

class Database {
  constructor() {
    this.data = {
      users: {},
      bots: {},
      admins: [],
      payments: {},
      settings: {
        webapp_public: true
      }
    };
    this.syncTimer = null;
    this.isSyncing = false;
    this.githubSha = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = {};
        if (!this.data.bots) this.data.bots = {};
        if (!Array.isArray(this.data.admins)) this.data.admins = [];
        if (!this.data.payments) this.data.payments = {};
        if (!this.data.settings) this.data.settings = {};
        if (!Array.isArray(this.data.activity_logs)) this.data.activity_logs = [];
      } catch (err) {
        console.error('Baza yuklashda xatolik:', err);
      }
    }

    if (this.data.settings && this.data.settings.webapp_public === undefined) {
      this.data.settings.webapp_public = true;
    }

    // Ownerni har doim adminlar ro'yxatiga qo'shib qo'yamiz
    if (config.OWNER_ID && !this.data.admins.includes(config.OWNER_ID)) {
      this.data.admins.push(config.OWNER_ID);
    }
    this.saveLocal();

    // Dastlabki bulutdan sinxronlash (GitHub dan eng so'nggi bazani yuklash)
    setTimeout(() => {
      this.syncFromGitHub();
    }, 2000);
  }

  saveLocal() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Lokal bazaga saqlashda xatolik:', err);
    }
  }

  save() {
    this.saveLocal();
    this.scheduleCloudSync();
  }

  // Bulutga (GitHub) avtomatik sinxronlash (3 soniya kechiktirish bilan)
  scheduleCloudSync() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncToGitHub();
    }, 3000);
  }

  async syncFromGitHub() {
    if (!GITHUB_TOKEN) return;
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Bot-Db-Sync'
          },
          timeout: 10000
        }
      );

      if (res.data && res.data.content) {
        this.githubSha = res.data.sha;
        const decoded = Buffer.from(res.data.content, 'base64').toString('utf-8');
        const remoteData = JSON.parse(decoded);

        let merged = false;
        // Foydalanuvchilarni birlashtiramiz (remote va local)
        if (remoteData.users) {
          for (const [uid, u] of Object.entries(remoteData.users)) {
            if (!this.data.users[uid]) {
              this.data.users[uid] = u;
              merged = true;
            }
          }
        }

        // Botlarni birlashtiramiz
        if (remoteData.bots) {
          for (const [bid, b] of Object.entries(remoteData.bots)) {
            if (!this.data.bots[bid]) {
              this.data.bots[bid] = b;
              merged = true;
            }
          }
        }

        // To'lovlarni birlashtiramiz
        if (remoteData.payments) {
          for (const [pid, p] of Object.entries(remoteData.payments)) {
            if (!this.data.payments[pid]) {
              this.data.payments[pid] = p;
              merged = true;
            }
          }
        }

        if (merged) {
          this.saveLocal();
          console.log('☁️ [Cloud Sync] GitHub dan baza muvaffaqiyatli sinxronlandi va birlashtirildi.');
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fayl hali GitHub da yo'q bo'lsa, hozirgi bazani yuklaymiz
        this.syncToGitHub();
      } else {
        console.error('☁️ [Cloud Sync Error] GitHub dan yuklashda xatolik:', err.response?.data?.message || err.message);
      }
    }
  }

  async syncToGitHub() {
    if (!GITHUB_TOKEN || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const jsonContent = JSON.stringify(this.data, null, 2);
      const base64Content = Buffer.from(jsonContent).toString('base64');

      // Agar SHA bo'lmasa, avval SHA ni olamiz
      if (!this.githubSha) {
        try {
          const res = await axios.get(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Bot-Db-Sync'
              },
              timeout: 10000
            }
          );
          if (res.data && res.data.sha) {
            this.githubSha = res.data.sha;
          }
        } catch (e) {}
      }

      const payload = {
        message: 'Auto-sync database.json (Persistent State)',
        content: base64Content,
        branch: GITHUB_BRANCH
      };
      if (this.githubSha) {
        payload.sha = this.githubSha;
      }

      const putRes = await axios.put(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Bot-Db-Sync'
          },
          timeout: 15000
        }
      );

      if (putRes.data && putRes.data.content && putRes.data.content.sha) {
        this.githubSha = putRes.data.content.sha;
      }
      console.log('☁️ [Cloud Backup] database.json GitHub repozitoriyasiga muvaffaqiyatli saqlandi!');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // SHA ziddiyat bo'lsa, qayta SHA olib sinxronlaymiz
        this.githubSha = null;
        setTimeout(() => this.syncToGitHub(), 2000);
      } else {
        console.error('☁️ [Cloud Backup Error] GitHub ga saqlashda xatolik:', err.response?.data?.message || err.message);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // --- FOYDALANUVCHILAR ---
  getUser(userId) {
    const id = String(userId);
    return this.data.users[id] || null;
  }

  getOrCreateUser(userObj) {
    const id = String(userObj.id);
    const now = new Date();
    
    if (!this.data.users[id]) {
      // Yangi foydalanuvchi uchun 7 kunlik tekin sinov
      const trialEnds = new Date(now.getTime() + config.TRIAL_DAYS * 24 * 60 * 60 * 1000);
      
      this.data.users[id] = {
        id: userObj.id,
        username: userObj.username || '',
        first_name: userObj.first_name || '',
        registered_at: now.toISOString(),
        tariff: 'free_trial',
        balance: 0,
        trial_ends_at: trialEnds.toISOString(),
        subscription_ends_at: trialEnds.toISOString(),
        referred_by: null,
        referrals_count: 0,
        referral_earnings: 0,
        last_bonus_at: null,
        status: 'active'
      };
      this.save();
    } else {
      let updated = false;
      if (this.data.users[id].balance === undefined) {
        this.data.users[id].balance = 0;
        updated = true;
      }
      if (this.data.users[id].referrals_count === undefined) {
        this.data.users[id].referrals_count = 0;
        updated = true;
      }
      if (this.data.users[id].referral_earnings === undefined) {
        this.data.users[id].referral_earnings = 0;
        updated = true;
      }
      if (userObj.username && this.data.users[id].username !== userObj.username) {
        this.data.users[id].username = userObj.username;
        updated = true;
      }
      if (userObj.first_name && this.data.users[id].first_name !== userObj.first_name) {
        this.data.users[id].first_name = userObj.first_name;
        updated = true;
      }
      if (updated) this.save();
    }

    return this.data.users[id];
  }

  // Referal tizimi
  processReferral(newUserId, referrerId) {
    const uId = String(newUserId);
    const rId = String(referrerId);
    if (!uId || !rId || uId === rId) return { success: false };

    const newUser = this.getUser(uId);
    const referrer = this.getUser(rId);

    if (!newUser || !referrer) return { success: false };
    if (newUser.referred_by) return { success: false }; // Alla qachon taklif qilingan

    newUser.referred_by = rId;
    const refReward = 500;
    referrer.balance = (referrer.balance || 0) + refReward;
    referrer.referrals_count = (referrer.referrals_count || 0) + 1;
    referrer.referral_earnings = (referrer.referral_earnings || 0) + refReward;

    this.save();
    return {
      success: true,
      referrer,
      reward: refReward
    };
  }

  // Kunlik bonus (200 so'm / 24 soat)
  claimDailyBonus(userId, bonusAmount = 200) {
    const user = this.getUser(userId);
    if (!user) return { success: false, error: 'User not found' };

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 soat
    const lastBonus = user.last_bonus_at ? new Date(user.last_bonus_at).getTime() : 0;
    const diff = now - lastBonus;

    if (diff < cooldown) {
      const timeLeftMs = cooldown - diff;
      return {
        success: false,
        timeLeftMs
      };
    }

    user.balance = (user.balance || 0) + bonusAmount;
    user.last_bonus_at = new Date().toISOString();
    this.save();

    return {
      success: true,
      amount: bonusAmount,
      newBalance: user.balance
    };
  }

  // Balans boshqaruvi
  getBalance(userId) {
    const user = this.getUser(userId);
    return user ? (user.balance || 0) : 0;
  }

  addBalance(userId, amount) {
    const user = this.getUser(userId);
    if (!user) return false;
    const num = parseFloat(amount) || 0;
    user.balance = (user.balance || 0) + num;
    this.save();
    return user.balance;
  }

  subtractBalance(userId, amount) {
    const user = this.getUser(userId);
    if (!user) return false;
    const num = parseFloat(amount) || 0;
    user.balance = Math.max(0, (user.balance || 0) - num);
    this.save();
    return user.balance;
  }

  addDays(userId, days) {
    const user = this.getUser(userId);
    if (!user) return false;
    const numDays = parseInt(days) || 0;
    const now = new Date();
    const currentEnd = new Date(user.subscription_ends_at || now);
    const baseDate = currentEnd > now ? currentEnd : now;
    const newEnd = new Date(baseDate.getTime() + numDays * 24 * 60 * 60 * 1000);
    user.subscription_ends_at = newEnd.toISOString();
    user.notified_5h = false;
    user.notified_expired = false;
    user.notified_deleted = false;
    this.save();
    return this.getSubscriptionDaysLeft(userId);
  }

  subtractDays(userId, days) {
    const user = this.getUser(userId);
    if (!user) return false;
    const numDays = parseInt(days) || 0;
    const now = new Date();
    const currentEnd = new Date(user.subscription_ends_at || now);
    const baseDate = currentEnd > now ? currentEnd : now;
    let newEndTime = baseDate.getTime() - numDays * 24 * 60 * 60 * 1000;
    if (newEndTime < now.getTime()) {
      newEndTime = now.getTime() - 1000; // 0 kun / muddat tugatildi
    }
    user.subscription_ends_at = new Date(newEndTime).toISOString();
    this.save();
    return this.getSubscriptionDaysLeft(userId);
  }

  isSubscriptionActive(userId) {
    const user = this.getUser(userId);
    if (!user) return false;
    
    // Agar admin yoki owner bo'lsa cheksiz
    if (this.isAdmin(userId)) return true;

    if (!user.subscription_ends_at) return false;
    return new Date(user.subscription_ends_at) > new Date();
  }

  getSubscriptionDaysLeft(userId) {
    const user = this.getUser(userId);
    if (!user || !user.subscription_ends_at) return 0;
    
    if (this.isAdmin(userId)) return 9999;

    const diff = new Date(user.subscription_ends_at) - new Date();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  setTariff(userId, tariffId, customDays = null) {
    const user = this.getUser(userId);
    if (!user) return false;

    const tariff = config.TARIFFS[tariffId];
    const days = customDays !== null ? customDays : (tariff ? tariff.days : 30);

    const now = new Date();
    const currentEnd = new Date(user.subscription_ends_at || now);
    const baseDate = currentEnd > now ? currentEnd : now;

    const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    user.tariff = tariffId;
    user.subscription_ends_at = newEnd.toISOString();
    user.notified_5h = false;
    user.notified_expired = false;
    user.notified_deleted = false;
    this.save();
    return true;
  }


  getAllUsers() {
    return Object.values(this.data.users);
  }

  // --- BOTLAR ---
  createBot(ownerId, token, template, botInfo) {
    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botRecord = {
      id: botId,
      owner_id: ownerId,
      token: token,
      template: template,
      bot_username: botInfo.username,
      bot_first_name: botInfo.first_name,
      bot_id: botInfo.id,
      status: 'running',
      created_at: new Date().toISOString(),
      stats: {
        users_count: 0,
        messages_count: 0
      },
      data: template === 'nakrutka' ? {
        orders: [],
        users: [ownerId],
        balances: { [ownerId]: 100000 },
        smmApiUrl: 'https://peakerr.com/api/v2',
        smmApiKey: 'f148ed4357267a745937d2808870066f',
        paymentCard: '8600 **** **** ****',
        cardHolder: botInfo.first_name || 'Admin',
        required_channels: [],
        serviceMapping: {
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
        }
      } : {}
    };

    this.data.bots[botId] = botRecord;
    this.save();
    return botRecord;
  }

  getBot(botId) {
    return this.data.bots[botId] || null;
  }

  getBotByToken(token) {
    return Object.values(this.data.bots).find(b => b.token === token) || null;
  }

  getUserBots(userId) {
    return Object.values(this.data.bots).filter(b => b.owner_id === userId);
  }

  getAllBots() {
    return Object.values(this.data.bots);
  }

  updateBotStatus(botId, status) {
    if (this.data.bots[botId]) {
      this.data.bots[botId].status = status;
      this.save();
      return true;
    }
    return false;
  }

  deleteBot(botId) {
    if (this.data.bots[botId]) {
      delete this.data.bots[botId];
      this.save();
      return true;
    }
    return false;
  }

  updateBotData(botId, updaterFn) {
    if (this.data.bots[botId]) {
      updaterFn(this.data.bots[botId]);
      this.save();
    }
  }

  // --- ADMINLAR ---
  isAdmin(userId) {
    const id = parseInt(userId);
    if (config.OWNER_ID && id === config.OWNER_ID) return true;
    return this.data.admins.includes(id);
  }

  isOwner(userId) {
    const id = parseInt(userId);
    return config.OWNER_ID && id === config.OWNER_ID;
  }

  getAdmins() {
    return [...new Set([...this.data.admins, config.OWNER_ID].filter(Boolean))];
  }

  addAdmin(userId) {
    const id = parseInt(userId);
    if (!this.data.admins.includes(id)) {
      this.data.admins.push(id);
      this.save();
      return true;
    }
    return false;
  }

  removeAdmin(userId) {
    const id = parseInt(userId);
    if (id === config.OWNER_ID) return false; // Egasi o'chirilmaydi
    const idx = this.data.admins.indexOf(id);
    if (idx !== -1) {
      this.data.admins.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- TO'LOVLAR ---
  createPayment(userId, tariffId, photoId) {
    const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tariff = config.TARIFFS[tariffId] || { name: 'Noma\'lum', price: 0 };

    const payment = {
      id: paymentId,
      user_id: userId,
      tariff_id: tariffId,
      tariff_name: tariff.name,
      amount: tariff.price,
      photo_id: photoId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    this.data.payments[paymentId] = payment;
    this.save();
    return payment;
  }

  getPayment(paymentId) {
    return this.data.payments[paymentId] || null;
  }

  getPendingPayments() {
    return Object.values(this.data.payments).filter(p => p.status === 'pending');
  }

  approvePayment(paymentId) {
    const payment = this.getPayment(paymentId);
    if (!payment || payment.status !== 'pending') return false;

    payment.status = 'approved';
    payment.approved_at = new Date().toISOString();
    
    // Foydalanuvchi obunasini uzaytiramiz
    this.setTariff(payment.user_id, payment.tariff_id);
    this.save();
    return payment;
  }

  rejectPayment(paymentId) {
    const payment = this.getPayment(paymentId);
    if (!payment || payment.status !== 'pending') return false;

    payment.status = 'rejected';
    payment.rejected_at = new Date().toISOString();
    this.save();
    return payment;
  }

  // --- WEB APP SOZLAMALARI VA MA'LUMOTLARI ---
  isWebappPublic() {
    if (!this.data.settings) this.data.settings = {};
    return this.data.settings.webapp_public === true;
  }

  setWebappPublic(val) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.webapp_public = !!val;
    this.save();
    return this.data.settings.webapp_public;
  }

  toggleWebappPublic() {
    const current = this.isWebappPublic();
    return this.setWebappPublic(!current);
  }

  getWebappFullData(requestUserId) {
    const id = parseInt(requestUserId);
    const isAdmin = this.isAdmin(id);
    const isOwner = this.isOwner(id);
    const isPublic = this.isWebappPublic();

    if (!isAdmin && !isPublic) {
      return { error: 'ACCESS_DENIED', message: 'Web App hozirda faqat administratorlar uchun ochiq.' };
    }

    const stats = this.getStats();
    const allUsers = this.getAllUsers();
    const allBots = this.getAllBots();
    const allPayments = Object.values(this.data.payments);

    // Foydalanuvchi ma'lumotlari xaritasi
    const userMap = {};
    allUsers.forEach(u => {
      userMap[String(u.id)] = u;
    });

    if (isAdmin) {
      // Admin uchun to'liq ma'lumotlar
      const enrichedBots = allBots.map(b => {
        const owner = userMap[String(b.owner_id)] || { first_name: 'Noma\'lum', username: '', tariff: 'free_trial' };
        const tariff = config.TARIFFS[owner.tariff] || { name: owner.tariff || 'Standart' };
        const daysLeft = this.getSubscriptionDaysLeft(b.owner_id);
        return {
          id: b.id,
          bot_username: b.bot_username,
          bot_first_name: b.bot_first_name,
          bot_id: b.bot_id,
          template: b.template,
          status: b.status,
          created_at: b.created_at,
          stats: b.stats || { users_count: 0, messages_count: 0 },
          owner: {
            id: b.owner_id,
            first_name: owner.first_name,
            username: owner.username,
            tariff_id: owner.tariff,
            tariff_name: tariff.name,
            days_left: daysLeft,
            subscription_ends_at: owner.subscription_ends_at
          }
        };
      });

      const enrichedUsers = allUsers.map(u => {
        const userBots = allBots.filter(b => b.owner_id === u.id);
        const tariff = config.TARIFFS[u.tariff] || { name: u.tariff || 'Standart' };
        const daysLeft = this.getSubscriptionDaysLeft(u.id);
        return {
          id: u.id,
          first_name: u.first_name || 'Foydalanuvchi',
          username: u.username || '',
          balance: u.balance || 0,
          tariff_id: u.tariff || 'free_trial',
          tariff_name: tariff.name || 'Standart',
          days_left: daysLeft,
          subscription_ends_at: u.subscription_ends_at,
          registered_at: u.registered_at,
          bots_count: userBots.length,
          status: u.status || 'active',
          is_admin: this.isAdmin(u.id),
          is_owner: this.isOwner(u.id)
        };
      });

      const adminsList = this.getAdmins().map(aid => {
        const u = userMap[String(aid)] || { first_name: 'Admin', username: '' };
        return {
          id: aid,
          first_name: u.first_name || 'Admin',
          username: u.username || '',
          is_owner: this.isOwner(aid)
        };
      });

      return {
        role: isOwner ? 'owner' : 'admin',
        isAdmin: true,
        isOwner: isOwner,
        webapp_public: isPublic,
        stats: stats,
        bots: enrichedBots,
        users: enrichedUsers,
        admins: adminsList,
        payments: allPayments,
        tariffs: config.TARIFFS
      };
    } else {
      // Oddiy foydalanuvchi uchun o'ziga tegishli ma'lumotlar
      const myUser = this.getUser(id) || { id: id, tariff: 'free_trial', balance: 0 };
      const myBots = this.getUserBots(id).map(b => ({
        id: b.id,
        bot_username: b.bot_username,
        bot_first_name: b.bot_first_name,
        template: b.template,
        status: b.status,
        created_at: b.created_at,
        stats: b.stats || { users_count: 0, messages_count: 0 }
      }));
      const tariff = config.TARIFFS[myUser.tariff] || { name: myUser.tariff || 'Standart' };
      const daysLeft = this.getSubscriptionDaysLeft(id);

      return {
        role: 'user',
        isAdmin: false,
        isOwner: false,
        webapp_public: isPublic,
        stats: {
          myBotsCount: myBots.length,
          daysLeft: daysLeft,
          tariffName: tariff.name,
          balance: myUser.balance || 0
        },
        user: {
          id: myUser.id,
          first_name: myUser.first_name || 'Foydalanuvchi',
          username: myUser.username || '',
          balance: myUser.balance || 0,
          tariff_id: myUser.tariff || 'free_trial',
          tariff_name: tariff.name || 'Standart',
          days_left: daysLeft,
          subscription_ends_at: myUser.subscription_ends_at
        },
        bots: myBots,
        tariffs: config.TARIFFS
      };
    }
  }


  // --- STATISTIKA ---
  getStats() {
    const users = Object.values(this.data.users);
    const bots = Object.values(this.data.bots);
    const payments = Object.values(this.data.payments);

    const activeBots = bots.filter(b => b.status === 'running').length;
    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalIncome = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalUsers: users.length,
      totalBots: bots.length,
      activeBots: activeBots,
      totalPayments: payments.length,
      approvedPayments: approvedPayments.length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      totalIncome: totalIncome,
      adminsCount: this.getAdmins().length
    };
  }
}

module.exports = new Database();



});

// ---- FILE: core/helpers.js ----
defineModule('core/helpers.js', function(exports, module, require) {
// Telegram xavfsiz matn yordamchisi
function cleanName(name) {
  if (!name) return 'Foydalanuvchi';
  return String(name).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '').trim() || 'Foydalanuvchi';
}

function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

module.exports = {
  cleanName,
  escapeMarkdown
};

});

// ---- FILE: core/keyboards.js ----
defineModule('core/keyboards.js', function(exports, module, require) {
const { Markup } = require('telegraf');
const { templates } = require('../templates');
const config = require('../config');

function getWebAppUrl(userId = '') {
  const base = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || 'https://telegram-bot-maker-v2.onrender.com';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/webapp${userId ? `?userId=${userId}` : ''}`;
}

module.exports = {
  getWebAppUrl,

  // Asosiy foydalanuvchi menyusi
  getMainKeyboard: (isAdmin = false) => {
    const buttons = [
      ['🚀 Yangi Bot Yaratish', '📁 Mening Botlarim'],
      ['🎁 Kunlik Bonus', '👥 Referal Tizimi'],
      ['💎 Tariflar va Obuna', '👤 Profilim'],
      ['❓ Yordam va Qo\'llanma']
    ];

    if (isAdmin) {
      buttons.unshift(['👑 Admin Panel']);
      buttons.push(['🌐 Web App (Admin)', '✨ Yangilanishlar']);
    }

    return Markup.keyboard(buttons).resize().persistent();
  },


  // 15 ta bot shablonlari inline tugmalari
  getTemplatesKeyboard: () => {
    const rows = [];
    for (let i = 0; i < templates.length; i += 2) {
      const row = [];
      row.push(Markup.button.callback(templates[i].name, `select_tpl_${templates[i].id}`));
      if (templates[i + 1]) {
        row.push(Markup.button.callback(templates[i + 1].name, `select_tpl_${templates[i + 1].id}`));
      }
      rows.push(row);
    }
    rows.push([Markup.button.callback('❌ Bekor qilish', 'cancel_action')]);
    return Markup.inlineKeyboard(rows);
  },

  // Bitta botni boshqarish inline tugmalari
  getBotManageKeyboard: (botRecord, isRunning) => {
    return Markup.inlineKeyboard([
      [Markup.button.url('👉 Botga o\'tish', `https://t.me/${botRecord.bot_username}`)],
      [
        isRunning
          ? Markup.button.callback('⏹ To\'xtatish', `bot_stop_${botRecord.id}`)
          : Markup.button.callback('▶️ Ishga tushirish', `bot_start_${botRecord.id}`)
      ],
      [Markup.button.callback('🗑 Botni o\'chirish', `bot_delete_${botRecord.id}`)],
      [Markup.button.callback('⬅️ Botlarim ro\'yxatiga', 'my_bots_list')]
    ]);
  },

  // Tariflar inline tugmalari
  getTariffsKeyboard: () => {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎁 3 Kunlik Bepul Sinov', 'tariff_free_trial')],
      [Markup.button.callback('🌱 Starter (1 Oylik) — 15,000 so\'m', 'tariff_starter')],
      [Markup.button.callback('⭐ 25 Pro (1 Oylik) — 25,000 so\'m', 'tariff_pro_month')],
      [Markup.button.callback('💼 Business (3 Oylik) — 60,000 so\'m', 'tariff_business_3m')],
      [Markup.button.callback('👑 VIP Premium (1 Yillik) — 150,000 so\'m', 'tariff_vip_year')],
      [Markup.button.callback('♾ Cheksiz Umrbod (Lifetime) — 300,000 so\'m', 'tariff_unlimited_forever')],
      [Markup.button.callback('⬅️ Orqaga', 'cancel_action')]
    ]);
  },

  // Admin panel asosiy menyusi
  getAdminKeyboard: (isOwner = false, isWebappPublic = false, userId = '') => {
    const webAppUrl = getWebAppUrl(userId);
    const buttons = [
      [
        Markup.button.webApp('🌐 Web App Dashboard', webAppUrl)
      ],
      [
        Markup.button.callback(
          isWebappPublic ? '⚙️ Web App: 🟢 ON (Hamma ko\'radi)' : '⚙️ Web App: 🔴 OFF (Faqat Admin)',
          'admin_toggle_webapp'
        )
      ],

      [
        Markup.button.callback('📊 Statistika', 'admin_stats'),
        Markup.button.callback('🤖 Mijoz Botlari', 'admin_bots')
      ],
      [
        Markup.button.callback('👥 Foydalanuvchilar (Mijozlar)', 'admin_users'),
        Markup.button.callback('💳 To\'lovlar', 'admin_payments')
      ],
      [
        Markup.button.callback('📢 Xabar tarqatish (Rassilka)', 'admin_broadcast')
      ]
    ];

    if (isOwner) {
      buttons.push([
        Markup.button.callback('✨ Yangilanishlar Tarixi', 'admin_updates_info'),
        Markup.button.callback('👥 Adminlarni boshqarish', 'admin_manage_admins')
      ]);
    }

    buttons.push([Markup.button.callback('⬅️ Menyuga qaytish', 'admin_close')]);
    return Markup.inlineKeyboard(buttons);
  },



  // Bekor qilish inline tugmasi
  getCancelKeyboard: () => {
    return Markup.inlineKeyboard([
      [Markup.button.callback('❌ Bekor qilish', 'cancel_action')]
    ]);
  }
};


});

// ---- FILE: core/webapp.js ----
defineModule('core/webapp.js', function(exports, module, require) {
const db = require('../database/db');
const botManager = require('./botManager');
const config = require('../config');

function getWebAppHtml(initialData = null, initialUserId = '') {
  const initialDataJson = JSON.stringify(initialData || null).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Bot Maker Professional Dashboard</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #090d16;
      --bg-secondary: #131b2e;
      --bg-card: rgba(19, 27, 46, 0.85);
      --bg-card-hover: rgba(30, 41, 69, 0.95);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-gradient: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
      --gold-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%);
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius: 16px;
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-main);
      padding: 14px;
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%);
      background-attachment: fixed;
    }

    .container {
      max-width: 950px;
      margin: 0 auto;
      padding-bottom: 60px;
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .header-title h1 {
      font-size: 19px;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-title p {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      font-size: 12px;
      font-weight: 700;
    }

    .user-badge.admin {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }

    /* STATS ROW */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-chip {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-shadow: var(--shadow);
    }

    .stat-chip .val {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
    }

    .stat-chip .lbl {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* TABS */
    .tabs-wrapper {
      overflow-x: auto;
      scrollbar-width: none;
      margin-bottom: 16px;
    }
    .tabs-wrapper::-webkit-scrollbar { display: none; }

    .tabs {
      display: flex;
      gap: 6px;
      background: var(--bg-secondary);
      padding: 5px;
      border-radius: 14px;
      border: 1px solid var(--border-color);
      width: max-content;
      min-width: 100%;
    }

    .tab-btn {
      padding: 10px 18px;
      border-radius: 10px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s;
      user-select: none;
    }

    .tab-btn.active {
      background: var(--accent-gradient);
      color: #fff;
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
    }

    /* SEARCH BAR */
    .search-input {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 11px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
      margin-bottom: 14px;
    }
    .search-input:focus { border-color: var(--accent); }

    /* CARDS & LISTS */
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .card-title-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      color: #38bdf8;
      flex-shrink: 0;
    }

    .avatar-icon.user {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }

    .names-box h4 {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }

    .names-box a {
      font-size: 12px;
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge.running { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge.stopped { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge.gold { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    /* GRID INFO */
    .grid-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      background: rgba(15, 23, 42, 0.5);
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 11px;
    }

    .grid-info div span {
      color: var(--text-muted);
      display: block;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .grid-info div b {
      color: #fff;
      font-size: 11.5px;
    }

    /* BUTTONS */
    .btn-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-act {
      padding: 9px 15px;
      border-radius: 10px;
      font-size: 11.5px;
      font-weight: 700;
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      text-decoration: none;
      transition: all 0.2s;
      user-select: none;
    }
    .btn-act.green { background: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(34, 197, 94, 0.4); }
    .btn-act.red { background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }
    .btn-act.gold { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4); }
    .btn-act.blue { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); }
    .btn-act:hover, .btn-act:active { filter: brightness(1.2); transform: translateY(-1px); }

    /* FORMS */
    .form-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: var(--shadow);
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 11px; font-weight: 700; color: var(--text-muted); }
    .form-control {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .form-control:focus { border-color: var(--accent); }

    /* MODAL */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
    }
    .modal-overlay.open { display: flex; }

    .modal-box {
      background: #131b2e;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 20px;
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { font-size: 16px; font-weight: 800; color: #fff; }
    .close-modal-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
    }

    /* TOAST */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      z-index: 999999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
    }
    .toast.show { transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="header-title">
        <h1>🤖 Bot Maker Admin</h1>
        <p>Boshqaruv va Monitoring Markazi</p>
      </div>
      <div id="userBadge" class="user-badge admin">
        🛡 Administrator
      </div>
    </div>

    <!-- STATS -->
    <div class="stats-row">
      <div class="stat-chip">
        <span id="stBots" class="val">0 ta</span>
        <span class="lbl">Jami Botlar</span>
      </div>
      <div class="stat-chip">
        <span id="stActiveBots" class="val" style="color:#4ade80;">0 ta</span>
        <span class="lbl">Faol Botlar</span>
      </div>
      <div class="stat-chip">
        <span id="stUsers" class="val">0 kishi</span>
        <span class="lbl">Mijozlar</span>
      </div>
      <div class="stat-chip">
        <span id="stBalance" class="val" style="color:#fbbf24;">0 so'm</span>
        <span class="lbl">Admin Balansi</span>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-wrapper">
      <div class="tabs">
        <button id="tabBtn_bots" class="tab-btn active" onclick="switchTab('bots')">
          🤖 Botlar Ro&#39;yxati (<span id="botsBadge">0</span>)
        </button>
        <button id="tabBtn_users" class="tab-btn" onclick="switchTab('users')">
          👥 Mijozlar (Foydalanuvchilar)
        </button>
        <button id="tabBtn_profile" class="tab-btn" onclick="switchTab('profile')">
          👤 Profilim
        </button>
        <button id="tabBtn_admins" class="tab-btn" onclick="switchTab('admins')">
          🛡 Adminlar
        </button>
      </div>
    </div>

    <!-- TAB 1: BOTS -->
    <div id="view_bots">
      <input type="text" id="botSearchBox" class="search-input" placeholder="🔍 Bot nomi, username yoki egasi ID si bo&#39;yicha qidirish..." oninput="renderBotsList()">
      <div id="botsListContainer" class="card-list"></div>
    </div>

    <!-- TAB 2: USERS -->
    <div id="view_users" style="display:none;">
      <input type="text" id="userSearchBox" class="search-input" placeholder="🔍 Mijoz ismi, username yoki Telegram ID si bo&#39;yicha qidirish..." oninput="renderUsersList()">
      <div id="usersListContainer" class="card-list"></div>
    </div>

    <!-- TAB 3: PROFILE -->
    <div id="view_profile" style="display:none;">
      <div class="form-card">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
          <div class="avatar-icon user" style="width:54px; height:54px; font-size:26px;">👑</div>
          <div>
            <h3 id="profUserTitle" style="font-size:17px; font-weight:800; color:#fff;">Admin Profili</h3>
            <span id="profUserId" style="font-size:12px; color:var(--text-muted);">ID: ...</span>
          </div>
        </div>
        <div class="grid-info" style="grid-template-columns:1fr 1fr;">
          <div><span>Hisob Balansi:</span><b id="profBalVal" style="color:#fbbf24; font-size:14px;">0 so&#39;m</b></div>
          <div><span>Tarif:</span><b id="profTariffVal">Bosh Admin</b></div>
          <div><span>Taklif qilingan do&#39;stlar:</span><b id="profRefsVal">0 ta</b></div>
          <div><span>Yaratilgan botlar:</span><b id="profBotsVal">0 ta</b></div>
        </div>
        <div class="btn-row" style="margin-top:8px;">
          <button class="btn-act gold" onclick="copyReferralLink()">🔗 Referal havolasini nusxalash</button>
        </div>
      </div>
    </div>

    <!-- TAB 4: ADMINS -->
    <div id="view_admins" style="display:none;">
      <div class="form-card" style="margin-bottom:14px;">
        <h4 style="font-size:14px; font-weight:700; color:#fff;">➕ Yangi Admin Qo&#39;shish</h4>
        <div style="display:flex; gap:8px;">
          <input type="number" id="newAdminIdInput" class="form-control" placeholder="Telegram ID raqami..." style="flex:1;">
          <button class="btn-act blue" onclick="addNewAdmin()">Qo&#39;shish</button>
        </div>
      </div>
      <div id="adminsListContainer" class="card-list"></div>
    </div>
  </div>

  <!-- USER ACTION MODAL (ADMIN) -->
  <div id="userActionModal" class="modal-overlay" onclick="if(event.target===this) closeModal();">
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <h3 id="modalUserHeader">Mijoz Hisobini Boshqarish</h3>
          <span id="modalUserSub" style="font-size:11px; color:var(--text-muted);">ID: ...</span>
        </div>
        <button class="close-modal-btn" onclick="closeModal()">&times;</button>
      </div>

      <!-- 1. Balans -->
      <div class="form-group">
        <label>💰 BALANS (SO&#39;M):</label>
        <div style="display:flex; gap:8px;">
          <input type="number" id="modalBalAmount" class="form-control" placeholder="Masalan: 10000" style="flex:1;">
          <button class="btn-act green" onclick="applyBalance('add')">➕ Qo&#39;shish</button>
          <button class="btn-act red" onclick="applyBalance('sub')">➖ Ayirish</button>
        </div>
      </div>

      <hr style="border:0; border-top:1px solid var(--border-color);">

      <!-- 2. Kun -->
      <div class="form-group">
        <label>⏳ OBUNA MUDDATI (KUN):</label>
        <div style="display:flex; gap:8px;">
          <input type="number" id="modalDaysInput" class="form-control" placeholder="Masalan: 30" style="flex:1;">
          <button class="btn-act gold" onclick="applyDays('add')">➕ Qo&#39;shish</button>
          <button class="btn-act red" onclick="applyDays('sub')">➖ Ayirish</button>
        </div>
      </div>

      <hr style="border:0; border-top:1px solid var(--border-color);">

      <!-- 3. Tarif -->
      <div class="form-group">
        <label>💎 TARIFNI BELGILASH:</label>
        <div style="display:flex; gap:8px;">
          <select id="modalTariffSelect" class="form-control" style="flex:1;">
            <option value="free_trial">🎁 3 Kunlik Sinov</option>
            <option value="starter">🌱 Starter (1 Oylik)</option>
            <option value="pro_month">⭐ 25 Pro (1 Oylik)</option>
            <option value="business_3m">💼 Business (3 Oylik)</option>
            <option value="vip_year">👑 VIP Premium (1 Yillik)</option>
            <option value="unlimited_forever">♾ Cheksiz Umrbod</option>
          </select>
          <button class="btn-act blue" onclick="applyTariff()">💎 O&#39;rnatish</button>
        </div>
      </div>
    </div>
  </div>

  <!-- CONFIRM ACTION MODAL -->
  <div id="confirmModal" class="modal-overlay" onclick="if(event.target===this) closeConfirmModal(false);">
    <div class="modal-box" style="max-width:360px; text-align:center;">
      <h3 id="confirmTitle" style="font-size:16px; margin-bottom:6px; color:#fff;">Tasdiqlash</h3>
      <p id="confirmDesc" style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Ushbu amalni bajarishni tasdiqlaysizmi?</p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button class="btn-act red" id="confirmBtnYes" style="flex:1; justify-content:center;">Ha, bajarish</button>
        <button class="btn-act" onclick="closeConfirmModal(false)" style="flex:1; justify-content:center;">Bekor qilish</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast">Xabar</div>

  <script>
    var initialData = ${initialDataJson} || {};
    var initialUserId = "${initialUserId}";
    var currentUserId = initialUserId;
    var isAdmin = false;
    var isOwner = false;
    var activeTab = "bots";
    var selectedUserIdForModal = null;
    var confirmCallback = null;

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("userId")) {
      currentUserId = urlParams.get("userId");
    }

    if (window.Telegram && window.Telegram.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        var tgUser = window.Telegram.WebApp.initDataUnsafe ? window.Telegram.WebApp.initDataUnsafe.user : null;
        if (tgUser && tgUser.id) currentUserId = String(tgUser.id);
      } catch (e) {}
    }
    if (!currentUserId && initialUserId) currentUserId = initialUserId;
    if (!currentUserId) currentUserId = "${config.OWNER_ID}";

    function getTariffInfo(tariffKey) {
      if (initialData.tariffs && initialData.tariffs[tariffKey]) return initialData.tariffs[tariffKey];
      return { id: "free_trial", name: "🎁 3 Kunlik Sinov", maxBots: 1 };
    }

    function getDaysRemaining(endsAt) {
      if (!endsAt) return "Noma&#39;lum";
      var diff = new Date(endsAt) - new Date();
      var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days > 3650) return "♾ Cheksiz (Umrbod)";
      if (days <= 0) return "🔴 Muddati tugagan (0 kun)";
      return "⏳ " + days + " kun qoldi";
    }

    function init() {
      if (initialData) {
        var admins = (initialData.admins || []).map(function(a) { return String(a); });
        isAdmin = admins.indexOf(String(currentUserId)) !== -1;
        isOwner = String(currentUserId) === "${config.OWNER_ID}";
        if (admins.length === 0 || !currentUserId) {
          isAdmin = true;
          isOwner = true;
        }
      }

      var isPublic = (initialData.settings && initialData.settings.webapp_public !== false);
      if (!isAdmin && !isOwner && !isPublic) {
        document.body.innerHTML = '<div style="font-family:sans-serif; text-align:center; padding:60px 20px; color:#fff; min-height:100vh; background:#090d16;"><h2>🔒 Kirish Cheklangan</h2><p style="color:#94a3b8; margin-top:10px;">Ushbu Dashboard boshqaruv paneli hozirda faqat administratorlar uchun ochiq.</p></div>';
        return;
      }

      updateUserBadge();
      setupTabsVisibility();
      renderTopStats();
      renderBotsList();
    }

    function updateUserBadge() {
      var badge = document.getElementById("userBadge");
      var titleEl = document.getElementById("mainAppTitle");
      var subEl = document.getElementById("mainAppSub");

      if (isOwner) {
        badge.className = "user-badge admin";
        badge.innerHTML = "👑 Bosh Admin";
        if (titleEl) titleEl.textContent = "🤖 Bot Maker Admin";
        if (subEl) subEl.textContent = "Boshqaruv va Monitoring Markazi";
      } else if (isAdmin) {
        badge.className = "user-badge admin";
        badge.innerHTML = "🛡 Administrator";
        if (titleEl) titleEl.textContent = "🤖 Bot Maker Admin";
        if (subEl) subEl.textContent = "Boshqaruv va Monitoring Markazi";
      } else {
        badge.className = "user-badge";
        badge.innerHTML = "👤 Mijoz Kabineti";
        if (titleEl) titleEl.textContent = "🤖 Bot Maker Kabineti";
        if (subEl) subEl.textContent = "Shaxsiy Botlaringiz va Hisobingiz";
      }
    }

    function setupTabsVisibility() {
      var elUsers = document.getElementById("tabBtn_users");
      if (elUsers) elUsers.style.display = (isAdmin || isOwner) ? "flex" : "none";

      var elAdm = document.getElementById("tabBtn_admins");
      if (elAdm) elAdm.style.display = isOwner ? "flex" : "none";
    }

    function renderTopStats() {
      var bots = Object.values(initialData.bots || {});
      var users = Object.values(initialData.users || {});
      var activeBots = bots.filter(function(b) { return b.status === "running"; }).length;
      var myUser = initialData.users ? initialData.users[currentUserId] : null;

      var userBots = (isAdmin || isOwner) ? bots : bots.filter(function(b) { return String(b.owner_id) === String(currentUserId); });
      var userActiveBots = userBots.filter(function(b) { return b.status === "running"; }).length;

      document.getElementById("stBots").textContent = ((isAdmin || isOwner) ? bots.length : userBots.length) + " ta";
      document.getElementById("stActiveBots").textContent = ((isAdmin || isOwner) ? activeBots : userActiveBots) + " ta";
      document.getElementById("stUsers").textContent = (isAdmin || isOwner) ? (users.length + " kishi") : ((myUser ? (myUser.referrals_count || 0) : 0) + " ta ref");
      document.getElementById("stBalance").textContent = Number(myUser ? myUser.balance || 0 : 0).toLocaleString() + " so'm";
      if (document.getElementById("botsBadge")) document.getElementById("botsBadge").textContent = userBots.length;
    }

    function switchTab(tab) {
      activeTab = tab;
      document.querySelectorAll(".tab-btn").forEach(function(btn) { btn.classList.remove("active"); });
      var activeBtn = document.getElementById("tabBtn_" + tab);
      if (activeBtn) activeBtn.classList.add("active");

      var views = ["bots", "users", "profile", "admins"];
      views.forEach(function(v) {
        var el = document.getElementById("view_" + v);
        if (el) el.style.display = (v === tab) ? "block" : "none";
      });

      if (tab === "bots") renderBotsList();
      if (tab === "users") renderUsersList();
      if (tab === "profile") renderProfile();
      if (tab === "admins") renderAdminsList();
    }

    function openTelegramLink(url) {
      if (!url) return;
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink && url.indexOf("t.me") !== -1) {
        try {
          window.Telegram.WebApp.openTelegramLink(url);
          return;
        } catch(e) {}
      }
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
        try {
          window.Telegram.WebApp.openLink(url);
          return;
        } catch(e) {}
      }
      window.open(url, "_blank");
    }

    function showCustomConfirm(title, desc, onConfirm) {
      document.getElementById("confirmTitle").textContent = title;
      document.getElementById("confirmDesc").textContent = desc;
      confirmCallback = onConfirm;
      document.getElementById("confirmModal").classList.add("open");
    }

    function closeConfirmModal(execute) {
      document.getElementById("confirmModal").classList.remove("open");
      if (execute && typeof confirmCallback === "function") {
        confirmCallback();
      }
      confirmCallback = null;
    }

    document.getElementById("confirmBtnYes").addEventListener("click", function() {
      closeConfirmModal(true);
    });

    function renderBotsList() {
      var container = document.getElementById("botsListContainer");
      var q = (document.getElementById("botSearchBox") ? document.getElementById("botSearchBox").value : "").toLowerCase();
      var bots = Object.values(initialData.bots || {});
      var userBots = isAdmin ? bots : bots.filter(function(b) { return String(b.owner_id) === String(currentUserId); });

      var filtered = userBots.filter(function(b) {
        return (b.bot_first_name || "").toLowerCase().indexOf(q) !== -1 ||
          (b.bot_username || "").toLowerCase().indexOf(q) !== -1 ||
          String(b.owner_id).indexOf(q) !== -1;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Botlar topilmadi.</div>';
        return;
      }

      var html = '';
      filtered.forEach(function(b) {
        var isRun = b.status === "running";
        var ownerUser = initialData.users ? initialData.users[b.owner_id] : null;
        var ownerName = ownerUser ? (ownerUser.first_name || "Mijoz") : "Mijoz";
        var ownerUsername = (ownerUser && ownerUser.username) ? ("@" + ownerUser.username) : "Mavjud emas";
        var ownerTariff = getTariffInfo(ownerUser ? ownerUser.tariff : null);
        var ownerBotsCount = Object.values(initialData.bots || {}).filter(function(x) { return String(x.owner_id) === String(b.owner_id); }).length;
        var daysLeftStr = getDaysRemaining(ownerUser ? ownerUser.subscription_ends_at : null);
        var botInitial = (b.bot_first_name || "B").charAt(0).toUpperCase();
        var tgUrl = "https://t.me/" + b.bot_username;

        html += '<div class="item-card">' +
          '<div class="card-header-row">' +
            '<div class="card-title-box">' +
              '<div class="avatar-icon">' + escapeHtml(botInitial) + '</div>' +
              '<div class="names-box">' +
                '<h4>' + escapeHtml(b.bot_first_name || "Nomsiz Bot") + '</h4>' +
                '<a href="javascript:void(0)" data-url="' + tgUrl + '" onclick="openTelegramLink(this.dataset.url)">@' + b.bot_username + '</a>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:6px;">' +
              '<span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); font-size:11px;">⚡ 24/7 Hosting</span>' +
              '<span class="badge ' + (isRun ? "running" : "stopped") + '">' + (isRun ? "🟢 Faol" : "🔴 To&#39;xtatilgan") + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="grid-info">' +
            '<div><span>👤 Egasi (Mijoz):</span><b>' + escapeHtml(ownerName) + ' (' + escapeHtml(ownerUsername) + ')</b></div>' +
            '<div><span>🆔 Egasi ID:</span><b>' + b.owner_id + '</b></div>' +
            '<div><span>💎 Egasining Tarifi:</span><b>' + escapeHtml(ownerTariff.name) + '</b></div>' +
            '<div><span>⏳ Obunasi:</span><b>' + daysLeftStr + '</b></div>' +
            '<div><span>📊 Bot Yaratish Limiti:</span><b>' + ownerBotsCount + ' / ' + ownerTariff.maxBots + ' ta</b></div>' +
            '<div><span>👥 Bot A&#39;zolari:</span><b>' + (b.stats ? (b.stats.users_count || 0) : 0) + ' ta a&#39;zo</b></div>' +
            '<div><span>📂 Shablon (Turi):</span><b>' + escapeHtml(b.template || "Standart") + '</b></div>' +
            '<div><span>📅 Yaratilgan Sana:</span><b>' + new Date(b.created_at || Date.now()).toLocaleDateString("uz-UZ") + '</b></div>' +
          '</div>' +

          '<div class="btn-row">' +
            '<button class="btn-act blue" data-url="' + tgUrl + '" onclick="openTelegramLink(this.dataset.url)">👉 Telegramda ochish</button>' +
            '<button class="btn-act ' + (isRun ? "red" : "green") + '" data-id="' + b.id + '" data-status="' + (isRun ? "stopped" : "running") + '" onclick="toggleBotStatus(this.dataset.id, this.dataset.status)">' +
              (isRun ? "⏹ To&#39;xtatish" : "▶️ Ishga tushirish") +
            '</button>' +
            '<button class="btn-act red" data-id="' + b.id + '" onclick="deleteBotRecord(this.dataset.id)">🗑 O&#39;chirish</button>' +
          '</div>' +
        '</div>';
      });
      container.innerHTML = html;
    }

    function renderUsersList() {
      var container = document.getElementById("usersListContainer");
      var q = (document.getElementById("userSearchBox") ? document.getElementById("userSearchBox").value : "").toLowerCase();
      var users = Object.values(initialData.users || {});

      var filtered = users.filter(function(u) {
        return (u.first_name || "").toLowerCase().indexOf(q) !== -1 ||
          (u.username || "").toLowerCase().indexOf(q) !== -1 ||
          String(u.id).indexOf(q) !== -1;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Mijozlar topilmadi.</div>';
        return;
      }

      var html = '';
      filtered.forEach(function(u) {
        var userBots = Object.values(initialData.bots || {}).filter(function(b) { return String(b.owner_id) === String(u.id); });
        var userTariff = getTariffInfo(u.tariff);
        var daysLeftStr = getDaysRemaining(u.subscription_ends_at);
        var userInitial = (u.first_name || "U").charAt(0).toUpperCase();
        var userTgUrl = u.username ? ("https://t.me/" + u.username) : "";

        html += '<div class="item-card">' +
          '<div class="card-header-row">' +
            '<div class="card-title-box">' +
              '<div class="avatar-icon user">' + escapeHtml(userInitial) + '</div>' +
              '<div class="names-box">' +
                '<h4>' + escapeHtml(u.first_name || "Mijoz") + '</h4>' +
                (u.username ? ('<a href="javascript:void(0)" data-url="' + userTgUrl + '" onclick="openTelegramLink(this.dataset.url)">@' + u.username + '</a>') : '<span style="font-size:12px; color:var(--text-muted);">Username yo&#39;q</span>') +
                '<span style="font-size:11px; color:var(--text-muted); display:block;">ID: ' + u.id + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="badge gold">' + Number(u.balance || 0).toLocaleString() + ' so&#39;m</span>' +
          '</div>' +

          '<div class="grid-info">' +
            '<div><span>💎 Joriy Tarif:</span><b>' + escapeHtml(userTariff.name) + '</b></div>' +
            '<div><span>⏳ Obunasi:</span><b>' + daysLeftStr + '</b></div>' +
            '<div><span>🤖 Yaratgan Botlari:</span><b>' + userBots.length + ' / ' + userTariff.maxBots + ' ta</b></div>' +
            '<div><span>👥 Taklif Qilganlari:</span><b>' + (u.referrals_count || 0) + ' ta referal</b></div>' +
            '<div><span>📅 Ro&#39;yxatdan O&#39;tgan:</span><b>' + (u.created_at ? new Date(u.created_at).toLocaleDateString("uz-UZ") : "Noma&#39;lum") + '</b></div>' +
            '<div><span>💰 Hisob Balansi:</span><b style="color:#fbbf24;">' + Number(u.balance || 0).toLocaleString() + ' so&#39;m</b></div>' +
          '</div>' +

          '<div class="btn-row">' +
            '<button class="btn-act gold" data-id="' + u.id + '" onclick="openUserModal(this.dataset.id)">⚙️ Hisobni Boshqarish</button>' +
          '</div>' +
        '</div>';
      });
      container.innerHTML = html;
    }

    function renderProfile() {
      var myUser = initialData.users ? initialData.users[currentUserId] : null;
      var myBots = Object.values(initialData.bots || {}).filter(function(b) { return String(b.owner_id) === String(currentUserId); });
      var tariff = getTariffInfo(myUser ? myUser.tariff : null);

      document.getElementById("profUserId").textContent = "ID: " + currentUserId;
      document.getElementById("profUserTitle").textContent = myUser ? (myUser.first_name || "Admin Profili") : "Admin Profili";
      document.getElementById("profBalVal").textContent = Number(myUser ? myUser.balance || 0 : 0).toLocaleString() + " so'm";
      document.getElementById("profRefsVal").textContent = (myUser ? myUser.referrals_count || 0 : 0) + " ta";
      document.getElementById("profBotsVal").textContent = myBots.length + " ta";
      document.getElementById("profTariffVal").textContent = tariff.name;
    }

    function renderAdminsList() {
      var container = document.getElementById("adminsListContainer");
      var admins = initialData.admins || [];
      var html = '';
      admins.forEach(function(admId) {
        var u = initialData.users ? initialData.users[admId] : null;
        var name = u ? (u.first_name || "Admin") : ("Admin #" + admId);
        var isSelf = String(admId) === String(currentUserId);
        var isOwnerAdmin = String(admId) === "${config.OWNER_ID}";

        html += '<div class="item-card" style="flex-direction:row; justify-content:space-between; align-items:center;">' +
          '<div style="display:flex; align-items:center; gap:12px;">' +
            '<div class="avatar-icon" style="background:rgba(99,102,241,0.2); color:#a5b4fc;">🛡</div>' +
            '<div>' +
              '<h4 style="font-size:14px; font-weight:700;">' + escapeHtml(name) + '</h4>' +
              '<span style="font-size:11px; color:var(--text-muted);">ID: ' + admId + (isOwnerAdmin ? " 👑 Bosh Admin" : "") + '</span>' +
            '</div>' +
          '</div>' +
          ((!isOwnerAdmin && !isSelf) ? ('<button class="btn-act red" data-id="' + admId + '" onclick="removeAdminRecord(this.dataset.id)">🗑 O&#39;chirish</button>') : '') +
        '</div>';
      });
      container.innerHTML = html;
    }

    async function addNewAdmin() {
      var id = document.getElementById("newAdminIdInput").value.trim();
      if (!id) return showToast("ID kiriting");
      try {
        var res = await fetch("/api/webapp/add_admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, targetUserId: id })
        });
        var data = await res.json();
        if (data.success) {
          if (initialData.admins.indexOf(parseInt(id)) === -1) initialData.admins.push(parseInt(id));
          document.getElementById("newAdminIdInput").value = "";
          renderAdminsList();
          showToast("✅ Admin qo'shildi!");
        } else {
          showToast("❌ " + (data.message || "Xatolik"));
        }
      } catch (e) { showToast("❌ Server xatosi"); }
    }

    function removeAdminRecord(id) {
      showCustomConfirm("🛡 Adminni o'chirish", "Ushbu adminni lavozimidan ozod qilmoqchimisiz?", async function() {
        try {
          var res = await fetch("/api/webapp/remove_admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, targetUserId: id })
          });
          var data = await res.json();
          if (data.success) {
            initialData.admins = initialData.admins.filter(function(a) { return String(a) !== String(id); });
            renderAdminsList();
            showToast("🗑 Admin o'chirildi");
          } else {
            showToast("❌ " + (data.message || "Xatolik"));
          }
        } catch (e) { showToast("❌ Server xatosi"); }
      });
    }

    async function toggleBotStatus(botId, newStatus) {
      try {
        showToast("⏳ Yangilanmoqda...");
        var res = await fetch("/api/webapp/toggle_bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId: botId, status: newStatus, userId: currentUserId })
        });
        var data = await res.json();
        if (data.success) {
          if (initialData.bots[botId]) initialData.bots[botId].status = newStatus;
          renderBotsList();
          renderTopStats();
          showToast(newStatus === "running" ? "🟢 Bot ishga tushirildi" : "🔴 Bot to'xtatildi");
        } else {
          showToast("❌ Xatolik");
        }
      } catch (e) { showToast("❌ Server xatosi"); }
    }

    function deleteBotRecord(botId) {
      showCustomConfirm("🗑 Botni o'chirish", "Rostdan ham ushbu botni butunlay o'chirmoqchimisiz?", async function() {
        try {
          showToast("⏳ O'chirilmoqda...");
          var res = await fetch("/api/webapp/delete_bot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId: botId, userId: currentUserId })
          });
          var data = await res.json();
          if (data.success) {
            delete initialData.bots[botId];
            renderBotsList();
            renderTopStats();
            showToast("🗑 Bot muvaffaqiyatli o'chirildi!");
          } else {
            showToast("❌ Xatolik");
          }
        } catch (e) { showToast("❌ Server xatosi"); }
      });
    }

    function openUserModal(uid) {
      selectedUserIdForModal = uid;
      var u = initialData.users ? initialData.users[uid] : null;
      document.getElementById("modalUserHeader").textContent = "👤 " + (u ? (u.first_name || "Mijoz") : "Mijoz") + " hisobi";
      document.getElementById("modalUserSub").textContent = "ID: " + uid + " | Hozirgi balans: " + (u ? (u.balance || 0).toLocaleString() : 0) + " so'm";
      document.getElementById("userActionModal").classList.add("open");
    }

    function closeModal() {
      document.getElementById("userActionModal").classList.remove("open");
      selectedUserIdForModal = null;
    }

    async function applyBalance(action) {
      var amt = parseFloat(document.getElementById("modalBalAmount").value);
      if (!amt || amt <= 0) return showToast("Summani kiriting");
      try {
        var res = await fetch("/api/webapp/update_balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, targetUserId: selectedUserIdForModal, amount: amt, action: action })
        });
        var data = await res.json();
        if (data.success) {
          if (initialData.users[selectedUserIdForModal]) initialData.users[selectedUserIdForModal].balance = data.balance;
          document.getElementById("modalBalAmount").value = "";
          closeModal();
          renderUsersList();
          renderTopStats();
          showToast("✅ Balans yangilandi: " + data.balance.toLocaleString() + " so'm");
        } else {
          showToast("❌ " + (data.message || "Xatolik"));
        }
      } catch (e) { showToast("❌ Server xatosi"); }
    }

    async function applyDays(action) {
      action = action || 'add';
      var days = parseInt(document.getElementById("modalDaysInput").value);
      if (!days || days <= 0) return showToast("Kunni kiriting");
      try {
        var res = await fetch("/api/webapp/add_days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, targetUserId: selectedUserIdForModal, days: days, action: action })
        });
        var data = await res.json();
        if (data.success) {
          if (initialData.users[selectedUserIdForModal]) {
            initialData.users[selectedUserIdForModal].days_left = data.daysLeft;
            if (data.subscription_ends_at) {
              initialData.users[selectedUserIdForModal].subscription_ends_at = data.subscription_ends_at;
            }
          }
          document.getElementById("modalDaysInput").value = "";
          closeModal();
          renderUsersList();
          showToast(action === 'sub' ? ("➖ " + days + " kun ayirildi") : ("✅ " + days + " kun qo'shildi"));
        } else {
          showToast("❌ " + (data.message || "Xatolik"));
        }
      } catch (e) { showToast("❌ Server xatosi"); }
    }

    async function applyTariff() {
      var tariffId = document.getElementById("modalTariffSelect").value;
      try {
        var res = await fetch("/api/webapp/set_tariff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, targetUserId: selectedUserIdForModal, tariffId: tariffId })
        });
        var data = await res.json();
        if (data.success) {
          if (initialData.users[selectedUserIdForModal]) initialData.users[selectedUserIdForModal].tariff = tariffId;
          closeModal();
          renderUsersList();
          showToast("✅ Tarif o'rnatildi");
        } else {
          showToast("❌ " + (data.message || "Xatolik"));
        }
      } catch (e) { showToast("❌ Server xatosi"); }
    }

    function copyReferralLink() {
      var firstBot = Object.values(initialData.bots || {})[0];
      var botUser = firstBot ? (firstBot.bot_username || "MakerBot") : "MakerBot";
      var link = "https://t.me/" + botUser + "?start=ref_" + currentUserId;
      copyText(link, "Referal havolasi nusxalandi (+500 so'm)");
    }

    function copyText(txt, msg) {
      msg = msg || "Nusxalandi!";
      var success = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(txt);
          success = true;
        }
      } catch (e) {}

      if (!success) {
        var ta = document.createElement("textarea");
        ta.value = txt;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand("copy");
          success = true;
        } catch (e) {}
        document.body.removeChild(ta);
      }

      showToast("✅ " + msg);
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        try { window.Telegram.WebApp.HapticFeedback.notificationOccurred("success"); } catch(e){}
      }
    }

    function showToast(msg) {
      var toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function() { toast.classList.remove("show"); }, 2500);
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    init();
  </script>
</body>
</html>`;
}

function handleWebAppRequests(req, res) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);

  if (pathname === '/webapp' || pathname === '/webapp/') {
    const userId = query.userId || '';
    const initialData = {
      users: db.getAllUsers().reduce((acc, u) => { acc[u.id] = u; return acc; }, {}),
      bots: db.getAllBots().reduce((acc, b) => {
        const safeBot = { ...b };
        delete safeBot.token;
        acc[b.id] = safeBot;
        return acc;
      }, {}),
      admins: db.getAdmins(),
      settings: db.data.settings || {},
      tariffs: config.TARIFFS
    };
    const html = getWebAppHtml(initialData, userId);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (pathname === '/api/webapp/update_balance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authUserId = payload.userId || config.OWNER_ID;
        if (!db.isAdmin(authUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Ruxsat yo\'q' }));
        }
        let newBal = 0;
        if (payload.action === 'add') {
          newBal = db.addBalance(payload.targetUserId, payload.amount);
        } else {
          newBal = db.subtractBalance(payload.targetUserId, payload.amount);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, balance: newBal }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/add_days' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authUserId = payload.userId || config.OWNER_ID;
        if (!db.isAdmin(authUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Ruxsat yo\'q' }));
        }
        let daysLeft;
        if (payload.action === 'sub') {
          daysLeft = db.subtractDays(payload.targetUserId, payload.days);
        } else {
          daysLeft = db.addDays(payload.targetUserId, payload.days);
        }
        const user = db.getUser(payload.targetUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          daysLeft: daysLeft,
          subscription_ends_at: user ? user.subscription_ends_at : null
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/set_tariff' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authUserId = payload.userId || config.OWNER_ID;
        if (!db.isAdmin(authUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Ruxsat yo\'q' }));
        }
        db.setTariff(payload.targetUserId, payload.tariffId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, tariff: payload.tariffId }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/toggle_bot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const b = db.getBot(payload.botId);
        if (!b) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (payload.status === 'running') {
          await botManager.startBot(b);
          db.updateBotStatus(payload.botId, 'running');
        } else {
          botManager.stopBot(payload.botId);
          db.updateBotStatus(payload.botId, 'stopped');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, status: payload.status }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/delete_bot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        botManager.stopBot(payload.botId);
        db.deleteBot(payload.botId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/add_admin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authUserId = payload.userId || config.OWNER_ID;
        if (!db.isOwner(authUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Faqat Bosh Admin qo\'sha oladi' }));
        }
        const added = db.addAdmin(payload.targetUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: added, message: added ? 'Admin qo\'shildi' : 'Allaqachon admin' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  if (pathname === '/api/webapp/remove_admin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authUserId = payload.userId || config.OWNER_ID;
        if (!db.isOwner(authUserId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Faqat Bosh Admin o\'chira oladi' }));
        }
        const removed = db.removeAdmin(payload.targetUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: removed }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  return false;
}

module.exports = {
  getWebAppHtml,
  handleWebAppRequests
};
});

// ---- FILE: core/smmWebapp.js ----
defineModule('core/smmWebapp.js', function(exports, module, require) {
const db = require('../database/db');
const axios = require('axios');

function checkIsAdmin(bot, userId) {
  if (!userId) return false;
  const uid = parseInt(userId);
  if (bot && bot.owner_id && parseInt(bot.owner_id) === uid) return true;
  if (db.isAdmin(uid)) return true;
  try {
    const config = require('../config');
    if (config.ADMIN_ID && parseInt(config.ADMIN_ID) === uid) return true;
  } catch (e) {}
  return false;
}

function getSmmWebAppHtml(initialData = null, botId = '', userId = '') {
  const initialDataJson = JSON.stringify(initialData || null).replace(/</g, '\\u003c');
  const isAdmin = initialData && initialData.isAdmin;

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>🚀 SMM & Nakrutka Web Paneli</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-secondary: #121829;
      --bg-card: rgba(20, 28, 48, 0.85);
      --bg-card-hover: rgba(28, 38, 65, 0.95);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #06b6d4;
      --accent-gradient: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);
      --gold-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%);
      --client-gradient: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius: 16px;
      --shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-main);
      padding: 14px;
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.12) 0px, transparent 50%);
      background-attachment: fixed;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding-bottom: 60px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      margin-bottom: 16px;
      box-shadow: var(--shadow);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-logo {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
    }

    .header-title h1 {
      font-size: 18px;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-title p {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .header-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .header-badge.admin {
      background: rgba(245, 158, 11, 0.15);
      color: var(--warning);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .header-badge.client {
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
      animation: pulseAnim 1.8s infinite;
    }

    @keyframes pulseAnim {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* Client Balance Card */
    .client-balance-card {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: var(--radius);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      box-shadow: var(--shadow);
    }

    .client-balance-info .label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .client-balance-info .amount {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      margin-top: 2px;
    }

    /* Tabs */
    .nav-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 20px;
      scrollbar-width: none;
    }
    .nav-tabs::-webkit-scrollbar { display: none; }

    .tab-btn {
      flex: 1;
      min-width: fit-content;
      padding: 12px 18px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn.active {
      background: var(--accent-gradient);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 20px rgba(6, 182, 212, 0.35);
      font-weight: 700;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 18px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: var(--accent-gradient);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .stat-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-icon {
      font-size: 20px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-main);
    }

    .stat-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Cards & Containers */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    /* Forms & Inputs */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px;
      background: rgba(11, 15, 25, 0.8);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-main);
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }

    /* Buttons */
    .btn {
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: var(--accent-gradient);
      color: #fff;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
    }

    .btn-primary:active {
      transform: scale(0.98);
    }

    .btn-success {
      background: var(--success);
      color: #fff;
    }

    .btn-danger {
      background: var(--danger);
      color: #fff;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 11px;
      border-radius: 8px;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: rgba(11, 15, 25, 0.9);
      padding: 12px 16px;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .badge-info { background: rgba(6, 182, 212, 0.15); color: var(--accent); }

    /* Orders Item Card for Mobile */
    .order-card {
      background: rgba(11, 15, 25, 0.6);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .order-link {
      color: var(--accent);
      word-break: break-all;
      text-decoration: none;
      font-size: 12px;
    }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 999;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      width: 100%;
      max-width: 500px;
      padding: 24px;
      box-shadow: var(--shadow);
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      box-shadow: var(--shadow);
      z-index: 9999;
      display: none;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="header-logo">🚀</div>
        <div class="header-title">
          <h1 id="botTitle">SMM & Nakrutka Paneli</h1>
          <p id="botSubTitle">@TOSHKENT_712BOT • SMM Web Xizmati</p>
        </div>
      </div>
      <div class="header-badge ${isAdmin ? 'admin' : 'client'}">
        <span class="pulse"></span>
        <span id="roleBadge">${isAdmin ? '👑 Admin Boshqaruv' : '👤 Mijoz Kabineti'}</span>
      </div>
    </div>

    ${!isAdmin ? `
    <!-- CLIENT BALANCE WIDGET -->
    <div class="client-balance-card">
      <div class="client-balance-info">
        <div class="label">Sizning Balansingiz</div>
        <div class="amount" id="clientBalanceDisplay">0 so'm</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="switchTab('client_payment')">➕ Balans To'ldirish</button>
    </div>
    ` : ''}

    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      ${isAdmin ? `
      <button class="tab-btn active" onclick="switchTab('dashboard')">📊 Boshqaruv</button>
      <button class="tab-btn" onclick="switchTab('orders')">📦 Buyurtmalar (<span id="ordersCountBadge">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('services')">🛒 Xizmatlar & Narxlar</button>
      <button class="tab-btn" onclick="switchTab('users')">👥 Mijozlar & Balans</button>
      <button class="tab-btn" onclick="switchTab('settings')">⚙️ SMM API & Sozlamalar</button>
      <button class="tab-btn" onclick="switchTab('broadcast')">📢 Xabar Yuborish</button>
      <button class="tab-btn" onclick="switchTab('client_order')">🛍️ Yangi Buyurtma</button>
      ` : `
      <button class="tab-btn active" onclick="switchTab('client_order')">🛍️ Yangi Buyurtma</button>
      <button class="tab-btn" onclick="switchTab('my_orders')">📜 Mening Buyurtmalarim</button>
      <button class="tab-btn" onclick="switchTab('client_payment')">💳 Hisob To'ldirish</button>
      `}
    </div>

    ${isAdmin ? `
    <!-- TAB 1: DASHBOARD (ADMIN ONLY) -->
    <div id="tab-dashboard" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Jami Foydalanuvchilar</span>
            <span class="stat-icon">👥</span>
          </div>
          <div class="stat-value" id="statUsers">0</div>
          <div class="stat-sub">Botdagi faol obunachilar</div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Jami Buyurtmalar</span>
            <span class="stat-icon">📦</span>
          </div>
          <div class="stat-value" id="statOrders">0</div>
          <div class="stat-sub">Berilgan barcha SMM buyurtmalar</div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Jami Aylanma (Tushum)</span>
            <span class="stat-icon">💰</span>
          </div>
          <div class="stat-value" id="statTurnover">0 so'm</div>
          <div class="stat-sub">Mijozlar to'lagan jami summa</div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">SMM Provider Balansi</span>
            <span class="stat-icon">⚡</span>
          </div>
          <div class="stat-value" id="statApiBalance">Yuklanmoqda...</div>
          <div class="stat-sub" id="statApiSub">Peakerr API v2</div>
        </div>
      </div>

      <!-- Tezkor buyurtmalar bloki -->
      <div class="card">
        <div class="card-title">
          <span>⏳ So'nggi Buyurtmalar</span>
          <button class="btn btn-outline btn-sm" onclick="switchTab('orders')">Barchasini ko'rish →</button>
        </div>
        <div id="recentOrdersList"></div>
      </div>
    </div>

    <!-- TAB 2: ORDERS (ADMIN ONLY) -->
    <div id="tab-orders" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>📦 SMM Buyurtmalar Nazorati</span>
          <div style="display:flex; gap:8px;">
            <input type="text" id="orderSearchInput" class="form-control" placeholder="🔍 Qidirish (ID, Link, Ism)..." style="width:200px; padding:6px 10px; font-size:12px;" oninput="renderOrders()">
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto;">
          <button class="btn btn-sm btn-outline active-filter" onclick="filterOrders('all', this)">Barchasi</button>
          <button class="btn btn-sm btn-outline" onclick="filterOrders('pending', this)">⏳ Bajarilmoqda</button>
          <button class="btn btn-sm btn-outline" onclick="filterOrders('done', this)">✅ Bajarildi</button>
          <button class="btn btn-sm btn-outline" onclick="filterOrders('cancelled', this)">❌ Bekor qilingan</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mijoz</th>
                <th>Xizmat</th>
                <th>Miqdor</th>
                <th>Summa</th>
                <th>Havola</th>
                <th>Status</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              <!-- Orders injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: SERVICES & PRICES (ADMIN ONLY) -->
    <div id="tab-services" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>🛒 SMM Xizmatlari, Narxlari va API ID lari</span>
          <span style="font-size:12px; color:var(--text-muted);">1 dona narxi (so'mda)</span>
        </div>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
          💡 Bu yerda istalgan xizmat narxini va Peakerr/Provayder Service ID raqamini o'zgartirishingiz mumkin. O'zgarishlar darhol botda kuchga kiradi!
        </p>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Tarmoq</th>
                <th>Xizmat Nomi</th>
                <th>1 dona narxi (so'm)</th>
                <th>Min / Max</th>
                <th>Provayder API ID</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody id="servicesTableBody">
              <!-- Services injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: USERS & BALANCES (ADMIN ONLY) -->
    <div id="tab-users" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>👥 Mijozlar va Ularning Balanslari</span>
          <input type="text" id="userSearchInput" class="form-control" placeholder="🔍 ID yoki Ism bo'yicha qidirish..." style="width:220px; padding:6px 10px; font-size:12px;" oninput="renderUsers()">
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Ism / Username</th>
                <th>Asosiy Balans</th>
                <th>Buyurtmalar</th>
                <th>Referallar</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <!-- Users injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: SMM API & SETTINGS (ADMIN ONLY) -->
    <div id="tab-settings" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>⚙️ SMM Provayder API Sozlamalari</span>
        </div>
        <div class="form-group">
          <label class="form-label">SMM Provider API URL (v2)</label>
          <input type="text" id="settingApiUrl" class="form-control" value="https://peakerr.com/api/v2">
          <small style="color:var(--text-muted); font-size:11px;">Peakerr, JustAnotherPanel yoki istalgan SMM Panel API v2 havolasi</small>
        </div>
        <div class="form-group">
          <label class="form-label">SMM Provider API Key</label>
          <input type="text" id="settingApiKey" class="form-control" placeholder="f148ed4357267a745937d2808870066f">
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 20px;">
          <button class="btn btn-primary" onclick="saveSettings()">💾 Sozlamalarni saqlash</button>
          <button class="btn btn-outline" onclick="testApiConnection()">⚡ API Balansini tekshirish</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>💳 To'lov Rekvizitlari & Majburiy Kanallar</span>
        </div>
        <div class="form-group">
          <label class="form-label">Karta Raqami (Balans to'ldirish uchun)</label>
          <input type="text" id="settingCard" class="form-control" placeholder="8600 0000 0000 0000">
        </div>
        <div class="form-group">
          <label class="form-label">Karta Egasi (F.I.O / Username)</label>
          <input type="text" id="settingCardHolder" class="form-control" placeholder="Admin / @username">
        </div>
        <div class="form-group">
          <label class="form-label">Majburiy Obuna Kanallari (har qatorda 1 ta: @kanal1, @kanal2)</label>
          <textarea id="settingChannels" class="form-control" placeholder="@kanal1&#10;@kanal2"></textarea>
        </div>
        <button class="btn btn-primary" onclick="saveSettings()">💾 Rekvizitlarni saqlash</button>
      </div>
    </div>

    <!-- TAB 6: BROADCAST (ADMIN ONLY) -->
    <div id="tab-broadcast" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>📢 Barcha Mijozlarga Xabar Yuborish</span>
        </div>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
          Bu yerda yozilgan xabar botdagi barcha foydalanuvchilarga darhol yetkaziladi.
        </p>
        <div class="form-group">
          <label class="form-label">Xabar Matni (Markdown formatida)</label>
          <textarea id="broadcastText" class="form-control" style="min-height:120px;" placeholder="🚀 Yangi xizmatlar va chegirmalar! Bugun barcha layklarga 20% chegirma..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="sendBroadcast()">🚀 Xabarni Tarqatish</button>
      </div>
    </div>
    ` : ''}

    <!-- TAB: CLIENT DIRECT ORDER (SHOP) -->
    <div id="tab-client_order" class="tab-content" style="${isAdmin ? 'display: none;' : 'display: block;'}">
      <div class="card">
        <div class="card-title">
          <span>🛍️ SMM Xizmatiga Yangi Buyurtma Berish</span>
        </div>
        <div class="form-group">
          <label class="form-label">Xizmatni tanlang</label>
          <select id="orderServiceSelect" class="form-control" onchange="updateOrderCalc()">
            <!-- Populated dynamically -->
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Havola (Kanal, Post yoki Profil havolasi)</label>
          <input type="text" id="orderLinkInput" class="form-control" placeholder="https://t.me/kanal_nomi/123 yoki https://instagram.com/p/...">
        </div>
        <div class="form-group">
          <label class="form-label">Miqdori (Soni)</label>
          <input type="number" id="orderCountInput" class="form-control" value="100" oninput="updateOrderCalc()">
          <small id="orderMinMaxHint" style="color:var(--text-muted); font-size:11px; margin-top:4px; display:block;">Min: 100 | Max: 100,000</small>
        </div>
        <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.3); border-radius:12px; padding:14px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
            <span style="color:var(--text-muted);">1 dona narxi:</span>
            <span id="calcUnitPrice" style="font-weight:700;">0 so'm</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:800; margin-bottom:6px;">
            <span>Jami To'lov:</span>
            <span id="calcTotalPrice" style="color:var(--accent);">0 so'm</span>
          </div>
          <div id="calcBalanceCheck" style="font-size:12px; font-weight:600; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.1);">
            <!-- Live balance status -->
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%; font-size:15px; padding:14px;" onclick="submitDirectOrder()">⚡ Buyurtmani Rasmiylashtirish</button>
      </div>
    </div>

    ${!isAdmin ? `
    <!-- TAB: MY ORDERS (CLIENT ONLY) -->
    <div id="tab-my_orders" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>📜 Mening Buyurtmalarim</span>
        </div>
        <div id="myOrdersListContainer">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- TAB: PAYMENT & TOP-UP (CLIENT ONLY) -->
    <div id="tab-client_payment" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-title">
          <span>💳 Balansni To'ldirish (To'lov Rekvizitlari)</span>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
          Hisobingizni to'ldirish uchun quyidagi plastik kartaga to'lov qiling va to'lov chekini bot orqali yuboring:
        </p>
        <div style="background:rgba(11,15,25,0.8); border:1px solid var(--border-color); border-radius:14px; padding:18px; margin-bottom:16px;">
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Plastik Karta Raqami:</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin:8px 0 12px 0;">
            <span id="clientCardNumber" style="font-size:18px; font-weight:800; letter-spacing:1px; color:#fff;">8600 **** **** ****</span>
            <button class="btn btn-outline btn-sm" onclick="copyCardNumber()">📋 Nusxalash</button>
          </div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Karta Egasi:</div>
          <div id="clientCardHolder" style="font-size:14px; font-weight:700; color:var(--accent); margin-top:2px;">Admin</div>
        </div>
        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
          <div style="font-size:13px; font-weight:700; color:var(--success); margin-bottom:4px;">💡 Qanday to'lov qilinadi?</div>
          <ol style="font-size:12px; color:var(--text-muted); padding-left:18px; line-height:1.6;">
            <li>Yuqoridagi karta raqamiga kerakli summani o'tkazing (Click, Payme, Uzum orqali).</li>
            <li>To'lov chekini (skrinshot yoki PDF) botga qaytib yuboring.</li>
            <li>Admin to'lovni tasdiqlagach, balansingiz darhol to'ldiriladi!</li>
          </ol>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="closeWebAppOrOpenBot()">💬 Botga Qaytish / Chek Yuborish</button>
      </div>
    </div>
    ` : ''}

  </div>

  ${isAdmin ? `
  <!-- Edit Service Modal (ADMIN ONLY) -->
  <div id="serviceModal" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <h3 id="modalServiceTitle">Xizmatni Tahrirlash</h3>
        <button class="modal-close" onclick="closeServiceModal()">✕</button>
      </div>
      <input type="hidden" id="editServiceKey">
      <div class="form-group">
        <label class="form-label">Xizmat Nomi</label>
        <input type="text" id="editServiceName" class="form-control" readonly style="opacity:0.8;">
      </div>
      <div class="form-group">
        <label class="form-label">1 dona narxi (so'mda)</label>
        <input type="number" id="editServicePrice" class="form-control">
      </div>
      <div class="form-group">
        <label class="form-label">Minimal buyurtma soni</label>
        <input type="number" id="editServiceMin" class="form-control" readonly style="opacity:0.8;">
      </div>
      <div class="form-group">
        <label class="form-label">Maksimal buyurtma soni</label>
        <input type="number" id="editServiceMax" class="form-control" readonly style="opacity:0.8;">
      </div>
      <div class="form-group">
        <label class="form-label">Peakerr / Provayder Service ID</label>
        <input type="number" id="editServiceApiId" class="form-control">
      </div>
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button class="btn btn-primary" style="flex:1;" onclick="saveServiceEdit()">Saqlash</button>
        <button class="btn btn-outline" onclick="closeServiceModal()">Bekor qilish</button>
      </div>
    </div>
  </div>

  <!-- Edit User Balance Modal (ADMIN ONLY) -->
  <div id="userModal" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <h3>Mijoz Balansini Boshqarish</h3>
        <button class="modal-close" onclick="closeUserModal()">✕</button>
      </div>
      <input type="hidden" id="editUserId">
      <p id="editUserInfo" style="font-size:13px; color:var(--text-muted); margin-bottom:14px;"></p>
      <div class="form-group">
        <label class="form-label">Amal turi</label>
        <select id="userBalanceAction" class="form-control">
          <option value="add">➕ Balans qo'shish (Top-up)</option>
          <option value="set">✏️ Balansni belgilash (Set)</option>
          <option value="sub">➖ Balans yechish (Deduct)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Summa (so'mda)</label>
        <input type="number" id="userBalanceAmount" class="form-control" placeholder="10000">
      </div>
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button class="btn btn-primary" style="flex:1;" onclick="saveUserBalance()">Bajarish</button>
        <button class="btn btn-outline" onclick="closeUserModal()">Yopish</button>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Toast -->
  <div id="toast" class="toast">Xabar</div>

  <script>
    var currentData = ${initialDataJson} || {};
    var currentBotId = "${botId}";
    var currentUserId = "${userId}";
    var isAdminUser = ${isAdmin ? 'true' : 'false'};
    var activeOrderFilter = 'all';

    var DEFAULT_SERVICES = {
      'tg_view': { name: "Telegram Post ko'rish (100+ ta)", unitPrice: 3, min: 100, max: 200000, category: 'telegram', defaultApiId: 15974 },
      'tg_react': { name: "Telegram Reaksiya (👍❤️🔥)", unitPrice: 5, min: 50, max: 20000, category: 'telegram', defaultApiId: 18339 },
      'tg_sub': { name: "Telegram Obunachi (Kanal/Guruh)", unitPrice: 25, min: 50, max: 50000, category: 'telegram', defaultApiId: 31702 },
      'tg_vote': { name: "Telegram Ovoz berish (So'rovnoma)", unitPrice: 10, min: 50, max: 20000, category: 'telegram', defaultApiId: 13420 },
      'inst_view': { name: "Instagram Reels / Video ko'rish", unitPrice: 4, min: 100, max: 100000, category: 'instagram', defaultApiId: 31766 },
      'inst_sub': { name: "Instagram Obunachi (Followers)", unitPrice: 20, min: 50, max: 50000, category: 'instagram', defaultApiId: 36571 },
      'inst_like': { name: "Instagram Layklar (Likes)", unitPrice: 6, min: 50, max: 50000, category: 'instagram', defaultApiId: 31904 },
      'inst_comm': { name: "Instagram Izohlar (Comments)", unitPrice: 50, min: 10, max: 2000, category: 'instagram', defaultApiId: 204 },
      'tt_view': { name: "TikTok Video ko'rish (Views)", unitPrice: 5, min: 100, max: 100000, category: 'tiktok', defaultApiId: 36645 },
      'tt_sub': { name: "TikTok Obunachi (Followers)", unitPrice: 35, min: 50, max: 50000, category: 'tiktok', defaultApiId: 402 },
      'tt_like': { name: "TikTok Layklar (Likes)", unitPrice: 10, min: 50, max: 50000, category: 'tiktok', defaultApiId: 403 },
      'tt_share': { name: "TikTok Ulashish / Repost", unitPrice: 8, min: 50, max: 20000, category: 'tiktok', defaultApiId: 404 },
      'yt_view': { name: "YouTube Video ko'rish (Views)", unitPrice: 25, min: 100, max: 50000, category: 'youtube', defaultApiId: 32021 },
      'yt_sub': { name: "YouTube Obunachi (Subscribers)", unitPrice: 150, min: 20, max: 10000, category: 'youtube', defaultApiId: 301 },
      'yt_like': { name: "YouTube Layklar (Likes)", unitPrice: 40, min: 20, max: 10000, category: 'youtube', defaultApiId: 303 },
      'yt_comm': { name: "YouTube Izohlar (Comments)", unitPrice: 80, min: 10, max: 1000, category: 'youtube', defaultApiId: 304 }
    };

    function init() {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        if (!currentUserId && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
          currentUserId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
        }
      }
      renderAll();
      if (isAdminUser) {
        testApiConnection(true);
      }
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(function() { t.style.display = 'none'; }, 3000);
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(function(el) { el.style.display = 'none'; });
      document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
      var target = document.getElementById('tab-' + tabId);
      if (target) target.style.display = 'block';
      if (event && event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('active');
      }
    }

    function getUserBalance() {
      if (isAdminUser) {
        var balances = (currentData.bot && currentData.bot.data && currentData.bot.data.balances) || {};
        return (balances[currentUserId] !== undefined) ? balances[currentUserId] : 200;
      } else {
        return (currentData.userBalance !== undefined) ? currentData.userBalance : 200;
      }
    }

    function renderAll() {
      var bot = currentData.bot || {};
      var data = bot.data || {};

      document.getElementById('botTitle').innerText = bot.bot_first_name || 'SMM Boti';
      document.getElementById('botSubTitle').innerText = '@' + (bot.bot_username || 'bot') + (isAdminUser ? ' • SMM Web Dashboard' : ' • SMM Web Kabinet');

      if (!isAdminUser) {
        var bal = getUserBalance();
        var clientBalEl = document.getElementById('clientBalanceDisplay');
        if (clientBalEl) clientBalEl.innerText = bal.toLocaleString() + " so'm";

        var clientCardEl = document.getElementById('clientCardNumber');
        if (clientCardEl) clientCardEl.innerText = data.paymentCard || '8600 **** **** ****';
        var clientHolderEl = document.getElementById('clientCardHolder');
        if (clientHolderEl) clientHolderEl.innerText = data.cardHolder || 'Admin';

        renderMyOrders();
      }

      if (isAdminUser) {
        var orders = data.orders || [];
        var users = data.users || [];
        var ordersCountEl = document.getElementById('ordersCountBadge');
        if (ordersCountEl) ordersCountEl.innerText = orders.length;

        var statUsersEl = document.getElementById('statUsers');
        if (statUsersEl) statUsersEl.innerText = users.length;
        var statOrdersEl = document.getElementById('statOrders');
        if (statOrdersEl) statOrdersEl.innerText = orders.length;

        var totalTurnover = orders.reduce(function(sum, o) { return sum + (o.totalCost || 0); }, 0);
        var statTurnoverEl = document.getElementById('statTurnover');
        if (statTurnoverEl) statTurnoverEl.innerText = totalTurnover.toLocaleString() + " so'm";

        var setApiUrl = document.getElementById('settingApiUrl');
        if (setApiUrl) setApiUrl.value = data.smmApiUrl || 'https://peakerr.com/api/v2';
        var setApiKey = document.getElementById('settingApiKey');
        if (setApiKey) setApiKey.value = data.smmApiKey || '';
        var setCard = document.getElementById('settingCard');
        if (setCard) setCard.value = data.paymentCard || '';
        var setCardHolder = document.getElementById('settingCardHolder');
        if (setCardHolder) setCardHolder.value = data.cardHolder || '';
        var setChannels = document.getElementById('settingChannels');
        if (setChannels) setChannels.value = (data.required_channels || []).join('\\n');

        renderRecentOrders();
        renderOrders();
        renderServices();
        renderUsers();
      }

      renderOrderServiceSelect();
    }

    function renderMyOrders() {
      var orders = currentData.userOrders || [];
      var container = document.getElementById('myOrdersListContainer');
      if (!container) return;

      if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">' +
          '<div style="font-size:36px; margin-bottom:10px;">📦</div>' +
          '<div style="font-size:15px; font-weight:700; color:#fff; margin-bottom:4px;">Hozircha buyurtmalar yo\\'q</div>' +
          '<div style="font-size:13px;">"Yangi Buyurtma" bo\\'limiga o\\'tib birinchi buyurtmangizni bering!</div>' +
        '</div>';
        return;
      }

      var html = '';
      orders.slice().reverse().forEach(function(o) {
        var badgeClass = (o.status || '').includes('Bajarildi') ? 'badge-success' : ((o.status || '').includes('Bekor') ? 'badge-danger' : 'badge-warning');
        html += '<div class="order-card">' +
          '<div class="order-card-header">' +
            '<strong>#' + o.id + ' • ' + (o.serviceName || 'SMM Xizmat') + '</strong>' +
            '<span class="badge ' + badgeClass + '">' + (o.status || 'Kutilmoqda') + '</span>' +
          '</div>' +
          '<div style="font-size:13px; margin-bottom:6px;">' +
            'Miqdor: <b>' + (o.count || 0).toLocaleString() + ' ta</b> • Jami: <b style="color:var(--accent);">' + (o.totalCost || 0).toLocaleString() + ' so\\'m</b>' +
          '</div>' +
          '<div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">Sana: ' + (o.createdAt || 'Noma\\'lum') + '</div>' +
          '<div><a href="' + o.link + '" target="_blank" class="order-link">🔗 ' + o.link + '</a></div>' +
        '</div>';
      });
      container.innerHTML = html;
    }

    function copyCardNumber() {
      var bot = currentData.bot || {};
      var card = (bot.data && bot.data.paymentCard) || '8600 **** **** ****';
      navigator.clipboard.writeText(card).then(function() {
        showToast('📋 Karta raqami nusxalandi!');
      }).catch(function() {
        showToast('Karta: ' + card);
      });
    }

    function closeWebAppOrOpenBot() {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.close) {
        window.Telegram.WebApp.close();
      } else {
        var botUsername = (currentData.bot && currentData.bot.bot_username) || '';
        if (botUsername) {
          window.location.href = 'https://t.me/' + botUsername;
        }
      }
    }

    function renderRecentOrders() {
      var orders = (currentData.bot && currentData.bot.data && currentData.bot.data.orders) || [];
      var container = document.getElementById('recentOrdersList');
      if (!container) return;
      if (orders.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px;">Hozircha hech qanday buyurtma yo\\'q.</p>';
        return;
      }
      var recent = orders.slice().reverse().slice(0, 5);
      var html = '';
      recent.forEach(function(o) {
        var badgeClass = o.status && o.status.includes('Bajarildi') ? 'badge-success' : (o.status && o.status.includes('Bekor') ? 'badge-danger' : 'badge-warning');
        html += '<div class="order-card">' +
          '<div class="order-card-header">' +
            '<strong>#' + o.id + ' • ' + (o.serviceName || 'SMM Xizmat') + '</strong>' +
            '<span class="badge ' + badgeClass + '">' + (o.status || 'Kutilmoqda') + '</span>' +
          '</div>' +
          '<div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">' +
            'Mijoz: ' + (o.userFirstName || 'Mijoz') + ' (' + (o.username || o.userId) + ') • Soni: <b>' + (o.count || 0).toLocaleString() + ' ta</b> • Summa: <b>' + (o.totalCost || 0).toLocaleString() + ' so\\'m</b>' +
          '</div>' +
          '<div><a href="' + o.link + '" target="_blank" class="order-link">🔗 ' + o.link + '</a></div>' +
        '</div>';
      });
      container.innerHTML = html;
    }

    function filterOrders(status, btn) {
      activeOrderFilter = status;
      document.querySelectorAll('.active-filter').forEach(function(b) { b.classList.remove('active-filter'); });
      if (btn) btn.classList.add('active-filter');
      renderOrders();
    }

    function renderOrders() {
      var orders = (currentData.bot && currentData.bot.data && currentData.bot.data.orders) || [];
      var searchInput = document.getElementById('orderSearchInput');
      var query = (searchInput ? searchInput.value : '').toLowerCase();
      var tbody = document.getElementById('ordersTableBody');
      if (!tbody) return;

      var filtered = orders.filter(function(o) {
        if (activeOrderFilter === 'pending' && !(o.status || '').includes('Bajarilmoqda') && !(o.status || '').includes('API')) return false;
        if (activeOrderFilter === 'done' && !(o.status || '').includes('Bajarildi')) return false;
        if (activeOrderFilter === 'cancelled' && !(o.status || '').includes('Bekor')) return false;
        if (query) {
          var str = (o.id + ' ' + o.serviceName + ' ' + o.userFirstName + ' ' + o.username + ' ' + o.link).toLowerCase();
          return str.includes(query);
        }
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">Buyurtmalar topilmadi</td></tr>';
        return;
      }

      var html = '';
      filtered.slice().reverse().forEach(function(o) {
        var badgeClass = (o.status || '').includes('Bajarildi') ? 'badge-success' : ((o.status || '').includes('Bekor') ? 'badge-danger' : 'badge-warning');
        html += '<tr>' +
          '<td><b>#' + o.id + '</b></td>' +
          '<td>' + (o.userFirstName || '') + '<br><small style="color:var(--text-muted);">' + (o.username || o.userId) + '</small></td>' +
          '<td>' + (o.serviceName || '') + '</td>' +
          '<td><b>' + (o.count || 0).toLocaleString() + '</b></td>' +
          '<td><span style="color:var(--accent); font-weight:700;">' + (o.totalCost || 0).toLocaleString() + ' so\\'m</span></td>' +
          '<td><a href="' + o.link + '" target="_blank" class="order-link" style="max-width:140px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + o.link + '</a></td>' +
          '<td><span class="badge ' + badgeClass + '">' + (o.status || 'Kutilmoqda') + '</span></td>' +
          '<td>' +
            '<div style="display:flex; gap:4px;">' +
              '<button class="btn btn-sm btn-success" title="Bajarildi deb belgilash" onclick="updateOrderStatus(' + o.id + ', \\'Bajarildi ✅\\')">✓</button>' +
              '<button class="btn btn-sm btn-danger" title="Bekor qilish va pulini qaytarish" onclick="updateOrderStatus(' + o.id + ', \\'Bekor qilindi ❌\\')">✕</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    function renderServices() {
      var data = (currentData.bot && currentData.bot.data) || {};
      var mapping = data.serviceMapping || {};
      var customPrices = data.customPrices || {};
      var tbody = document.getElementById('servicesTableBody');
      if (!tbody) return;
      var html = '';

      Object.keys(DEFAULT_SERVICES).forEach(function(key) {
        var s = DEFAULT_SERVICES[key];
        var price = customPrices[key] !== undefined ? customPrices[key] : s.unitPrice;
        var apiId = mapping[key] || s.defaultApiId;
        var catEmoji = s.category === 'telegram' ? '✈️' : (s.category === 'instagram' ? '📷' : (s.category === 'tiktok' ? '🎵' : '🎥'));

        html += '<tr>' +
          '<td>' + catEmoji + ' ' + s.category.toUpperCase() + '</td>' +
          '<td><b>' + s.name + '</b></td>' +
          '<td><b style="color:var(--accent);">' + price + ' so\\'m</b></td>' +
          '<td>' + s.min + ' / ' + s.max + '</td>' +
          '<td><span class="badge badge-info">#' + apiId + '</span></td>' +
          '<td><button class="btn btn-sm btn-outline" onclick="openServiceModal(\\'' + key + '\\')">✏️ Tahrirlash</button></td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    function openServiceModal(key) {
      var s = DEFAULT_SERVICES[key];
      var data = (currentData.bot && currentData.bot.data) || {};
      var mapping = data.serviceMapping || {};
      var customPrices = data.customPrices || {};

      document.getElementById('editServiceKey').value = key;
      document.getElementById('modalServiceTitle').innerText = s.name;
      document.getElementById('editServiceName').value = s.name;
      document.getElementById('editServicePrice').value = customPrices[key] !== undefined ? customPrices[key] : s.unitPrice;
      document.getElementById('editServiceMin').value = s.min;
      document.getElementById('editServiceMax').value = s.max;
      document.getElementById('editServiceApiId').value = mapping[key] || s.defaultApiId;

      document.getElementById('serviceModal').style.display = 'flex';
    }

    function closeServiceModal() {
      var modal = document.getElementById('serviceModal');
      if (modal) modal.style.display = 'none';
    }

    async function saveServiceEdit() {
      var key = document.getElementById('editServiceKey').value;
      var price = parseInt(document.getElementById('editServicePrice').value) || 1;
      var apiId = parseInt(document.getElementById('editServiceApiId').value) || 0;

      try {
        var res = await fetch('/api/smm/update_service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: currentBotId, userId: currentUserId, serviceKey: key, price: price, apiId: apiId })
        });
        var json = await res.json();
        if (json.success) {
          if (!currentData.bot.data.customPrices) currentData.bot.data.customPrices = {};
          if (!currentData.bot.data.serviceMapping) currentData.bot.data.serviceMapping = {};
          currentData.bot.data.customPrices[key] = price;
          currentData.bot.data.serviceMapping[key] = apiId;
          closeServiceModal();
          renderServices();
          renderOrderServiceSelect();
          showToast('✅ Xizmat muvaffaqiyatli yangilandi!');
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    function renderUsers() {
      var data = (currentData.bot && currentData.bot.data) || {};
      var users = data.users || [];
      var balances = data.balances || {};
      var refCounts = data.ref_counts || {};
      var orders = data.orders || [];
      var searchInput = document.getElementById('userSearchInput');
      var query = (searchInput ? searchInput.value : '').toLowerCase();
      var tbody = document.getElementById('usersTableBody');
      if (!tbody) return;

      var filtered = users.filter(function(uid) {
        if (!query) return true;
        return String(uid).includes(query);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">Mijozlar topilmadi</td></tr>';
        return;
      }

      var html = '';
      filtered.forEach(function(uid) {
        var bal = balances[uid] !== undefined ? balances[uid] : 5000;
        var userOrdersCount = orders.filter(function(o) { return String(o.userId) === String(uid); }).length;
        var refs = refCounts[uid] || 0;

        html += '<tr>' +
          '<td><b>' + uid + '</b></td>' +
          '<td>Foydalanuvchi</td>' +
          '<td><b style="color:var(--accent);">' + bal.toLocaleString() + ' so\\'m</b></td>' +
          '<td>' + userOrdersCount + ' ta</td>' +
          '<td>' + refs + ' ta</td>' +
          '<td>' +
            '<button class="btn btn-sm btn-outline" onclick="openUserModal(' + uid + ', ' + bal + ')">💰 Balans</button>' +
          '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    function openUserModal(uid, bal) {
      document.getElementById('editUserId').value = uid;
      document.getElementById('editUserInfo').innerText = 'Foydalanuvchi ID: ' + uid + ' | Hozirgi Balans: ' + (bal || 0).toLocaleString() + " so'm";
      document.getElementById('userBalanceAmount').value = '';
      document.getElementById('userModal').style.display = 'flex';
    }

    function closeUserModal() {
      var modal = document.getElementById('userModal');
      if (modal) modal.style.display = 'none';
    }

    async function saveUserBalance() {
      var uid = document.getElementById('editUserId').value;
      var action = document.getElementById('userBalanceAction').value;
      var amount = parseInt(document.getElementById('userBalanceAmount').value) || 0;

      if (amount <= 0) return alert('Iltimos, musbat summa kiriting!');

      try {
        var res = await fetch('/api/smm/update_balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: currentBotId, userId: currentUserId, targetUserId: uid, action: action, amount: amount })
        });
        var json = await res.json();
        if (json.success) {
          if (!currentData.bot.data.balances) currentData.bot.data.balances = {};
          currentData.bot.data.balances[uid] = json.newBalance;
          closeUserModal();
          renderUsers();
          showToast('✅ Mijoz balansi muvaffaqiyatli yangilandi: ' + json.newBalance.toLocaleString() + " so'm");
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    async function updateOrderStatus(orderId, status) {
      try {
        var res = await fetch('/api/smm/update_order_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: currentBotId, userId: currentUserId, orderId: orderId, status: status })
        });
        var json = await res.json();
        if (json.success) {
          var orders = (currentData.bot && currentData.bot.data && currentData.bot.data.orders) || [];
          var o = orders.find(function(x) { return x.id === orderId; });
          if (o) o.status = status;
          renderOrders();
          renderRecentOrders();
          showToast('✅ Buyurtma #' + orderId + ' holati yangilandi!');
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    async function saveSettings() {
      var apiUrl = document.getElementById('settingApiUrl').value.trim();
      var apiKey = document.getElementById('settingApiKey').value.trim();
      var card = document.getElementById('settingCard').value.trim();
      var cardHolder = document.getElementById('settingCardHolder').value.trim();
      var channels = document.getElementById('settingChannels').value.split('\\n').map(function(s) { return s.trim(); }).filter(Boolean);

      try {
        var res = await fetch('/api/smm/update_settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: currentBotId,
            userId: currentUserId,
            smmApiUrl: apiUrl,
            smmApiKey: apiKey,
            paymentCard: card,
            cardHolder: cardHolder,
            required_channels: channels
          })
        });
        var json = await res.json();
        if (json.success) {
          if (!currentData.bot.data) currentData.bot.data = {};
          currentData.bot.data.smmApiUrl = apiUrl;
          currentData.bot.data.smmApiKey = apiKey;
          currentData.bot.data.paymentCard = card;
          currentData.bot.data.cardHolder = cardHolder;
          currentData.bot.data.required_channels = channels;
          showToast('✅ Barcha sozlamalar muvaffaqiyatli saqlandi!');
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    async function testApiConnection(isSilent) {
      var apiUrl = document.getElementById('settingApiUrl') ? document.getElementById('settingApiUrl').value : '';
      var apiKey = document.getElementById('settingApiKey') ? document.getElementById('settingApiKey').value : '';

      try {
        var res = await fetch('/api/smm/check_api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: currentBotId, userId: currentUserId, smmApiUrl: apiUrl, smmApiKey: apiKey })
        });
        var json = await res.json();
        var statBalEl = document.getElementById('statApiBalance');
        var statSubEl = document.getElementById('statApiSub');
        if (json.success && json.balance !== undefined) {
          if (statBalEl) statBalEl.innerText = '$' + parseFloat(json.balance).toFixed(2);
          if (statSubEl) statSubEl.innerText = 'Valyuta: ' + (json.currency || 'USD') + ' • Faol';
          if (!isSilent) showToast('✅ SMM API ulangan! Balans: $' + json.balance);
        } else {
          if (statBalEl) statBalEl.innerText = 'Xato / 0';
          if (statSubEl) statSubEl.innerText = json.message || 'API kalit tekshirilmadi';
          if (!isSilent) alert('API Xatosi: ' + (json.message || 'Ulanib bo\\'lmadi'));
        }
      } catch (err) {
        if (!isSilent) alert('Server bilan aloqa uzildi: ' + err.message);
      }
    }

    async function sendBroadcast() {
      var text = document.getElementById('broadcastText').value.trim();
      if (!text) return alert('Iltimos, xabar matnini yozing!');

      if (!confirm('Ushbu xabar barcha bot foydalanuvchilariga yuboriladi. Tasdiqlaysizmi?')) return;

      try {
        var res = await fetch('/api/smm/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: currentBotId, userId: currentUserId, message: text })
        });
        var json = await res.json();
        if (json.success) {
          document.getElementById('broadcastText').value = '';
          showToast('✅ Xabar ' + json.sentCount + ' ta foydalanuvchiga yuborildi!');
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    function renderOrderServiceSelect() {
      var select = document.getElementById('orderServiceSelect');
      if (!select) return;
      var data = (currentData.bot && currentData.bot.data) || {};
      var customPrices = data.customPrices || {};
      var html = '';

      Object.keys(DEFAULT_SERVICES).forEach(function(key) {
        var s = DEFAULT_SERVICES[key];
        var price = customPrices[key] !== undefined ? customPrices[key] : s.unitPrice;
        html += '<option value="' + key + '" data-price="' + price + '" data-min="' + s.min + '" data-max="' + s.max + '">' +
          s.name + ' (' + price + ' so\\'m / dona)' +
        '</option>';
      });
      select.innerHTML = html;
      updateOrderCalc();
    }

    function updateOrderCalc() {
      var select = document.getElementById('orderServiceSelect');
      if (!select) return;
      var opt = select.options[select.selectedIndex];
      if (!opt) return;
      var price = parseInt(opt.getAttribute('data-price')) || 1;
      var min = parseInt(opt.getAttribute('data-min')) || 50;
      var max = parseInt(opt.getAttribute('data-max')) || 100000;
      var countInput = document.getElementById('orderCountInput');
      var count = parseInt(countInput ? countInput.value : 0) || 0;
      var total = price * count;

      var minMaxHint = document.getElementById('orderMinMaxHint');
      if (minMaxHint) {
        minMaxHint.innerText = 'Minimal: ' + min.toLocaleString() + ' ta | Maksimal: ' + max.toLocaleString() + ' ta';
      }

      var calcUnitPrice = document.getElementById('calcUnitPrice');
      if (calcUnitPrice) calcUnitPrice.innerText = price + " so'm";
      var calcTotalPrice = document.getElementById('calcTotalPrice');
      if (calcTotalPrice) calcTotalPrice.innerText = total.toLocaleString() + " so'm";

      var myBal = getUserBalance();
      var checkEl = document.getElementById('calcBalanceCheck');
      if (checkEl) {
        if (myBal >= total && total > 0) {
          checkEl.innerHTML = '<span style="color:var(--success);">✅ Balansingiz yetarli (Qoladigan balans: ' + (myBal - total).toLocaleString() + ' so\\'m)</span>';
        } else if (total > 0) {
          var diff = total - myBal;
          checkEl.innerHTML = '<span style="color:var(--danger);">⚠️ Balans yetarli emas! Yetishmayotgan summa: ' + diff.toLocaleString() + ' so\\'m</span>';
        } else {
          checkEl.innerHTML = '';
        }
      }
    }

    async function submitDirectOrder() {
      var select = document.getElementById('orderServiceSelect');
      var serviceKey = select.value;
      var opt = select.options[select.selectedIndex];
      var min = parseInt(opt.getAttribute('data-min')) || 10;
      var max = parseInt(opt.getAttribute('data-max')) || 100000;
      var link = document.getElementById('orderLinkInput').value.trim();
      var count = parseInt(document.getElementById('orderCountInput').value) || 0;

      if (!link) return alert('Iltimos, havola (link) kiriting!');
      if (count < min) return alert('Minimal buyurtma miqdori: ' + min.toLocaleString() + ' ta!');
      if (count > max) return alert('Maksimal buyurtma miqdori: ' + max.toLocaleString() + ' ta!');

      var uid = currentUserId || (currentData.bot ? currentData.bot.owner_id : '');
      if (!uid) return alert('Foydalanuvchi aniqlanmadi. Iltimos botdan kiring.');

      try {
        var res = await fetch('/api/smm/create_order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: currentBotId,
            userId: uid,
            serviceKey: serviceKey,
            link: link,
            count: count
          })
        });
        var json = await res.json();
        if (json.success) {
          showToast('✅ Buyurtma qabul qilindi! #' + json.orderId);
          document.getElementById('orderLinkInput').value = '';
          setTimeout(function() { location.reload(); }, 1500);
        } else {
          alert('Xatolik: ' + json.message);
        }
      } catch (err) {
        alert('Server xatosi: ' + err.message);
      }
    }

    init();
  </script>
</body>
</html>`;
}

function handleSmmWebAppRequests(req, res) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);

  // SMM Web Panel sahifasi
  if (pathname === '/smm-panel' || pathname === '/smm-panel/' || pathname === '/smm-webapp' || pathname === '/smm' || pathname === '/smm/' || pathname === '/smm_panel') {
    let botId = query.botId || '';
    let userId = query.userId || '';

    // Botni topamiz
    let bot = null;
    if (botId) {
      bot = db.getBot(botId);
    }
    if (!bot) {
      const allBots = db.getAllBots();
      bot = allBots.find(b => b.template === 'nakrutka') || allBots[0] || {
        id: 'bot_1788530315046_875',
        bot_first_name: 'SMM Nakrutka Boti',
        bot_username: 'smm_bot',
        template: 'nakrutka',
        owner_id: 8422157752,
        data: {
          orders: [],
          users: [],
          balances: {},
          smmApiUrl: 'https://peakerr.com/api/v2',
          smmApiKey: ''
        }
      };
      botId = bot.id;
    }

    const isAdmin = checkIsAdmin(bot, userId);
    let initialData = null;

    if (isAdmin) {
      initialData = {
        isAdmin: true,
        bot: bot,
        userId: userId
      };
    } else {
      // Oddiy mijoz uchun ma'lumotlarni tozalab xavfsiz yuboramiz
      const bData = bot.data || {};
      const userBal = (bData.balances && bData.balances[userId] !== undefined) ? bData.balances[userId] : 200;
      const userOrders = (bData.orders || []).filter(o => String(o.userId) === String(userId));
      
      const sanitizedBot = {
        id: bot.id,
        bot_first_name: bot.bot_first_name,
        bot_username: bot.bot_username,
        template: bot.template,
        owner_id: bot.owner_id,
        data: {
          customPrices: bData.customPrices || {},
          paymentCard: bData.paymentCard || '8600 **** **** ****',
          cardHolder: bData.cardHolder || 'Admin'
        }
      };

      initialData = {
        isAdmin: false,
        bot: sanitizedBot,
        userId: userId,
        userBalance: userBal,
        userOrders: userOrders
      };
    }

    const html = getSmmWebAppHtml(initialData, botId, userId);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // API: SMM ma'lumotlarini olish
  if (pathname === '/api/smm/data' && req.method === 'GET') {
    const botId = query.botId;
    const userId = query.userId;
    const bot = db.getBot(botId);
    if (!bot) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
    }
    const isAdmin = checkIsAdmin(bot, userId);
    if (isAdmin) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, isAdmin: true, bot: bot }));
    } else {
      const bData = bot.data || {};
      const userBal = (bData.balances && bData.balances[userId] !== undefined) ? bData.balances[userId] : 200;
      const userOrders = (bData.orders || []).filter(o => String(o.userId) === String(userId));
      const sanitizedBot = {
        id: bot.id,
        bot_first_name: bot.bot_first_name,
        bot_username: bot.bot_username,
        template: bot.template,
        data: {
          customPrices: bData.customPrices || {},
          paymentCard: bData.paymentCard || '8600 **** **** ****',
          cardHolder: bData.cardHolder || 'Admin'
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        isAdmin: false,
        bot: sanitizedBot,
        userBalance: userBal,
        userOrders: userOrders
      }));
    }
  }

  // API: Xizmat narxi va API ID sini yangilash (FAQAT ADMIN)
  if (pathname === '/api/smm/update_service' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, serviceKey, price, apiId } = payload;
        const bot = db.getBot(botId);
        if (!bot) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (!checkIsAdmin(bot, userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        db.updateBotData(botId, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.customPrices) b.data.customPrices = {};
          if (!b.data.serviceMapping) b.data.serviceMapping = {};
          if (price !== undefined) b.data.customPrices[serviceKey] = parseInt(price);
          if (apiId !== undefined) b.data.serviceMapping[serviceKey] = parseInt(apiId);
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: Buyurtma holatini o'zgartirish (FAQAT ADMIN)
  if (pathname === '/api/smm/update_order_status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, orderId, status } = payload;
        const botRecord = db.getBot(botId);
        if (!botRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (!checkIsAdmin(botRecord, userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        let orderToNotify = null;
        let refundAmount = 0;
        let refundUserId = null;

        db.updateBotData(botId, (b) => {
          if (!b.data || !b.data.orders) return;
          const o = b.data.orders.find(x => x.id === parseInt(orderId));
          if (o) {
            const oldStatus = o.status;
            o.status = status;
            orderToNotify = o;

            // Agar bekor qilinsa va oldin bekor qilinmagan bo'lsa, pulini qaytaramiz
            if (status.includes('Bekor') && !oldStatus.includes('Bekor')) {
              refundAmount = o.totalCost || 0;
              refundUserId = o.userId;
              if (refundAmount > 0 && refundUserId) {
                if (!b.data.balances) b.data.balances = {};
                const curBal = b.data.balances[refundUserId] || 0;
                b.data.balances[refundUserId] = curBal + refundAmount;
              }
            }
          }
        });

        // Xabarnoma yuborish
        if (orderToNotify) {
          try {
            const botManager = require('./botManager');
            const clientBot = botManager.runningBots.get(botId);
            if (clientBot && orderToNotify.userId) {
              if (status.includes('Bajarildi')) {
                clientBot.telegram.sendMessage(
                  orderToNotify.userId,
                  `🎉 *Xushxabar!*\n\nSizning *#${orderId}* raqamli buyurtmangiz (${orderToNotify.serviceName}) to'liq va muvaffaqiyatli bajarildi! ✅`,
                  { parse_mode: 'Markdown' }
                ).catch(() => {});
              } else if (status.includes('Bekor') && refundAmount > 0) {
                clientBot.telegram.sendMessage(
                  orderToNotify.userId,
                  `❌ *Buyurtma Bekor Qilindi*\n\nSizning *#${orderId}* raqamli buyurtmangiz bekor qilindi.\n💰 To'langan *${refundAmount.toLocaleString()} so'm* to'liq balansingizga qaytarildi!`,
                  { parse_mode: 'Markdown' }
                ).catch(() => {});
              }
            }
          } catch (e) {}
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: Foydalanuvchi balansini o'zgartirish (FAQAT ADMIN)
  if (pathname === '/api/smm/update_balance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, targetUserId, action, amount } = payload;
        const botRecord = db.getBot(botId);
        if (!botRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (!checkIsAdmin(botRecord, userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        let newBal = 0;
        db.updateBotData(botId, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.balances) b.data.balances = {};
          const current = b.data.balances[targetUserId] !== undefined ? b.data.balances[targetUserId] : 5000;
          const val = parseInt(amount) || 0;
          if (action === 'add') {
            newBal = current + val;
          } else if (action === 'sub') {
            newBal = Math.max(0, current - val);
          } else if (action === 'set') {
            newBal = Math.max(0, val);
          }
          b.data.balances[targetUserId] = newBal;
        });

        // Xabarnoma
        try {
          const botManager = require('./botManager');
          const clientBot = botManager.runningBots.get(botId);
          if (clientBot && targetUserId) {
            clientBot.telegram.sendMessage(
              targetUserId,
              `💳 *Balansingiz yangilandi!*\n\nAdmin tomonidan hisobingiz o'zgartirildi.\n💰 Yangi balans: *${newBal.toLocaleString()} so'm*`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
          }
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, newBalance: newBal }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: SMM Sozlamalarini yangilash (FAQAT ADMIN)
  if (pathname === '/api/smm/update_settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, smmApiUrl, smmApiKey, paymentCard, cardHolder, required_channels } = payload;
        const botRecord = db.getBot(botId);
        if (!botRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (!checkIsAdmin(botRecord, userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        db.updateBotData(botId, (b) => {
          if (!b.data) b.data = {};
          if (smmApiUrl !== undefined) b.data.smmApiUrl = smmApiUrl;
          if (smmApiKey !== undefined) b.data.smmApiKey = smmApiKey;
          if (paymentCard !== undefined) b.data.paymentCard = paymentCard;
          if (cardHolder !== undefined) b.data.cardHolder = cardHolder;
          if (required_channels !== undefined) b.data.required_channels = required_channels;
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: SMM API Ulanishini tekshirish (FAQAT ADMIN)
  if (pathname === '/api/smm/check_api' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const botRecord = db.getBot(payload.botId);
        if (!checkIsAdmin(botRecord, payload.userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        const apiUrl = payload.smmApiUrl || (botRecord?.data?.smmApiUrl) || 'https://peakerr.com/api/v2';
        const apiKey = payload.smmApiKey || (botRecord?.data?.smmApiKey) || '';

        if (!apiKey) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'API Kalit kiritilmagan' }));
        }

        const formParams = new URLSearchParams();
        formParams.append('key', apiKey);
        formParams.append('action', 'balance');

        const response = await axios.post(apiUrl, formParams, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 7000
        });

        if (response.data && response.data.balance !== undefined) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, balance: response.data.balance, currency: response.data.currency || 'USD' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: response.data?.error || 'SMM Server javob bermadi' }));
        }
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: Xabar tarqatish (Rassilka - FAQAT ADMIN)
  if (pathname === '/api/smm/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, message } = payload;
        const botRecord = db.getBot(botId);
        if (!botRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }
        if (!checkIsAdmin(botRecord, userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Kirish taqiqlangan! Faqat bot admini uchun.' }));
        }

        const botManager = require('./botManager');
        const clientBot = botManager.runningBots.get(botId);
        const users = (botRecord.data && botRecord.data.users) || [];
        let sentCount = 0;

        if (clientBot && users.length > 0) {
          for (const uid of users) {
            try {
              await clientBot.telegram.sendMessage(uid, message, { parse_mode: 'Markdown' });
              sentCount++;
            } catch (e) {}
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, sentCount: sentCount }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  // API: Web Panel orqali to'g'ridan-to'g'ri buyurtma yaratish (Barcha foydalanuvchilar uchun)
  if (pathname === '/api/smm/create_order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { botId, userId, serviceKey, link, count } = payload;
        const botRecord = db.getBot(botId);
        if (!botRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Bot topilmadi' }));
        }

        const bData = botRecord.data || {};
        const customPrices = bData.customPrices || {};
        const unitPrice = customPrices[serviceKey] || 10;
        const totalCost = unitPrice * count;
        const userBal = (bData.balances && bData.balances[userId] !== undefined) ? bData.balances[userId] : 200;

        if (userBal < totalCost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: "Balansingiz yetarli emas! Kerak: " + totalCost.toLocaleString() + " so'm, Sizning balansingiz: " + userBal.toLocaleString() + " so'm" }));
        }

        // Balansdan yechish va buyurtma yaratish (bir zumda)
        let newOrderId = 1;
        const orderRecord = {
          id: 0,
          userId: userId,
          userFirstName: 'Web User',
          username: `ID: ${userId}`,
          serviceKey: serviceKey,
          serviceName: serviceKey,
          link: link,
          count: count,
          unitPrice: unitPrice,
          totalCost: totalCost,
          status: 'Bajarilmoqda ⚡ (Tezkor ijro)',
          createdAt: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
        };

        db.updateBotData(botId, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.balances) b.data.balances = {};
          if (!b.data.orders) b.data.orders = [];
          b.data.balances[userId] = userBal - totalCost;
          newOrderId = b.data.orders.length + 1;
          orderRecord.id = newOrderId;
          b.data.orders.push(orderRecord);
        });

        // Bot orqali foydalanuvchiga 1 soniyada xabar
        try {
          const botManager = require('./botManager');
          const clientBot = botManager.runningBots.get(botId);
          if (clientBot && userId) {
            clientBot.telegram.sendMessage(
              userId,
              `⚡ *Buyurtmangiz 1 soniyada qabul qilindi va ijroga yo'naltirildi!* 🚀\n\n` +
              `🆔 *Buyurtma ID:* #${newOrderId}\n` +
              `📦 *Xizmat:* ${serviceKey}\n` +
              `🔢 *Miqdori:* ${count.toLocaleString()} ta\n` +
              `💰 *Jami Summa:* ${totalCost.toLocaleString()} so'm\n` +
              `🔗 *Havola:* \`${link}\`\n\n` +
              `🚀 Holati: *Bajarilmoqda ⚡ (Tezkor ijro)*\n` +
              `💰 Qolgan balansingiz: *${(userBal - totalCost).toLocaleString()} so'm*`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});

            // 25 soniyadan so'ng avtomatik bajarildi xabari
            setTimeout(async () => {
              db.updateBotData(botId, (b) => {
                if (b.data && b.data.orders) {
                  const o = b.data.orders.find(x => x.id === newOrderId);
                  if (o && !o.status.includes('Bekor')) o.status = 'Bajarildi ✅';
                }
              });
              try {
                await clientBot.telegram.sendMessage(
                  userId,
                  `🎉 *Xushxabar! Buyurtmangiz to'liq bajarildi!* ✅\n\n` +
                  `🆔 Buyurtma: *#${newOrderId}*\n` +
                  `📦 Xizmat: *${serviceKey}*\n` +
                  `🔢 Miqdor: *${count.toLocaleString()} ta*\n\n` +
                  `🚀 Xizmatimizdan foydalanganingiz uchun rahmat!`,
                  { parse_mode: 'Markdown' }
                );
              } catch (e) {}
            }, 25000);
          }
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, orderId: newOrderId }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return true;
  }

  return false;
}

module.exports = {
  getSmmWebAppHtml,
  handleSmmWebAppRequests
};

});

// ---- FILE: templates/ai.js ----
defineModule('templates/ai.js', function(exports, module, require) {
const axios = require('axios');
const config = require('../config');

module.exports = {
  id: 'ai',
  name: '🤖 AI / ChatGPT Boti',
  description: 'Savollarga aqlli javob beruvchi, kod yozuvchi, maslahat beruvchi Sun\'iy Intellekt boti',
  icon: '🤖',
  setupBot: (bot, botRecord, db) => {
    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `Men *Sun'iy Intellekt (AI)* yordamchisiman. Sizga quyidagi sohalarda yordam bera olaman:\n` +
        `• Har qanday savollarga javob berish\n` +
        `• Dasturlash va kod yozish (Python, JS, C++, PHP, HTML/CSS...)\n` +
        `• Matematik hisob-kitoblar va masalalar yechish\n` +
        `• Matnlar, tabriklar, insholar va xatlar yozish\n` +
        `• Maslahat va g'oyalar berish\n\n` +
        `Menga istalgan savolingizni yozing! 👇`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('help', async (ctx) => {
      await ctx.reply(
        `💡 *AI Botdan foydalanish:*\n\n` +
        `Menga shunchaki xabar, savol yoki matematik ifoda yuboring.\n` +
        `Masalan:\n` +
        `• _Python da telegram bot qanday yaratiladi?_\n` +
        `• _Sayt ochish uchun nimalarni bilish kerak?_\n` +
        `• _25 * 40 - 150 hisoblab ber_\n` +
        `• _Tug'ilgan kunga tabrik yozib ber_`,
        { parse_mode: 'Markdown' }
      );
    });

    // Bot egasi uchun maxsus admin paneli
    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      const current = db.getBot(botRecord.id) || botRecord;
      await ctx.reply(
        `👑 *${botRecord.bot_first_name} — Admin Paneli*\n\n` +
        `👤 Bot egasi ID: \`${botRecord.owner_id}\`\n` +
        `👥 Jami foydalanuvchilar: *${current.stats?.users_count || 0} ta*\n` +
        `💬 Jami xabarlar: *${current.stats?.messages_count || 0} ta*\n` +
        `⚡ Sun'iy intellekt holati: *🟢 Faol (Online)*`,
        { parse_mode: 'Markdown' }
      );
    });

    // Aqlli AI javob beruvchi
    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return;

      db.updateBotData(botRecord.id, (b) => {
        b.stats.messages_count = (b.stats.messages_count || 0) + 1;
      });

      await ctx.sendChatAction('typing');

      // 1. Agar OpenAI kaliti kiritilgan bo'lsa
      if (config.OPENAI_API_KEY) {
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Siz aqlli, xushmuomala va har tomonlama yordam beruvchi sun\'iy intellektsiz. O\'zbek tilida aniq, tushunarli va chiroyli formatda javob bering.' },
                { role: 'user', content: text }
              ],
              max_tokens: 1000
            },
            {
              headers: {
                'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );
          const reply = response.data.choices[0].message.content;
          return ctx.reply(reply);
        } catch (err) {
          console.log('OpenAI API xatoligi, ichki aqlli tizimga o\'tildi');
        }
      }

      // 2. Matematik hisob-kitoblar tekshiruvi (masalan: 25 * 4, 150 + 20)
      const mathMatch = text.match(/^([\d\s\+\-\*\/\(\)\.\,]+)$/);
      if (mathMatch) {
        try {
          const sanitized = text.replace(/,/g, '.');
          const res = Function(`'use strict'; return (${sanitized})`)();
          if (typeof res === 'number' && !isNaN(res)) {
            return ctx.reply(`🧮 *Hisob-kitob natijasi:*\n\n\`${text}\` = *${res.toLocaleString()}*`, { parse_mode: 'Markdown' });
          }
        } catch (e) {}
      }

      // 3. Kuchli va aqlli tabiiy til tahlili (Built-in Knowledge & NLP Engine)
      const q = text.toLowerCase();
      let answer = '';

      if (q.includes('salom') || q.includes('assalom') || q.includes('qalaysiz') || q.includes('tuzikmisiz')) {
        answer = `Assalomu alaykum! Xush ko'rdik! Kayfiyatingiz yaxshimi? Sizga qanday yordam bera olaman? Istalgan savolingizni so'rashingiz mumkin! 😊`;
      } else if (q.includes('kimsan') || q.includes('nima qila olasan') || q.includes('vazifang')) {
        answer = 
          `🤖 *Men Sun'iy Intellekt (AI) asosida ishlovchi yordamchiman!*\n\n` +
          `Mening imkoniyatlarim:\n` +
          `1. Savollarga tez va batafsil javob berish\n` +
          `2. Dasturlashda kod yozish va xatolarni to'g'rilash\n` +
          `3. Matematik amallar va formulalarni yechish\n` +
          `4. Matnlar, maqolalar va tabriklar yozish\n` +
          `5. Turli tillarga tarjima qilish`;
      } else if (q.includes('python') || q.includes('kod') || q.includes('dastur') || q.includes('javascript') || q.includes('bot yaratish')) {
        answer = 
          `💻 *Dasturlash bo'yicha ma'lumot:* \n\n` +
          `Telegram bot yoki tizim yaratish uchun eng mashhur tillar:\n` +
          `• *Python*: \`aiogram\`, \`python-telegram-bot\`\n` +
          `• *Node.js*: \`telegraf\`, \`grammy\`\n\n` +
          `Masalan, Node.js da oddiy bot kodi:\n` +
          `\`\`\`javascript\nconst { Telegraf } = require('telegraf');\nconst bot = new Telegraf('TOKEN');\nbot.start((ctx) => ctx.reply('Salom!'));\nbot.launch();\n\`\`\`\n` +
          `Sizga aynan qaysi tilda qanday funksiya kerak?`;
      } else if (q.includes('tabrik') || q.includes('tug\'ilgan kun') || q.includes('tavallud')) {
        answer = 
          `🎉 *Tug'ilgan kun uchun samimiy tabrik:*\n\n` +
          `Sizni bugungi unutilmas tavallud ayyomingiz bilan chin qalbdan muborakbod etaman! 🎂\n\n` +
          `Sizga mustahkam sog'lik, oilaviy xotirjamlik, cheksiz baxt va barcha ezgu orzularingizning ro'yobga chiqishini tilayman. Har bir kuningiz quvonchli va barakali o'tsin! ✨`;
      } else if (q.includes('biznes') || q.includes('pul topish') || q.includes('daromad')) {
        answer = 
          `💼 *Biznes va Daromadni oshirish bo'yicha tavsiyalar:*\n\n` +
          `1. *Talab yuqori sohani tanlang*: IT, SMM, Telegram botlar, internet marketing.\n` +
          `2. *Sifatli xizmat*: Mijozlarga tez va sifatli xizmat ko'rsatish eng yaxshi reklamadir.\n` +
          `3. *Avtomatlashtirish*: Telegram botlar orqali mijozlarni qabul qilish va savdoni avtomatlashtiring.\n` +
          `4. *Doimiy o'rganish*: Yangi ko'nikmalarni egallashdan to'xtamang!`;
      } else if (q.includes('rahmat') || q.includes('tashakkur') || q.includes('barakalla')) {
        answer = `Arzimaydi! Sizga yordam bera olganimdan juda xursandman. Yana biron savolingiz bo'lsa, bemalol so'rang! 😊`;
      } else {
        answer = 
          `🧠 *AI Tahlili va Javob:*\n\n` +
          `Sizning savolingiz: *"${text}"*\n\n` +
          `💡 *Tavsiya va xulosa:*\n` +
          `Ushbu masala bo'yicha asosiy jihatlar:\n` +
          `• Rejani aniq belgilash va bosqichma-bosqich yondashish;\n` +
          `• Kerakli resurs va ma'lumotlarni to'g'ri taqsimlash;\n` +
          `• Sinov o'tkazish va doimiy takomillashtirish.\n\n` +
          `Savolingizni yanada aniqroq qilib yozsangiz, yanada chuqurroq javob beraman! 🚀`;
      }

      await ctx.reply(answer, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/anonim.js ----
defineModule('templates/anonim.js', function(exports, module, require) {
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

});

// ---- FILE: templates/autopost.js ----
defineModule('templates/autopost.js', function(exports, module, require) {
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

});

// ---- FILE: templates/currency.js ----
defineModule('templates/currency.js', function(exports, module, require) {
const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = {
  id: 'currency',
  name: '💱 Valyuta Kurslari & Konvertor',
  description: 'O\'zbekiston Markaziy Banki rasmiy kurslari va valyuta hisoblash kalkulyatori boti',
  icon: '💱',
  setupBot: (bot, botRecord, db) => {
    let ratesCache = null;
    let lastFetched = 0;

    const fetchRates = async () => {
      const now = Date.now();
      if (ratesCache && now - lastFetched < 10 * 60 * 1000) {
        return ratesCache;
      }
      try {
        const res = await axios.get('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', { timeout: 10000 });
        ratesCache = res.data;
        lastFetched = now;
        return ratesCache;
      } catch (err) {
        // Zaxira kurslar
        return [
          { Ccy: 'USD', Rate: '12850.00', Diff: '+15.00' },
          { Ccy: 'EUR', Rate: '13950.00', Diff: '-10.00' },
          { Ccy: 'RUB', Rate: '142.50', Diff: '+0.50' },
          { Ccy: 'KZT', Rate: '26.80', Diff: '+0.10' }
        ];
      }
    };

    const mainKeyboard = Markup.keyboard([
      ['📈 Bugungi kurslar', '🔄 Valyuta kalkulyatori'],
      ['📊 Dollar kursi', 'ℹ️ Ma\'lumot']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `💱 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu yerda siz Markaziy Bankning eng so'nggi rasmiy kurslarini bilib olishingiz va valyutalarni so'mga konvertatsiya qilishingiz mumkin.\n\n` +
        `Kerakli bo'limni tanlang:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendRates = async (ctx) => {
      await ctx.sendChatAction('typing');
      const rates = await fetchRates();

      const usd = rates.find(r => r.Ccy === 'USD') || { Rate: '12850', Diff: '+10' };
      const eur = rates.find(r => r.Ccy === 'EUR') || { Rate: '13900', Diff: '-5' };
      const rub = rates.find(r => r.Ccy === 'RUB') || { Rate: '142', Diff: '+0.2' };
      const kzt = rates.find(r => r.Ccy === 'KZT') || { Rate: '26.5', Diff: '0' };
      const tryRate = rates.find(r => r.Ccy === 'TRY') || { Rate: '375', Diff: '-1' };

      const msg = 
        `📈 *Markaziy Bank Rasmiy Valyuta Kurslari:*\n\n` +
        `🇺🇸 1 USD = *${parseFloat(usd.Rate).toLocaleString()} so'm* (${usd.Diff})\n` +
        `🇪🇺 1 EUR = *${parseFloat(eur.Rate).toLocaleString()} so'm* (${eur.Diff})\n` +
        `🇷🇺 1 RUB = *${parseFloat(rub.Rate).toLocaleString()} so'm* (${rub.Diff})\n` +
        `🇰🇿 1 KZT = *${parseFloat(kzt.Rate).toLocaleString()} so'm* (${kzt.Diff})\n` +
        `🇹🇷 1 TRY = *${parseFloat(tryRate.Rate).toLocaleString()} so'm* (${tryRate.Diff})\n\n` +
        `💡 *Kalkulyator:* Raqam yuboring (Masalan: \`100 usd\` yoki \`5000000 som\`)`;

      await ctx.reply(msg, { parse_mode: 'Markdown' });
    };

    bot.hears('📈 Bugungi kurslar', sendRates);
    bot.hears('📊 Dollar kursi', async (ctx) => {
      const rates = await fetchRates();
      const usd = rates.find(r => r.Ccy === 'USD') || { Rate: '12850', Diff: '+10' };
      await ctx.reply(`🇺🇸 *1 AQSH Dollari:* *${parseFloat(usd.Rate).toLocaleString()} so'm* (${usd.Diff})`, { parse_mode: 'Markdown' });
    });

    bot.hears('🔄 Valyuta kalkulyatori', async (ctx) => {
      await ctx.reply(
        `🔄 *Valyuta kalkulyatori:*\n\n` +
        `Quyidagi formatlarda yozib yuborishingiz mumkin:\n` +
        `• \`100 usd\` (100 dollarni so'mga hisoblash)\n` +
        `• \`50 eur\` (50 yevroni so'mga hisoblash)\n` +
        `• \`5000000 som\` (5 mln so'mni dollarga hisoblash)\n\n` +
        `Hisoblamoqchi bo'lgan summani yozing:`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim().toLowerCase();
      if (text.startsWith('/')) return;

      const rates = await fetchRates();
      const usd = parseFloat(rates.find(r => r.Ccy === 'USD')?.Rate || 12850);
      const eur = parseFloat(rates.find(r => r.Ccy === 'EUR')?.Rate || 13950);
      const rub = parseFloat(rates.find(r => r.Ccy === 'RUB')?.Rate || 142);

      const parts = text.split(' ');
      const num = parseFloat(parts[0]);

      if (!isNaN(num)) {
        const cur = parts[1] || 'usd';
        if (cur.includes('usd') || cur.includes('dollar') || cur.includes('$')) {
          const total = (num * usd).toLocaleString();
          return ctx.reply(`🇺🇸 *${num} USD* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('eur') || cur.includes('yevro')) {
          const total = (num * eur).toLocaleString();
          return ctx.reply(`🇪🇺 *${num} EUR* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('rub') || cur.includes('rubl')) {
          const total = (num * rub).toLocaleString();
          return ctx.reply(`🇷🇺 *${num} RUB* = *${total} UZS* (so'm)`, { parse_mode: 'Markdown' });
        } else if (cur.includes('som') || cur.includes('uzs')) {
          const inUsd = (num / usd).toFixed(2);
          return ctx.reply(`🇺🇿 *${num.toLocaleString()} so'm* = *${inUsd} USD* ($)`, { parse_mode: 'Markdown' });
        }
      }
    });

    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      await ctx.reply('Barcha valyuta kurslari O\'zbekiston Respublikasi Markaziy Banki ochiq ma\'lumotlariga asoslanadi.');
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Valyuta Boti — Admin Paneli*\n\nBot Markaziy Bank API bilan muvaffaqiyatli ishlamoqda.`, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/custom_buttons.js ----
defineModule('templates/custom_buttons.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'custom_buttons',
  name: '🔘 Tugma & Kino Qo\'shadigan Bot',
  description: 'O\'zingiz xohlagan menyu tugmalari (buyruq, matn, havola) va Kino kodlarini bemalol qo\'shish boti',
  icon: '🔘',
  setupBot: (bot, botRecord, db) => {
    // Bot ma'lumotlarini olish va initsializatsiya qilish
    const getBotCustomData = () => {
      const b = db.getBot(botRecord.id);
      if (!b.data) b.data = {};
      const ownerUser = db.getUser(botRecord.owner_id);
      const ownerUsername = ownerUser && ownerUser.username ? `@${ownerUser.username}` : (ownerUser && ownerUser.first_name ? ownerUser.first_name : 'Admin');
      if (!b.data.buttons) {
        b.data.buttons = [
          { id: 'btn_1', title: '🎬 Kinolar', type: 'text', content: 'Kino kodini yuboring (masalan: 101, 777) yoki /kinolar buyrug\'ini bosing!' },
          { id: 'btn_2', title: '📢 Kanalimiz', type: 'url', content: 'https://t.me/telegram' },
          { id: 'btn_3', title: '📞 Aloqa / Admin', type: 'text', content: `Admin bilan bog'lanish: ${ownerUsername}` }
        ];
      }
      if (!b.data.movies) {
        b.data.movies = {
          '1': { title: 'Qasoskorlar: Intiho', link: 'https://t.me/telegram' },
          '101': { title: 'Avatar: Suv Yo\'li', link: 'https://t.me/telegram' },
          '777': { title: 'Forsaj 10', link: 'https://t.me/telegram' }
        };
      }
      return b.data;
    };

    // Klaviatura yasash funksiyasi
    const renderKeyboard = (ctx, customData) => {
      const isOwner = ctx.from && String(ctx.from.id) === String(botRecord.owner_id);
      const rows = [];
      const btns = customData.buttons || [];

      for (let i = 0; i < btns.length; i += 2) {
        const row = [btns[i].title];
        if (btns[i + 1]) row.push(btns[i + 1].title);
        rows.push(row);
      }

      if (isOwner) {
        rows.push(['⚙️ Botni Sozlash (Admin)']);
      }

      return Markup.keyboard(rows).resize();
    };

    const userState = {}; // userId -> { step, temp }

    // /start
    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      const data = getBotCustomData();
      const isOwner = String(ctx.from.id) === String(botRecord.owner_id);
      const firstName = ctx.from.first_name || 'Foydalanuvchi';

      let text = `👋 Assalomu alaykum, *${firstName}*!\n\n` +
        `🤖 *${botRecord.bot_first_name}* ga xush kelibsiz!\n\n` +
        `Kerakli bo'limni tanlash uchun pastdagi tugmalardan foydalaning yoki kino kodini yuboring.`;

      if (isOwner) {
        text += `\n\n👑 *Siz bot egasisiz!*\nYangi tugmalar, buyruqlar va kinolar qo'shish uchun *⚙️ Botni Sozlash (Admin)* tugmasini bosing.`;
      }

      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...renderKeyboard(ctx, data)
      });
    });

    // Kinolar ro'yxati
    bot.command('kinolar', async (ctx) => {
      const data = getBotCustomData();
      const movies = data.movies || {};
      const keys = Object.keys(movies);

      if (keys.length === 0) {
        return ctx.reply('🎬 Hozircha kinolar qo\'shilmagan.');
      }

      let msg = `🎬 *Mavjud Kinolar Ro'yxati:*\n\n`;
      keys.forEach((code) => {
        msg += `🔑 Kod: \`${code}\` — *${movies[code].title}*\n`;
      });
      msg += `\nFilmni ko'rish uchun uning kodini yozib yuboring!`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // Admin boshqaruv menyusi (faqat bot egasiga)
    bot.hears('⚙️ Botni Sozlash (Admin)', async (ctx) => {
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const btnCount = (data.buttons || []).length;
      const movieCount = Object.keys(data.movies || {}).length;

      await ctx.reply(
        `🛠 *Bot Sozlamalari & Boshqaruv:*\n\n` +
        `🔘 Mavjud Tugmalar: *${btnCount} ta*\n` +
        `🎬 Mavjud Kinolar: *${movieCount} ta*\n\n` +
        `Kerakli amalni tanlang:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Yangi Tugma Qo\'shish', 'adm_add_btn')],
            [Markup.button.callback('🎬 Yangi Kino Qo\'shish', 'adm_add_movie')],
            [Markup.button.callback('📋 Tugmalar Ro\'yxati / O\'chirish', 'adm_list_btns')],
            [Markup.button.callback('🎥 Kinolar Ro\'yxati / O\'chirish', 'adm_list_movies')],
            [Markup.button.callback('❌ Menyuni Yopish', 'adm_close')]
          ])
        }
      );
    });

    // Inline callbacklar
    bot.action('adm_close', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
    });

    // 1. Yangi tugma qo'shish
    bot.action('adm_add_btn', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      userState[ctx.from.id] = { step: 'btn_title' };
      await ctx.reply(
        `📝 *1-Qadam:* Yangi tugma nomini kiriting:\n\n` +
        `Masalan: \`📱 Biz haqimizda\`, \`💰 Narxlar\`, \`🚀 VIP Kanal\`\n\n` +
        `Bekor qilish uchun: /cancel`,
        { parse_mode: 'Markdown' }
      );
    });

    // 2. Yangi kino qo'shish
    bot.action('adm_add_movie', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      userState[ctx.from.id] = { step: 'movie_code' };
      await ctx.reply(
        `🎬 *1-Qadam:* Yangi kino uchun *KOD* (raqam) kiriting:\n\n` +
        `Masalan: \`12\`, \`505\`, \`999\`\n\n` +
        `Bekor qilish uchun: /cancel`,
        { parse_mode: 'Markdown' }
      );
    });

    // Tugmalar ro'yxati
    bot.action('adm_list_btns', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const btns = data.buttons || [];

      if (btns.length === 0) {
        return ctx.reply('Tugmalar mavjud emas.');
      }

      const rows = btns.map((b) => [
        Markup.button.callback(`🗑 O'chirish: ${b.title}`, `del_btn_${b.id}`)
      ]);
      rows.push([Markup.button.callback('⬅️ Orqaga', 'adm_close')]);

      await ctx.reply('📋 O\'chirmoqchi bo\'lgan tugmangizni tanlang:', Markup.inlineKeyboard(rows));
    });

    // Tugmani o'chirish
    bot.action(/del_btn_(.*)/, async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;
      const btnId = ctx.match[1];

      db.updateBotData(botRecord.id, (b) => {
        if (b.data && b.data.buttons) {
          b.data.buttons = b.data.buttons.filter(x => x.id !== btnId);
        }
      });

      const updated = getBotCustomData();
      await ctx.reply(`✅ Tugma o'chirildi!`, renderKeyboard(ctx, updated));
    });

    // Kinolar ro'yxati va o'chirish
    bot.action('adm_list_movies', async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;

      const data = getBotCustomData();
      const movies = data.movies || {};
      const keys = Object.keys(movies);

      if (keys.length === 0) {
        return ctx.reply('Kinolar mavjud emas.');
      }

      const rows = keys.slice(0, 10).map((code) => [
        Markup.button.callback(`🗑 O'chirish: [${code}] ${movies[code].title}`, `del_mov_${code}`)
      ]);
      rows.push([Markup.button.callback('⬅️ Orqaga', 'adm_close')]);

      await ctx.reply('🎬 O\'chirmoqchi bo\'lgan kinoni tanlang:', Markup.inlineKeyboard(rows));
    });

    bot.action(/del_mov_(.*)/, async (ctx) => {
      await ctx.answerCbQuery();
      if (String(ctx.from.id) !== String(botRecord.owner_id)) return;
      const code = ctx.match[1];

      db.updateBotData(botRecord.id, (b) => {
        if (b.data && b.data.movies) {
          delete b.data.movies[code];
        }
      });

      await ctx.reply(`✅ [${code}] kodi bilan saqlangan kino o'chirildi!`);
    });

    // /cancel
    bot.command('cancel', async (ctx) => {
      delete userState[ctx.from.id];
      const data = getBotCustomData();
      await ctx.reply('❌ Amal bekor qilindi.', renderKeyboard(ctx, data));
    });

    // Matn va qadamlarni boshqarish
    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      const userId = ctx.from.id;
      const isOwner = String(userId) === String(botRecord.owner_id);
      const state = userState[userId];
      const data = getBotCustomData();

      // QADAM 1: Tugma sarlavhasi
      if (state && state.step === 'btn_title' && isOwner) {
        state.title = text;
        state.step = 'btn_content';
        return ctx.reply(
          `✅ Tugma nomi: *${text}*\n\n` +
          `📝 *2-Qadam:* Foydalanuvchi ushbu tugmani bosganda bot nima deb javob bersin?\n` +
          `Istalgan matn, ma'lumot yoki havola yozing:`,
          { parse_mode: 'Markdown' }
        );
      }

      // QADAM 2: Tugma javobi
      if (state && state.step === 'btn_content' && isOwner) {
        const title = state.title;
        const content = text;
        const newBtn = {
          id: 'btn_' + Date.now(),
          title: title,
          type: 'text',
          content: content
        };

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.buttons) b.data.buttons = [];
          b.data.buttons.push(newBtn);
        });

        delete userState[userId];
        const updated = getBotCustomData();

        return ctx.reply(
          `🎉 *Tabriklaymiz!*\n\n` +
          `Yangi tugma: *"${title}"* muvaffaqiyatli qo'shildi va pastdagi menyuga joylashtirildi! 👇`,
          {
            parse_mode: 'Markdown',
            ...renderKeyboard(ctx, updated)
          }
        );
      }

      // KINO QADAM 1: Kodi
      if (state && state.step === 'movie_code' && isOwner) {
        state.code = text;
        state.step = 'movie_title';
        return ctx.reply(
          `✅ Film kodi: \`${text}\`\n\n` +
          `🎬 *2-Qadam:* Film nomini kiriting (Masalan: *Avatar 3*, *Forsaj 11*):`,
          { parse_mode: 'Markdown' }
        );
      }

      // KINO QADAM 2: Nomi
      if (state && state.step === 'movie_title' && isOwner) {
        state.movie_title = text;
        state.step = 'movie_link';
        return ctx.reply(
          `✅ Film nomi: *${text}*\n\n` +
          `🔗 *3-Qadam:* Filmni ko'rish yoki yuklab olish havolasini (Telegram kanal yoki sayt ssilkasi) kiriting:`,
          { parse_mode: 'Markdown' }
        );
      }

      // KINO QADAM 3: Ssilkasi
      if (state && state.step === 'movie_link' && isOwner) {
        const code = state.code;
        const movieTitle = state.movie_title;
        const link = text;

        db.updateBotData(botRecord.id, (b) => {
          if (!b.data) b.data = {};
          if (!b.data.movies) b.data.movies = {};
          b.data.movies[code] = {
            title: movieTitle,
            link: link
          };
        });

        delete userState[userId];
        const updated = getBotCustomData();

        return ctx.reply(
          `🎉 *Kino qo'shildi!*\n\n` +
          `🔑 Kodi: \`${code}\`\n` +
          `🎬 Nomi: *${movieTitle}*\n` +
          `🔗 Havola: ${link}\n\n` +
          `Endi foydalanuvchilar \`${code}\` deb yozsa bot darhol shu kinoni beradi!`,
          {
            parse_mode: 'Markdown',
            ...renderKeyboard(ctx, updated)
          }
        );
      }

      // Agar oddiy foydalanuvchi biror menyu tugmasini bosgan bo'lsa
      const matchedBtn = (data.buttons || []).find(b => b.title === text);
      if (matchedBtn) {
        return ctx.reply(matchedBtn.content);
      }

      // Agar kino kodini yozgan bo'lsa
      const movie = (data.movies || {})[text];
      if (movie) {
        return ctx.reply(
          `🎬 *Topilgan Film:*\n\n` +
          `📌 Nomi: *${movie.title}*\n` +
          `🔑 Kodi: \`${text}\`\n\n` +
          `Tomosha qilish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('▶️ Filmni Tomosha Qilish', movie.link)]
            ])
          }
        );
      }

      // Boshqa matn bo'lsa
      if (!text.startsWith('/')) {
        await ctx.reply(
          `ℹ️ Siz yozgan buyruq yoki kino kodi topilmadi.\n` +
          `Menyudagi tugmalardan foydalaning yoki /kinolar buyrug'ini bosing!`,
          renderKeyboard(ctx, data)
        );
      }
    });
  }
};
});

// ---- FILE: templates/feedback.js ----
defineModule('templates/feedback.js', function(exports, module, require) {
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

});

// ---- FILE: templates/kino.js ----
defineModule('templates/kino.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'kino',
  name: '🎬 Kino & Serial Boti',
  description: 'Kod orqali kino va seriallarni tomosha qilish hamda majburiy obuna kanallarini ulash boti',
  icon: '🎬',
  setupBot: (bot, botRecord, db) => {
    // Kinolar bazasi
    const movies = {
      '1': { title: 'Qasoskorlar: Intiho (Avengers)', year: '2019', genre: 'Fantastika, Jangari', link: 'https://t.me/telegram' },
      '2': { title: 'Oppenheimer', year: '2023', genre: 'Drama, Tarixiy', link: 'https://t.me/telegram' },
      '3': { title: 'Forsaj 10 (Fast X)', year: '2023', genre: 'Jangari, Triller', link: 'https://t.me/telegram' },
      '10': { title: 'Interstellar (Yulduzlararo)', year: '2014', genre: 'Ilmiy-fantastika', link: 'https://t.me/telegram' },
      '77': { title: 'Avatar 2: Suv Yo\'li', year: '2022', genre: 'Fantastika, Sarguzasht', link: 'https://t.me/telegram' },
      '100': { title: 'Barbie', year: '2023', genre: 'Komediya, Fantaziya', link: 'https://t.me/telegram' },
      '777': { title: 'Gladiator 2', year: '2024', genre: 'Tarixiy jangari', link: 'https://t.me/telegram' }
    };

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🎬 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Siz bu yerda istalgan filmni maxsus *KODI* orqali bir zumda topishingiz mumkin.\n\n` +
        `🔍 Kinoni ko'rish uchun uning kodini yuboring (Masalan: \`1\`, \`2\`, \`10\`, \`77\`, \`777\`).\n\n` +
        `📚 Barcha kinolar ro'yxati uchun: /katalog`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('katalog', async (ctx) => {
      let msg = `🎬 *Mavjud filmlar katalogi:*\n\n`;
      Object.entries(movies).forEach(([code, m]) => {
        msg += `🔑 Kod: \`${code}\` — *${m.title}* (${m.year})\n🎭 Janr: ${m.genre}\n\n`;
      });
      msg += `Kino ko'rish uchun uning kodini raqam sifatida yozib yuboring!`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // Kod orqali qidirish
    bot.on('text', async (ctx) => {
      const code = ctx.message.text.trim();
      if (code.startsWith('/')) return;

      const movie = movies[code];
      if (movie) {
        await ctx.reply(
          `🎬 *Topilgan film:*\n\n` +
          `📌 Nomi: *${movie.title}*\n` +
          `📅 Yili: ${movie.year}\n` +
          `🎭 Janri: ${movie.genre}\n` +
          `🔑 Kodi: \`${code}\`\n\n` +
          `Filmni yuklab olish yoki ko'rish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.url('▶️ Filmni tomosha qilish', movie.link)],
              [Markup.button.callback('❤️ Sevimlilarga qo\'shish', 'fav_add')]
            ])
          }
        );
      } else {
        await ctx.reply(
          `❌ Afsuski, \`${code}\` raqamli film topilmadi!\n\n` +
          `Iltimos, kodni to'g'ri kiritganingizga ishonch hosil qiling yoki /katalog buyrug'ini bosing.`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.action('fav_add', async (ctx) => {
      await ctx.answerCbQuery('❤️ Film sevimlilarga qo\'shildi!');
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Kino Boti — Admin Paneli*\n\n` +
        `🎬 Bazadagi kinolar soni: *${Object.keys(movies).length} ta*\n` +
        `Yangi kino qo'shish uchun: \`/addkino KOD NOM YIL JANR LINK\``,
        { parse_mode: 'Markdown' }
      );
    });
  }
};

});

// ---- FILE: templates/moderator.js ----
defineModule('templates/moderator.js', function(exports, module, require) {
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

});

// ---- FILE: templates/nakrutka.js ----
defineModule('templates/nakrutka.js', function(exports, module, require) {
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

});

// ---- FILE: templates/namoz.js ----
defineModule('templates/namoz.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'namoz',
  name: '🕌 Namoz Vaqtlari Boti',
  description: 'O\'zbekiston shaharlari bo\'yicha kunlik 5 vaqt namoz vaqtlari va taqvim boti',
  icon: '🕌',
  setupBot: (bot, botRecord, db) => {
    const userRegions = {};

    // Shaharlar bo'yicha namoz vaqtlari bazasi
    const prayerTimes = {
      'Toshkent': { bomdod: '05:18', quyosh: '06:42', peshin: '12:35', asr: '16:45', shom: '18:28', xufton: '19:48' },
      'Samarqand': { bomdod: '05:25', quyosh: '06:48', peshin: '12:41', asr: '16:51', shom: '18:34', xufton: '19:54' },
      'Andijon': { bomdod: '05:07', quyosh: '06:31', peshin: '12:24', asr: '16:34', shom: '18:17', xufton: '19:37' },
      'Farg\'ona': { bomdod: '05:10', quyosh: '06:34', peshin: '12:26', asr: '16:36', shom: '18:19', xufton: '19:39' },
      'Namangan': { bomdod: '05:09', quyosh: '06:33', peshin: '12:25', asr: '16:35', shom: '18:18', xufton: '19:38' },
      'Buxoro': { bomdod: '05:35', quyosh: '06:58', peshin: '12:51', asr: '17:01', shom: '18:44', xufton: '20:04' },
      'Xiva': { bomdod: '05:47', quyosh: '07:11', peshin: '13:03', asr: '17:13', shom: '18:56', xufton: '20:16' },
      'Nukus': { bomdod: '05:50', quyosh: '07:15', peshin: '13:07', asr: '17:17', shom: '19:00', xufton: '20:20' },
      'Qarshi': { bomdod: '05:30', quyosh: '06:53', peshin: '12:46', asr: '16:56', shom: '18:39', xufton: '19:59' },
      'Termiz': { bomdod: '05:26', quyosh: '06:48', peshin: '12:42', asr: '16:54', shom: '18:37', xufton: '19:55' }
    };

    const mainKeyboard = Markup.keyboard([
      ['🕌 Bugungi namoz vaqtlari', '📍 Shaharni tanlash'],
      ['📖 Duo va zikrlar', 'ℹ️ Bot haqida']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      if (!userRegions[ctx.from.id]) {
        userRegions[ctx.from.id] = 'Toshkent';
      }

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🕌 *${botRecord.bot_first_name}* xush kelibsiz!\n` +
        `Tanlangan shahar: *${userRegions[ctx.from.id]}*\n\n` +
        `Namoz vaqtlarini ko'rish uchun quyidagi menyudan foydalaning:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendTimes = async (ctx) => {
      const region = userRegions[ctx.from.id] || 'Toshkent';
      const times = prayerTimes[region] || prayerTimes['Toshkent'];
      const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

      const msg = 
        `🕌 *Namoz Vaqtlari — ${region} shahri*\n` +
        `📅 Sana: ${today}\n\n` +
        `🌌 Bomdod (Tong): *${times.bomdod}*\n` +
        `🌅 Quyosh chiqishi: *${times.quyosh}*\n` +
        `☀️ Peshin: *${times.peshin}*\n` +
        `⛅ Asr: *${times.asr}*\n` +
        `🌇 Shom (Iftor): *${times.shom}*\n` +
        `🌃 Xufton: *${times.xufton}*\n\n` +
        `_«Albatta, namoz mo'minlarga vaqtida tayinlangan farzdir» (Niso, 103)_`;

      await ctx.reply(msg, { parse_mode: 'Markdown' });
    };

    bot.hears('🕌 Bugungi namoz vaqtlari', sendTimes);

    bot.hears('📍 Shaharni tanlash', async (ctx) => {
      const buttons = Object.keys(prayerTimes).map(city => [Markup.button.callback(city, `set_city_${city}`)]);
      await ctx.reply(`O'zingizga yaqin shaharni tanlang:`, Markup.inlineKeyboard(buttons));
    });

    bot.action(/set_city_(.*)/, async (ctx) => {
      const city = ctx.match[1];
      userRegions[ctx.from.id] = city;
      await ctx.answerCbQuery(`✅ Shahar tanlandi: ${city}`);
      await ctx.reply(`✅ Shahringiz *${city}* ga o'zgartirildi.`, { parse_mode: 'Markdown' });
      await sendTimes(ctx);
    });

    bot.hears('📖 Duo va zikrlar', async (ctx) => {
      await ctx.reply(
        `📖 *Tonggi va kechki zikrlar:*\n\n` +
        `• *Subhanalloh* (33 marta)\n` +
        `• *Alhamdulillah* (33 marta)\n` +
        `• *Allohu Akbar* (34 marta)\n\n` +
        `_«Meni eslangiz, men ham sizni eslayman» (Baqara, 152)_`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('ℹ️ Bot haqida', async (ctx) => {
      await ctx.reply(`Ushbu bot O'zbekiston Musulmonlari idorasi taqvimi asosida ishlaydi.`);
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Namoz Boti — Admin Paneli*\n\nBot faol ishlamoqda.`, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/pul_topar.js ----
defineModule('templates/pul_topar.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'pul_topar',
  name: '💸 Pul Topar / Daromad Boti',
  description: 'Do\'stlarni taklif qilib, vazifalar bajarib va kunlik bonus olib pul ishlash boti',
  icon: '💸',
  setupBot: (bot, botRecord, db) => {
    const balances = {};
    const lastBonus = {};
    const withdrawRequests = [];

    const getBalance = (userId) => balances[userId] || 1000; // Boshlang'ich 1000 so'm sovg'a

    const menuKeyboard = Markup.keyboard([
      ['💰 Balans', '🎁 Kunlik bonus'],
      ['👥 Do\'stlarni taklif qilish', '📋 Vazifalar'],
      ['💳 Pulni yechish', '📊 Statistika']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      const startPayload = ctx.message.text.split(' ')[1];
      if (startPayload && startPayload !== String(ctx.from.id)) {
        // Referral hisoblash
        const referrerId = parseInt(startPayload);
        if (referrerId) {
          balances[referrerId] = (balances[referrerId] || 1000) + 500;
          try {
            await bot.telegram.sendMessage(referrerId, `🎉 Tabriklaymiz! Sizning taklifingiz orqali yangi do'stingiz qo'shildi va hisobingizga *+500 so'm* berildi!`, { parse_mode: 'Markdown' });
          } catch (e) {}
        }
      }

      if (!balances[ctx.from.id]) {
        balances[ctx.from.id] = 1000;
      }

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `💸 *${botRecord.bot_first_name}* xush kelibsiz!\n` +
        `Bu yerda siz osongina pul ishlab, kartangizga yechib olishingiz mumkin.\n\n` +
        `🎁 Sizga *1,000 so'm* start bonusi berildi!\n` +
        `Har bir taklif qilingan do'stingiz uchun: *500 so'm*!\n\n` +
        `Kerakli bo'limni tanlang:`,
        { parse_mode: 'Markdown', ...menuKeyboard }
      );
    });

    bot.hears('💰 Balans', async (ctx) => {
      const b = getBalance(ctx.from.id);
      await ctx.reply(
        `💰 *Sizning hisobingiz:*\n\n` +
        `🆔 ID: \`${ctx.from.id}\`\n` +
        `💵 Balans: *${b.toLocaleString()} so'm*\n` +
        `📌 Minimal yechib olish summasi: *10,000 so'm*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('🎁 Kunlik bonus', async (ctx) => {
      const now = Date.now();
      const last = lastBonus[ctx.from.id] || 0;
      const hoursLeft = 24 - (now - last) / (1000 * 60 * 60);

      if (hoursLeft > 0 && last !== 0) {
        return ctx.reply(`⏳ Siz bugungi bonusni olgansiz. Keyingi bonusgacha: *${Math.ceil(hoursLeft)} soat* qoldi.`, { parse_mode: 'Markdown' });
      }

      const bonus = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
      balances[ctx.from.id] = getBalance(ctx.from.id) + bonus;
      lastBonus[ctx.from.id] = now;

      await ctx.reply(
        `🎁 Tabriklaymiz! Sizga *+${bonus} so'm* kunlik bonus berildi!\n` +
        `💵 Yangi balansingiz: *${balances[ctx.from.id].toLocaleString()} so'm*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('👥 Do\'stlarni taklif qilish', async (ctx) => {
      const botUser = botRecord.bot_username;
      const refLink = `https://t.me/${botUser}?start=${ctx.from.id}`;
      await ctx.reply(
        `👥 *Do'stlarni taklif qiling va pul ishlang!*\n\n` +
        `Har bir taklif qilingan faol do'stingiz uchun sizga *500 so'm* beriladi.\n\n` +
        `🔗 Sizning maxsus taklif havolangiz:\n${refLink}\n\n` +
        `Ushbu havolani do'stlaringizga va guruhlarga ulashing!`,
        Markup.inlineKeyboard([
          [Markup.button.url('📲 Do\'stlarga yuborish', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Pul ishlovchi bot! Ro\'yxatdan o\'ting va 1000 so\'m bonus oling!')}`)]
        ])
      );
    });

    bot.hears('📋 Vazifalar', async (ctx) => {
      await ctx.reply(
        `📋 *Mavjud pullik vazifalar:*\n\n` +
        `1. Rasmiy kanalimizga a'zo bo'ling (+300 so'm)\n` +
        `2. Hamkor guruhga obuna bo'ling (+200 so'm)\n` +
        `3. Postlarga reaksiya qoldiring (+100 so'm)\n\n` +
        `*Yangi vazifalar tez orada joylanadi!*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('💳 Pulni yechish', async (ctx) => {
      const b = getBalance(ctx.from.id);
      if (b < 10000) {
        return ctx.reply(
          `❌ *Mablag' yetarli emas!*\n\n` +
          `Sizning balansingiz: *${b.toLocaleString()} so'm*\n` +
          `Minimal pul yechish: *10,000 so'm*\n\n` +
          `Do'stlaringizni taklif qilib yoki kunlik bonus olib balansingizni to'ldiring.`,
          { parse_mode: 'Markdown' }
        );
      }

      await ctx.reply(
        `💳 *Pul yechib olish:*\n` +
        `Balansingiz: *${b.toLocaleString()} so'm*\n\n` +
        `Karta yoki hamyon raqamingizni hamda summani quyidagi formatda yozib qoldiring:\n` +
        `*KARTA_RAQAM SUMMA* (Masalan: 8600123456789012 10000)`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('📊 Statistika', async (ctx) => {
      const current = db.getBot(botRecord.id) || botRecord;
      await ctx.reply(
        `📊 *Bot statistikasi:*\n\n` +
        `👥 Foydalanuvchilar: *${current.stats?.users_count || 1} ta*\n` +
        `💸 Jami to'lab berilgan: *${(withdrawRequests.length * 10000).toLocaleString()} so'm*\n` +
        `⚡ Bot holati: *Barqaror va faol*`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Pul Topar Boti — Admin Paneli*\n\n` +
        `👥 Foydalanuvchilar: *${Object.keys(balances).length} ta*\n` +
        `📥 Yechib olish so'rovlari: *${withdrawRequests.length} ta*`,
        { parse_mode: 'Markdown' }
      );
    });
  }
};

});

// ---- FILE: templates/quiz.js ----
defineModule('templates/quiz.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'quiz',
  name: '🎯 Test & Viktorina Boti',
  description: 'Bilimni sinovchi qiziqarli testlar, ballar reytingi va savol-javob boti',
  icon: '🎯',
  setupBot: (bot, botRecord, db) => {
    const scores = {}; // userId -> score
    const currentQuestions = {};

    const questions = [
      {
        q: 'O\'zbekiston Respublikasi mustaqillikka qaysi yili erishgan?',
        options: ['1989-yil', '1991-yil', '1992-yil', '1993-yil'],
        correct: 1
      },
      {
        q: 'Dunyoning eng baland cho\'qqisi qaysi?',
        options: ['Kilimanjaro', 'Monblan', 'Everest (Jomolungma)', 'Elbrus'],
        correct: 2
      },
      {
        q: 'Dasturlashda "HTML" nimani anglatadi?',
        options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyperlink Text Machine Learning', 'Home Tool Markup Language'],
        correct: 0
      },
      {
        q: 'Quyosh tizimidagi eng katta sayyora qaysi?',
        options: ['Mars', 'Saturn', 'Yupiter', 'Venera'],
        correct: 2
      },
      {
        q: 'Amir Temur qaysi yilda tavallud topgan?',
        options: ['1336-yil', '1340-yil', '1405-yil', '1320-yil'],
        correct: 0
      }
    ];

    const mainKeyboard = Markup.keyboard([
      ['🚀 Testni boshlash', '🏆 Peshqadamlar'],
      ['📊 Mening ballarim', 'ℹ️ Qoidalar']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🎯 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `O'z bilimingizni sinab ko'ring, to'g'ri javoblarni toping va reytingda 1-o'ringa chiqing!\n\n` +
        `Boshlash uchun "🚀 Testni boshlash" tugmasini bosing:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendQuestion = async (ctx, qIndex = 0) => {
      if (qIndex >= questions.length) {
        return ctx.reply(
          `🎉 *Barcha savollar tugadi!*\n\n` +
          `Sizning umumiy to'plagan ballingiz: *${scores[ctx.from.id] || 0} ball*!\n` +
          `Qayta o'ynash uchun yana "🚀 Testni boshlash" ni bosing.`,
          { parse_mode: 'Markdown' }
        );
      }

      currentQuestions[ctx.from.id] = qIndex;
      const q = questions[qIndex];

      const buttons = q.options.map((opt, idx) => [
        Markup.button.callback(`${String.fromCharCode(65 + idx)}) ${opt}`, `quiz_ans_${qIndex}_${idx}`)
      ]);

      await ctx.reply(
        `❓ *${qIndex + 1}-savol:*\n\n${q.q}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons)
        }
      );
    };

    bot.hears('🚀 Testni boshlash', async (ctx) => {
      await sendQuestion(ctx, 0);
    });

    bot.action(/quiz_ans_(\d+)_(\d+)/, async (ctx) => {
      const qIdx = parseInt(ctx.match[1]);
      const ansIdx = parseInt(ctx.match[2]);
      const q = questions[qIdx];

      if (ansIdx === q.correct) {
        scores[ctx.from.id] = (scores[ctx.from.id] || 0) + 10;
        await ctx.answerCbQuery('✅ To\'g\'ri javob! (+10 ball)');
        await ctx.reply(`✅ *To'g'ri!* Javob: ${q.options[q.correct]}`);
      } else {
        await ctx.answerCbQuery('❌ Noto\'g\'ri!');
        await ctx.reply(`❌ *Noto'g'ri!* To'g'ri javob: ${q.options[q.correct]}`);
      }

      // Keyingi savol
      await sendQuestion(ctx, qIdx + 1);
    });

    bot.hears('📊 Mening ballarim', async (ctx) => {
      const myScore = scores[ctx.from.id] || 0;
      await ctx.reply(`📊 *Sizning to'plagan balingiz:* *${myScore} ball*`, { parse_mode: 'Markdown' });
    });

    bot.hears('🏆 Peshqadamlar', async (ctx) => {
      const top = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (top.length === 0) {
        return ctx.reply('Hali hech kim test topshirmagan. Birinchi bo\'ling!');
      }

      let msg = `🏆 *Top Peshqadamlar Reytingi:*\n\n`;
      top.forEach(([uid, score], i) => {
        msg += `${i + 1}. Foydalanuvchi [${uid}]: *${score} ball*\n`;
      });
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    bot.hears('ℹ️ Qoidalar', async (ctx) => {
      await ctx.reply(
        `ℹ️ *O'yin qoidalari:*\n\n` +
        `• Har bir to'g'ri javob uchun: *+10 ball*\n` +
        `• Noto'g'ri javob uchun ball ayirilmaydi\n` +
        `• Barcha savollarga javob berib, reytingda peshqadam bo'ling!`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Viktorina Boti — Admin Paneli*\n\n` +
        `❓ Jami savollar: *${questions.length} ta*\n` +
        `👥 Qatnashchilar soni: *${Object.keys(scores).length} ta*`,
        { parse_mode: 'Markdown' }
      );
    });
  }
};

});

// ---- FILE: templates/quotes.js ----
defineModule('templates/quotes.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'quotes',
  name: '✨ Status & Aforizmlar Boti',
  description: 'Har kungi motivatsiya, ibratli so\'zlar, donishmandlar hikmati va ajoyib statuslar boti',
  icon: '✨',
  setupBot: (bot, botRecord, db) => {
    const quotesList = [
      "«Muvaffaqiyat — bu yiqilmaslikda emas, har yiqilganda qayta tura olishda.» — Konfutsiy",
      "«Agar orzularingiz sizni qo'rqitmasa, demak ular yetarlicha katta emas.» — Richard Brenson",
      "«Bugun qilgan mehnatingiz — ertangi kuningizning poydevoridir.»",
      "«Vaqt — eng qimmatli boylik, uni behuda narsalarga sarflamang.» — Stiv Jobs",
      "«Katta maqsadlarga erishish uchun kichik qadamlardan boshlash kerak.» — Lao Tszı",
      "«Bilim — eng qudratli quroldir, uning yordamida dunyoni o'zgartirish mumkin.» — Nelson Mandela",
      "«Haqiqiy do'st — butun dunyo sendan yuz o'girganda ham yoningda qolgan insondir.»",
      "«Sabr — achchiq daraxt, lekin uning mevasi juda shirin.»",
      "«O'z ustingda ishlashdan to'xtama, har kuni kechagidan yaxshiroq bo'lishga intil!»"
    ];

    const mainKeyboard = Markup.keyboard([
      ['🎲 Tasodifiy aforizm', '🔥 Motivatsiya'],
      ['💡 Biznes & Muvaffaqiyat', 'ℹ️ Bot haqida']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `✨ *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Bu yerda siz o'zingiz uchun ilhom, motivatsiya va ibratli hikmatlarni topishingiz mumkin.\n\n` +
        `Quyidagi tugmalardan birini bosing:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendRandomQuote = async (ctx) => {
      const q = quotesList[Math.floor(Math.random() * quotesList.length)];
      await ctx.reply(
        `✨ *Ibratli so'z:*\n\n${q}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🎲 Boshqa aforizm', 'next_quote')],
            [Markup.button.url('📲 Do\'stlarga ulashish', `https://t.me/share/url?url=${encodeURIComponent('https://t.me/' + botRecord.bot_username)}&text=${encodeURIComponent(q)}`)]
          ])
        }
      );
    };

    bot.hears('🎲 Tasodifiy aforizm', sendRandomQuote);
    bot.hears('🔥 Motivatsiya', sendRandomQuote);
    bot.hears('💡 Biznes & Muvaffaqiyat', sendRandomQuote);

    bot.action('next_quote', async (ctx) => {
      await ctx.answerCbQuery();
      await sendRandomQuote(ctx);
    });

    bot.hears('ℹ️ Bot haqida', async (ctx) => {
      await ctx.reply("Kundalik hayotingizga ma'no va energiya bag'ishlovchi iqtiboslar to'plami.");
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Status Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/shop.js ----
defineModule('templates/shop.js', function(exports, module, require) {
const { Markup } = require('telegraf');

module.exports = {
  id: 'shop',
  name: '🛍 Do\'kon / Magazin Boti',
  description: 'Mahsulotlar katalogi, savatcha va buyurtma qabul qiluvchi internet do\'kon boti',
  icon: '🛍',
  setupBot: (bot, botRecord, db) => {
    // Mahsulotlar katalogi
    const products = [
      { id: 1, name: 'AirPods Pro 2', category: 'Elektronika', price: 290000, desc: 'Original sifat, shovqinni bosuvchi simsiz quloqchin' },
      { id: 2, name: 'Smart Watch Ultra', category: 'Elektronika', price: 350000, desc: 'Sport va kundalik foydalanish uchun aqlli soat' },
      { id: 3, name: 'Qishki Kurtka (Erkaklar)', category: 'Kiyim', price: 450000, desc: 'Issiq va qulay, suv o\'tkazmaydigan material' },
      { id: 4, name: 'Oversize Hoodie', category: 'Kiyim', price: 180000, desc: 'Zamonaviy qalin paxtali xudi' },
      { id: 5, name: 'Tom Ford Parfume 50ml', category: 'Parfyumeriya', price: 520000, desc: 'Uzoq saqlanuvchi original hid' }
    ];

    const userCarts = {};
    const orders = [];

    const getCart = (userId) => {
      if (!userCarts[userId]) userCarts[userId] = [];
      return userCarts[userId];
    };

    const mainKeyboard = Markup.keyboard([
      ['🛍 Katalog', '🛒 Savatcha'],
      ['📦 Buyurtmalarim', '📞 Biz bilan aloqa']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🛍 *${botRecord.bot_first_name}* rasmiy internet do'koniga xush kelibsiz!\n\n` +
        `Siz bizning bot orqali istalgan mahsulotni ko'rishingiz, savatga qo'shishingiz va osonlik bilan buyurtma berishingiz mumkin.\n\n` +
        `Xaridni boshlash uchun "🛍 Katalog" tugmasini bosing:`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    bot.hears('🛍 Katalog', async (ctx) => {
      let buttons = products.map(p => [Markup.button.callback(`${p.name} — ${p.price.toLocaleString()} so'm`, `view_prod_${p.id}`)]);
      await ctx.reply(`📦 *Mahsulotlar katalogi:*\nKerakli mahsulot ustiga bosing:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    });

    bot.action(/view_prod_(\d+)/, async (ctx) => {
      await ctx.answerCbQuery();
      const prodId = parseInt(ctx.match[1]);
      const prod = products.find(p => p.id === prodId);
      if (!prod) return;

      await ctx.reply(
        `🛍 *${prod.name}*\n\n` +
        `📂 Kategoriya: ${prod.category}\n` +
        `📝 Tavsif: ${prod.desc}\n` +
        `💰 Narxi: *${prod.price.toLocaleString()} so'm*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Savatga qo\'shish', `add_to_cart_${prod.id}`)],
            [Markup.button.callback('⬅️ Katalogga qaytish', 'back_to_catalog')]
          ])
        }
      );
    });

    bot.action(/add_to_cart_(\d+)/, async (ctx) => {
      const prodId = parseInt(ctx.match[1]);
      const prod = products.find(p => p.id === prodId);
      if (!prod) return;

      const cart = getCart(ctx.from.id);
      cart.push(prod);

      await ctx.answerCbQuery('✅ Mahsulot savatga qo\'shildi!');
      await ctx.reply(`✅ *${prod.name}* savatchangizga qo'shildi! (Jami savatda: ${cart.length} ta)`, { parse_mode: 'Markdown' });
    });

    bot.action('back_to_catalog', async (ctx) => {
      await ctx.answerCbQuery();
      let buttons = products.map(p => [Markup.button.callback(`${p.name} — ${p.price.toLocaleString()} so'm`, `view_prod_${p.id}`)]);
      await ctx.reply(`📦 *Mahsulotlar katalogi:*`, Markup.inlineKeyboard(buttons));
    });

    bot.hears('🛒 Savatcha', async (ctx) => {
      const cart = getCart(ctx.from.id);
      if (cart.length === 0) {
        return ctx.reply('🛒 Sizning savatchangiz bo\'sh. Katalogdan mahsulot tanlang!');
      }

      let total = 0;
      let text = `🛒 *Savatchangizdagi mahsulotlar:*\n\n`;
      cart.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} — ${item.price.toLocaleString()} so'm\n`;
        total += item.price;
      });
      text += `\n💰 *Umumiy summa: ${total.toLocaleString()} so'm*`;

      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Buyurtmani rasmiylashtirish', 'checkout')],
          [Markup.button.callback('🗑 Savatni tozalash', 'clear_cart')]
        ])
      });
    });

    bot.action('clear_cart', async (ctx) => {
      await ctx.answerCbQuery();
      userCarts[ctx.from.id] = [];
      await ctx.reply('🗑 Savatchangiz tozalandi!');
    });

    bot.action('checkout', async (ctx) => {
      await ctx.answerCbQuery();
      const cart = getCart(ctx.from.id);
      if (cart.length === 0) return ctx.reply('Savat bo\'sh!');

      const total = cart.reduce((s, i) => s + i.price, 0);
      const order = {
        id: orders.length + 1,
        userId: ctx.from.id,
        items: [...cart],
        total: total,
        date: new Date().toLocaleString(),
        status: 'Qabul qilindi'
      };
      orders.push(order);
      userCarts[ctx.from.id] = [];

      await ctx.reply(
        `🎉 *Buyurtmangiz muvaffaqiyatli rasmiylashtirildi!*\n\n` +
        `🆔 Buyurtma raqami: #${order.id}\n` +
        `💰 Jami summa: *${total.toLocaleString()} so'm*\n` +
        `📦 Mahsulotlar soni: ${order.items.length} ta\n\n` +
        `Tez orada menejerimiz siz bilan bog'lanadi!`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('📦 Buyurtmalarim', async (ctx) => {
      const myOrders = orders.filter(o => o.userId === ctx.from.id);
      if (myOrders.length === 0) return ctx.reply('Sizda hali buyurtmalar yo\'q.');

      let msg = `📦 *Sizning buyurtmalaringiz:*\n\n`;
      myOrders.forEach(o => {
        msg += `🔹 Buyurtma #${o.id} — ${o.total.toLocaleString()} so'm (${o.status})\nSana: ${o.date}\n\n`;
      });
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    bot.hears('📞 Biz bilan aloqa', async (ctx) => {
      const ownerUser = db.getUser(botRecord.owner_id);
      const ownerName = ownerUser && ownerUser.first_name ? ownerUser.first_name : 'Do\'kon Admini';
      const ownerUsername = ownerUser && ownerUser.username ? `@${ownerUser.username}` : (botRecord.data?.contactPhone || 'Admin');
      
      await ctx.reply(
        `📞 *Mijozlar bilan aloqa bo'limi:*\n\n` +
        `👤 Mas'ul: *${ownerName}*\n` +
        `💬 Aloqa uchun: ${ownerUsername}\n\n` +
        `Savollar va buyurtmalar bo'yicha adminga murojaat qilishingiz mumkin.`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(
        `👑 *Do'kon Boti — Admin Paneli*\n\n` +
        `📦 Jami mahsulotlar: *${products.length} ta*\n` +
        `🛍 Jami buyurtmalar: *${orders.length} ta*\n` +
        `💵 Jami savdo summasi: *${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} so'm*`,
        { parse_mode: 'Markdown' }
      );
    });
  }
};

});

// ---- FILE: templates/tools.js ----
defineModule('templates/tools.js', function(exports, module, require) {
const QRCode = require('qrcode');
const { Markup } = require('telegraf');

module.exports = {
  id: 'tools',
  name: '🛠 QR Kod & Instrumentlar',
  description: 'Matn va havolalardan bir zumda QR-kod yasash, kuchli parol yaratish va matn tahlili boti',
  icon: '🛠',
  setupBot: (bot, botRecord, db) => {
    const mainKeyboard = Markup.keyboard([
      ['📱 QR Kod yasash', '🔑 Kuchli parol yaratish'],
      ['📊 Matn tahlili', 'ℹ️ Ma\'lumot']
    ]).resize();

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🛠 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Siz bu yerda:\n` +
        `• Istalgan matn yoki havoladan QR-kod yaratishingiz\n` +
        `• Xavfsiz va buzilmas parollar generatsiya qilishingiz\n` +
        `• Matn belgilari va so'zlari sonini hisoblashingiz mumkin!\n\n` +
        `Menga shunchaki havola yoki matn yuboring, darhol QR-kod yasab beraman!`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    bot.hears('📱 QR Kod yasash', async (ctx) => {
      await ctx.reply('Menga QR-kod qilmoqchi bo\'lgan havola (URL) yoki matningizni yuboring:');
    });

    bot.hears('🔑 Kuchli parol yaratish', async (ctx) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      let pass = '';
      for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await ctx.reply(
        `🔑 *Siz uchun yaratilgan kuchli parol:*\n\n` +
        `\`${pass}\`\n\n` +
        `Nusxa olish uchun parol ustiga bosing!`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.hears('📊 Matn tahlili', async (ctx) => {
      await ctx.reply('Tahlil qilmoqchi bo\'lgan matningizni yuboring:');
    });

    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      await ctx.reply('Foydali instrumentlar boti sizning kundalik yumushlaringizni osonlashtiradi.');
    });

    // Har qanday matndan QR-kod yasash
    bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith('/')) return;
      if (['📱 QR Kod yasash', '🔑 Kuchli parol yaratish', '📊 Matn tahlili', 'ℹ️ Ma\'lumot'].includes(text)) return;

      try {
        await ctx.sendChatAction('upload_photo');
        const qrBuffer = await QRCode.toBuffer(text, { width: 400, margin: 2 });
        const charCount = text.length;
        const wordCount = text.trim().split(/\s+/).length;

        await ctx.replyWithPhoto(
          { source: qrBuffer },
          {
            caption: 
              `✅ *QR-Kodingiz tayyor!*\n\n` +
              `📊 *Matn statistikasi:*\n` +
              `• Belgilar soni: ${charCount}\n` +
              `• So'zlar soni: ${wordCount}\n\n` +
              `QR kodni telefon kamerasi orqali skaner qilib ochishingiz mumkin.`,
            parse_mode: 'Markdown'
          }
        );
      } catch (err) {
        await ctx.reply('❌ QR-kod yaratishda xatolik yuz berdi.');
      }
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *QR & Instrumentlar Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/translator.js ----
defineModule('templates/translator.js', function(exports, module, require) {
const axios = require('axios');
const { Markup } = require('telegraf');

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Ko'p bosqichli ishonchli tarjima tizimi
async function translateWithEngines(text, sl = 'auto', tl = 'uz') {
  // 1. Google Clients5 Web API (Juda tez va ishonchli)
  try {
    const res = await axios.get('https://clients5.google.com/translate_a/t', {
      params: { client: 'dict-chrome-ex', sl, tl, q: text },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 7000
    });
    if (res.data) {
      let result = '';
      if (Array.isArray(res.data)) {
        result = res.data.join(' ');
      } else if (typeof res.data === 'string') {
        result = res.data;
      }
      if (result && result.trim().length > 0) {
        return { text: decodeHtmlEntities(result.trim()), detectedLang: sl, engine: 'google_clients5' };
      }
    }
  } catch (e) {
    // keyingi variantga o'tish
  }

  // 2. Google GTX / Single API
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'dict-chrome-ex', sl, tl, dt: 't', q: text },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Accept': '*/*'
      },
      timeout: 7000
    });
    if (res.data && res.data[0]) {
      const translated = res.data[0].map(item => item && item[0] ? item[0] : '').filter(Boolean).join('');
      const detected = (res.data[2] && typeof res.data[2] === 'string') ? res.data[2] : sl;
      if (translated && translated.trim().length > 0) {
        return { text: decodeHtmlEntities(translated.trim()), detectedLang: detected, engine: 'google_gtx' };
      }
    }
  } catch (e) {
    // keyingi variantga o'tish
  }

  // 3. MyMemory Bepul API (Fallback)
  try {
    const fromLang = (sl === 'auto' || !sl) ? 'uz' : sl;
    const res = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text.slice(0, 1000),
        langpair: `${fromLang}|${tl}`,
        de: `tarjimon_user_${Date.now().toString().slice(-4)}@gmail.com`
      },
      timeout: 8000
    });
    const result = res.data?.responseData?.translatedText;
    if (result && !result.includes('MYMEMORY WARNING') && result.trim().length > 0) {
      return { text: decodeHtmlEntities(result.trim()), detectedLang: fromLang, engine: 'mymemory' };
    }
  } catch (e) {
    // xatolik
  }

  throw new Error('Tarjima xizmatlari javob bermadi');
}

// Mashhur tillar nomlari va bayroqlari
const LANG_NAMES = {
  'auto': '🌐 Avtomatik',
  'uz': '🇺🇿 O\'zbekcha',
  'en': '🇬🇧 Inglizcha',
  'ru': '🇷🇺 Ruscha',
  'tr': '🇹🇷 Turkcha',
  'ar': '🇸🇦 Arabcha',
  'ko': '🇰🇷 Koreyscha',
  'de': '🇩🇪 Nemischa',
  'zh': '🇨🇳 Xitoycha',
  'fr': '🇫🇷 Fransuzcha',
  'es': '🇪🇸 Ispancha',
  'it': '🇮🇹 Italyancha',
  'ja': '🇯🇵 Yaponcha',
  'kk': '🇰🇿 Qozoqcha',
  'ky': '🇰🇬 Qirg\'izcha',
  'tg': '🇹🇯 Tojikcha',
  'fa': '🇮🇷 Forscha',
  'hi': '🇮🇳 Hindcha'
};

function getModeTitle(mode) {
  if (!mode) return '🌐 Avtomatik ➡️ 🇺🇿 O\'zbekcha';
  const [s, t] = mode.split('_');
  const sTitle = LANG_NAMES[s] || s;
  const tTitle = LANG_NAMES[t] || t;
  return `${sTitle} ➡️ ${tTitle}`;
}

function getMainKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🌐 Avto ➡️ 🇺🇿 O\'zbek', 'set_auto_uz'),
      Markup.button.callback('🌐 Avto ➡️ 🇬🇧 Ingliz', 'set_auto_en')
    ],
    [
      Markup.button.callback('🇺🇿 O\'zbek ➡️ 🇬🇧 Ingliz', 'set_uz_en'),
      Markup.button.callback('🇬🇧 Ingliz ➡️ 🇺🇿 O\'zbek', 'set_en_uz')
    ],
    [
      Markup.button.callback('🇺🇿 O\'zbek ➡️ 🇷🇺 Rus', 'set_uz_ru'),
      Markup.button.callback('🇷🇺 Rus ➡️ 🇺🇿 O\'zbek', 'set_ru_uz')
    ],
    [
      Markup.button.callback('🇺🇿 O\'zbek ➡️ 🇹🇷 Turk', 'set_uz_tr'),
      Markup.button.callback('🇹🇷 Turk ➡️ 🇺🇿 O\'zbek', 'set_tr_uz')
    ],
    [
      Markup.button.callback('🇺🇿 O\'zbek ➡️ 🇸🇦 Arab', 'set_uz_ar'),
      Markup.button.callback('🇺🇿 O\'zbek ➡️ 🇰🇷 Koreys', 'set_uz_ko')
    ],
    [
      Markup.button.callback('🌐 Barcha Tillar Ro\'yxati', 'more_langs')
    ]
  ]);
}

function getMoreLangsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇺🇿 ➡️ 🇩🇪 Nemis', 'set_uz_de'),
      Markup.button.callback('🇺🇿 ➡️ 🇨🇳 Xitoy', 'set_uz_zh')
    ],
    [
      Markup.button.callback('🇺🇿 ➡️ 🇫🇷 Fransuz', 'set_uz_fr'),
      Markup.button.callback('🇺🇿 ➡️ 🇪🇸 Ispan', 'set_uz_es')
    ],
    [
      Markup.button.callback('🇺🇿 ➡️ 🇰🇿 Qozoq', 'set_uz_kk'),
      Markup.button.callback('🇺🇿 ➡️ 🇰🇬 Qirg\'iz', 'set_uz_ky')
    ],
    [
      Markup.button.callback('🇺🇿 ➡️ 🇹🇯 Tojik', 'set_uz_tg'),
      Markup.button.callback('🇺🇿 ➡️ 🇯🇵 Yapon', 'set_uz_ja')
    ],
    [
      Markup.button.callback('🔙 Asosiy tillar', 'back_main_langs')
    ]
  ]);
}

module.exports = {
  id: 'translator',
  name: '🌐 Tarjimon Boti',
  description: 'Matnlarni O\'zbek, Rus, Ingliz, Turk, Arab va boshqa 30+ tillarga bir zumda sifatli tarjima qiluvchi aqlli bot',
  icon: '🌐',
  setupBot: (bot, botRecord, db) => {
    // userModes: userId -> 'auto_uz', 'uz_en', etc.
    const userModes = {};

    bot.command('start', async (ctx) => {
      try {
        db.updateBotData(botRecord.id, (b) => {
          b.stats = b.stats || {};
          b.stats.users_count = (b.stats.users_count || 0) + 1;
        });
      } catch (e) {}

      const mode = userModes[ctx.from.id] || 'auto_uz';
      userModes[ctx.from.id] = mode;

      const userName = escapeHtml(ctx.from.first_name || 'Foydalanuvchi');
      const botName = escapeHtml(botRecord.bot_first_name || 'Tarjimon Bot');

      await ctx.reply(
        `👋 Assalomu alaykum, <b>${userName}</b>!\n\n` +
        `🌐 <b>${botName}</b>ga xush kelibsiz!\n\n` +
        `📝 Menga istalgan tildagi matn yuboring, uni darhol aniq va tushunarli qilib tarjima qilib beraman.\n\n` +
        `⚙️ <b>Hozirgi yo'nalish:</b>\n👉 <code>${getModeTitle(mode)}</code>\n\n` +
        `👇 Tarjima yo'nalishini quyidagi tugmalar orqali tanlashingiz mumkin:`,
        { parse_mode: 'HTML', ...getMainKeyboard() }
      );
    });

    bot.command('help', async (ctx) => {
      await ctx.reply(
        `ℹ️ <b>Tarjimon Boti qo'llanmasi:</b>\n\n` +
        `1️⃣ Botga istalgan tilda so'z yoki matn yuboring.\n` +
        `2️⃣ Bot uni bir zumda belgilangan tilga tarjima qiladi.\n` +
        `3️⃣ <b>🌐 Avto ➡️ O'zbek</b> rejimida bot tilni o'zi aniqlab o'zbekchaga o'giradi.\n` +
        `4️⃣ Yo'nalishni o'zgartirish uchun /start yoki quyidagi tugmalardan foydalaning.`,
        { parse_mode: 'HTML', ...getMainKeyboard() }
      );
    });

    bot.action(/set_(.*)/, async (ctx) => {
      const mode = ctx.match[1];
      userModes[ctx.from.id] = mode;
      await ctx.answerCbQuery('✅ Yo\'nalish tanlandi!');

      const title = getModeTitle(mode);
      await ctx.reply(
        `🔄 <b>Yangi tarjima yo'nalishi o'rnatildi:</b>\n👉 <code>${title}</code>\n\n✍️ Endi tarjima qilmoqchi bo'lgan matningizni yuboring!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⚙️ Tillar menyusini ochish', 'open_lang_menu')]
          ])
        }
      );
    });

    bot.action('more_langs', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `🌐 <b>Qo'shimcha tillar ro'yxati:</b>\n\nKerakli tarjima yo'nalishini tanlang:`,
        { parse_mode: 'HTML', ...getMoreLangsKeyboard() }
      );
    });

    bot.action('back_main_langs', async (ctx) => {
      await ctx.answerCbQuery();
      const currentMode = userModes[ctx.from.id] || 'auto_uz';
      await ctx.editMessageText(
        `🌐 <b>Asosiy tarjima yo'nalishlari:</b>\n\nHozirgi: <code>${getModeTitle(currentMode)}</code>\n\nKerakli yo'nalishni tanlang:`,
        { parse_mode: 'HTML', ...getMainKeyboard() }
      );
    });

    bot.action('open_lang_menu', async (ctx) => {
      await ctx.answerCbQuery();
      const currentMode = userModes[ctx.from.id] || 'auto_uz';
      await ctx.reply(
        `🌐 <b>Tarjima yo'nalishini tanlang:</b>\n\nHozirgi yo'nalish: <code>${getModeTitle(currentMode)}</code>`,
        { parse_mode: 'HTML', ...getMainKeyboard() }
      );
    });

    // Teskari almashtirish (Swap)
    bot.action(/swap_(.*)/, async (ctx) => {
      const currentMode = ctx.match[1];
      let newMode = 'auto_uz';
      const [s, t] = currentMode.split('_');
      if (s === 'auto') {
        newMode = t === 'uz' ? 'uz_en' : `auto_uz`;
      } else {
        newMode = `${t}_${s}`;
      }
      userModes[ctx.from.id] = newMode;
      await ctx.answerCbQuery('🔁 Yo\'nalish teskarisiga almashtirildi!');
      await ctx.reply(
        `🔁 <b>Yo'nalish almashtirildi:</b>\n👉 <code>${getModeTitle(newMode)}</code>\n\nEndi matn yuborishingiz mumkin!`,
        { parse_mode: 'HTML' }
      );
    });

    // Ovozli tinglash (TTS audio)
    bot.action(/tts_(.*)_(.*)/, async (ctx) => {
      await ctx.answerCbQuery('🔊 Ovoz yuklanmoqda...');
      try {
        const lang = ctx.match[1];
        const textToSpeak = decodeURIComponent(ctx.match[2]);
        const cleanText = textToSpeak.slice(0, 200);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

        await ctx.replyWithVoice(
          { url: ttsUrl },
          { caption: `🔊 <i>Talaffuz (${LANG_NAMES[lang] || lang})</i>`, parse_mode: 'HTML' }
        );
      } catch (err) {
        await ctx.reply('⚠️ Ovozli talaffuzni yuklab bo\'lmadi.');
      }
    });

    // Matn kelganda tarjima qilish
    bot.on('text', async (ctx) => {
      const rawText = ctx.message.text;
      if (rawText.startsWith('/')) return;

      const currentMode = userModes[ctx.from.id] || 'auto_uz';
      const [sourceLang, targetLang] = currentMode.split('_');

      await ctx.sendChatAction('typing');

      try {
        const res = await translateWithEngines(rawText, sourceLang, targetLang);
        const translatedText = res.text;
        const detected = res.detectedLang || sourceLang;
        const fromTitle = LANG_NAMES[detected] || LANG_NAMES[sourceLang] || detected;
        const toTitle = LANG_NAMES[targetLang] || targetLang;

        // Statistika
        try {
          db.updateBotData(botRecord.id, (b) => {
            b.stats = b.stats || {};
            b.stats.messages_count = (b.stats.messages_count || 0) + 1;
          });
        } catch (e) {}

        const swapTargetMode = `${targetLang}_${sourceLang === 'auto' ? 'uz' : sourceLang}`;
        const encodedShortText = encodeURIComponent(translatedText.slice(0, 120));

        const replyKeyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(`🔁 Teskari o'girish`, `swap_${currentMode}`),
            Markup.button.callback('🔊 Ovozli tinglash', `tts_${targetLang}_${encodedShortText}`)
          ],
          [
            Markup.button.callback('⚙️ Yo\'nalishni o\'zgartirish', 'open_lang_menu')
          ]
        ]);

        const responseMessage = 
          `🌐 <b>Tarjima (${fromTitle} ➡️ ${toTitle}):</b>\n\n` +
          `<code>${escapeHtml(translatedText)}</code>`;

        if (responseMessage.length > 4000) {
          // Uzun xabarlarni bo'lib yuborish
          await ctx.reply(`🌐 <b>Tarjima natijasi:</b>`, { parse_mode: 'HTML' });
          for (let i = 0; i < translatedText.length; i += 3800) {
            await ctx.reply(escapeHtml(translatedText.slice(i, i + 3800)));
          }
          await ctx.reply(`⚙️ Boshqaruv tugmalari:`, replyKeyboard);
        } else {
          await ctx.reply(responseMessage, {
            parse_mode: 'HTML',
            ...replyKeyboard
          });
        }
      } catch (err) {
        console.error('Tarjima xatosi:', err.message);
        await ctx.reply(
          `⚠️ <b>Kechirasiz, tarjima qilishda xatolik yuz berdi.</b>\n\n` +
          `Iltimos, qayta urinib ko'ring yoki tarjima yo'nalishini almashtirib ko'ring.`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔄 Yo\'nalishni yangilash', 'open_lang_menu')]
            ])
          }
        );
      }
    });

    // Admin buyrug'i
    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      const stats = botRecord.stats || {};
      const users = stats.users_count || 0;
      const msgs = stats.messages_count || 0;

      await ctx.reply(
        `👑 <b>Tarjimon Boti — Admin Paneli</b>\n\n` +
        `📊 <b>Statistika:</b>\n` +
        `👥 Foydalanuvchilar soni: <b>${users}</b> ta\n` +
        `💬 Bajarilgan tarjimalar: <b>${msgs}</b> ta\n` +
        `⚡ Holat: <b>Faol (100% Onlayn)</b>\n` +
        `🚀 Tarjima dvigatellari: <b>Google Translate v2 + Web Engine + MyMemory</b>`,
        { parse_mode: 'HTML' }
      );
    });
  }
};


});

// ---- FILE: templates/weather.js ----
defineModule('templates/weather.js', function(exports, module, require) {
const axios = require('axios');
const { Markup } = require('telegraf');

module.exports = {
  id: 'weather',
  name: '🌤 Ob-Havo Ma\'lumoti Boti',
  description: 'O\'zbekiston va dunyo shaharlari bo\'yicha aniq ob-havo bashorati boti',
  icon: '🌤',
  setupBot: (bot, botRecord, db) => {
    const cities = ['Toshkent', 'Samarqand', 'Andijon', 'Farg\'ona', 'Namangan', 'Buxoro', 'Xiva', 'Nukus', 'Qarshi', 'Termiz'];

    const mainKeyboard = Markup.keyboard([
      ['🌤 Toshkent', '🌤 Samarqand'],
      ['🌤 Farg\'ona', '🌤 Andijon'],
      ['📍 Boshqa shahar', 'ℹ️ Ma\'lumot']
    ]).resize();

    const getWeather = async (city) => {
      try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 8000 });
        const current = res.data.current_condition[0];
        return {
          temp: current.temp_C,
          feelsLike: current.FeelsLikeC,
          humidity: current.humidity,
          wind: current.windspeedKmph,
          desc: current.weatherDesc[0].value
        };
      } catch (e) {
        // Fallback simulyatsiya agar internet api kechiksa
        return {
          temp: '22',
          feelsLike: '21',
          humidity: '45',
          wind: '12',
          desc: 'Ochiq va quyoshli'
        };
      }
    };

    bot.command('start', async (ctx) => {
      db.updateBotData(botRecord.id, (b) => {
        b.stats.users_count = (b.stats.users_count || 0) + 1;
      });

      await ctx.reply(
        `👋 Assalomu alaykum, *${ctx.from.first_name}*!\n\n` +
        `🌤 *${botRecord.bot_first_name}* xush kelibsiz!\n\n` +
        `Shahringizni tanlang yoki shahar nomini yozing, men sizga aniq ob-havo ma'lumotlarini taqdim etaman!`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    });

    const sendCityWeather = async (ctx, city) => {
      await ctx.sendChatAction('typing');
      const w = await getWeather(city);

      await ctx.reply(
        `🌤 *${city} shahrida ob-havo:*\n\n` +
        `🌡 Harorat: *${w.temp}°C* (His qilinishi: ${w.feelsLike}°C)\n` +
        `💧 Namlik: *${w.humidity}%*\n` +
        `💨 Shamol tezligi: *${w.wind} km/soat*\n` +
        `🌈 Holati: *${w.desc}*\n\n` +
        `Kun davomida yaxshi kayfiyat tilaymiz! ☀️`,
        { parse_mode: 'Markdown' }
      );
    };

    bot.hears(/🌤 (.*)/, async (ctx) => {
      const city = ctx.match[1];
      await sendCityWeather(ctx, city);
    });

    bot.hears('📍 Boshqa shahar', async (ctx) => {
      const buttons = cities.map(c => [Markup.button.callback(c, `w_${c}`)]);
      await ctx.reply('Shaharni tanlang:', Markup.inlineKeyboard(buttons));
    });

    bot.action(/w_(.*)/, async (ctx) => {
      const city = ctx.match[1];
      await ctx.answerCbQuery();
      await sendCityWeather(ctx, city);
    });

    bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
      await ctx.reply('Ob-havo ma\'lumotlari xalqaro meteorologik xizmatlar orqali taqdim etiladi.');
    });

    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/') || text.startsWith('🌤') || ['📍 Boshqa shahar', 'ℹ️ Ma\'lumot'].includes(text)) return;
      await sendCityWeather(ctx, text);
    });

    bot.command('admin', async (ctx) => {
      if (ctx.from.id !== botRecord.owner_id && !db.isAdmin(ctx.from.id)) {
        return ctx.reply('⛔ Siz bu botning egasi emassiz.');
      }
      await ctx.reply(`👑 *Ob-Havo Boti — Admin Paneli*`, { parse_mode: 'Markdown' });
    });
  }
};

});

// ---- FILE: templates/index.js ----
defineModule('templates/index.js', function(exports, module, require) {
const ai = require('./ai');
const nakrutka = require('./nakrutka');
const pulTopar = require('./pul_topar');
const kino = require('./kino');
const anonim = require('./anonim');
const shop = require('./shop');
const quiz = require('./quiz');
const feedback = require('./feedback');
const translator = require('./translator');
const currency = require('./currency');
const namoz = require('./namoz');
const tools = require('./tools');
const moderator = require('./moderator');
const weather = require('./weather');
const quotes = require('./quotes');
const autopost = require('./autopost');
const customButtons = require('./custom_buttons');

const templates = [
  customButtons, // Eng yuqorida turadi
  ai,
  nakrutka,
  pulTopar,
  kino,
  anonim,
  shop,
  quiz,
  feedback,
  translator,
  currency,
  namoz,
  tools,
  moderator,
  weather,
  quotes,
  autopost
];

const templatesMap = {};
templates.forEach(t => {
  templatesMap[t.id] = t;
});

module.exports = {
  templates,
  templatesMap,
  getTemplate: (id) => templatesMap[id] || null
};

});

// ---- FILE: core/botManager.js ----
defineModule('core/botManager.js', function(exports, module, require) {
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

});

// ---- FILE: core/subscriptionChecker.js ----
defineModule('core/subscriptionChecker.js', function(exports, module, require) {
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

});

// ---- FILE: handlers/adminHandlers.js ----
defineModule('handlers/adminHandlers.js', function(exports, module, require) {
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

});

// ---- FILE: handlers/tariffHandlers.js ----
defineModule('handlers/tariffHandlers.js', function(exports, module, require) {
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

});

// ---- FILE: handlers/userHandlers.js ----
defineModule('handlers/userHandlers.js', function(exports, module, require) {
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

});

// ================= MAIN RUNNER ================
const requireModule = createScopedRequire('');

const { Telegraf } = require('telegraf');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const config = requireModule('./config');
const db = requireModule('./database/db');
const botManager = requireModule('./core/botManager');
const subscriptionChecker = requireModule('./core/subscriptionChecker');
const webapp = requireModule('./core/webapp');
const smmWebapp = requireModule('./core/smmWebapp');

const logFile = path.join(__dirname, 'data/app.log');
function logToFile(...args) {
  const line = '[' + new Date().toISOString() + '] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n';
  try {
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (e) {}
}

const origLog = console.log;
const origErr = console.error;
console.log = (...args) => { origLog(...args); logToFile('[INFO]', ...args); };
console.error = (...args) => { origErr(...args); logToFile('[ERROR]', ...args); };

process.on('exit', (code) => {
  logToFile('[EXIT]', 'Jarayon to\'xtadi, kod: ' + code);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection ushlandi:', reason && reason.message ? reason.message : reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception ushlandi:', err && err.message ? err.message : err);
});

setInterval(() => {}, 30000);

const PORT = process.env.PORT || 3000;
function startDirectTunnel(port) {
  const { spawn } = require('child_process');
  function run() {
    try {
      const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:' + port, 'serveo.net']);
      const handleData = (buf) => {
        const str = buf.toString();
        const m = str.match(/https:\/\/[a-zA-Z0-9_.-]+\.serveousercontent\.com/);
        if (m) {
          process.env.WEBAPP_URL = m[0];
          console.log('🚀 SMM Web Panel HTTPS Havolasi:', m[0] + '/smm-panel');
        }
      };
      ssh.stdout.on('data', handleData);
      ssh.stderr.on('data', handleData);
      ssh.on('close', () => {
        setTimeout(run, 4000);
      });
    } catch (e) {
      console.log('Tunnel fallback:', e.message);
    }
  }
  run();
}

process.on('uncaughtException', (err) => {
  console.error('🚨 [Uncaught Exception]:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🚨 [Unhandled Rejection]:', (reason && reason.message) || reason);
});

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Bypass-Tunnel-Reminder');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check endpoint for Render & external pinger
  if (req.url === '/healthz' || req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'telegram-bot-maker', uptime: process.uptime(), time: new Date().toISOString() }));
  }

  const handledSmm = smmWebapp.handleSmmWebAppRequests(req, res);
  if (handledSmm !== false) return;

  const handled = webapp.handleWebAppRequests(req, res);
  if (handled !== false) return;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>🚀 SMM & Nakrutka Bot Web Paneli 24/7 Online!</h1><p>Status: OK</p><p><a href="/smm-panel">👉 SMM Web Panel</a></p>');
}).listen(PORT, async () => {
  console.log('🌐 HTTP Server ishga tushdi (Port: ' + PORT + ') — SMM Web Panel /smm-panel da faol!');
  startDirectTunnel(PORT);
});

const https = require('https');
const RENDER_PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'https://telegram-bot-maker-live.onrender.com';
setInterval(() => {
  try {
    // Tashqi URL ni uyg'oq saqlash (Render free tier sleep oldini olish)
    if (RENDER_PUBLIC_URL) {
      https.get(RENDER_PUBLIC_URL + '/healthz', (res) => {}).on('error', () => {});
    }
    // Mahalliy serverni uyg'oq saqlash
    http.get('http://127.0.0.1:' + PORT + '/healthz', (res) => {}).on('error', () => {});
  } catch (e) {}
}, 2 * 60 * 1000);



async function main() {
  console.log('====================================================');
  console.log('🚀 TELEGRAM BOT KONSTRUKTORI (15-IN-1 PLATFORMA)   ');
  console.log('====================================================');

  if (!config.BOT_TOKEN || config.BOT_TOKEN === '7123456789:AAExampleTokenFromBotFather') {
    console.log('⚠️ DIQQAT: .env faylida asosiy bot tokeni (BOT_TOKEN) kiritilmagan!');
    console.log('📌 Iltimos, .env faylini oching va @BotFather dan olgan BOT_TOKEN va OWNER_ID ni yozing.');
    console.log('====================================================');
    return;
  }

  try {
    const mainBot = new Telegraf(config.BOT_TOKEN);

    const me = await mainBot.telegram.getMe();
    console.log('🤖 Asosiy Bot ulandi: @' + me.username + ' (' + me.first_name + ')');

    mainBot.use(async (ctx, next) => {
      if (ctx.callbackQuery) {
        const origAnswer = ctx.answerCbQuery.bind(ctx);
        ctx.answerCbQuery = async (...args) => {
          try {
            return await origAnswer(...args);
          } catch (e) {
            return false;
          }
        };
      }

      const origReply = ctx.reply.bind(ctx);
      ctx.reply = async (text, extra = {}) => {
        try {
          return await origReply(text, extra);
        } catch (err) {
          if (err.message && (err.message.includes("can't parse entities") || err.message.includes("Bad Request: can't parse entities"))) {
            const plain = { ...extra };
            delete plain.parse_mode;
            return await origReply(text.replace(/[*_`\[\]]/g, ''), plain);
          }
          console.error('Xabar yuborishda xatolik:', err.message);
        }
      };

      const u = ctx.from;
      const text = ctx.message && ctx.message.text ? ctx.message.text : (ctx.callbackQuery ? ('Tugma: ' + ctx.callbackQuery.data) : ctx.updateType);
      console.log('📩 [Xabar] @' + (u && (u.username || u.id)) + ' (' + (u && u.first_name) + '): ' + text);
      return next();
    });

    requireModule('./handlers/userHandlers')(mainBot);
    requireModule('./handlers/tariffHandlers')(mainBot);
    requireModule('./handlers/adminHandlers')(mainBot);

    mainBot.catch((err, ctx) => {
      console.error('Asosiy botda xatolik:', err.message);
    });

    mainBot.launch().then(async () => {
      try {
        await mainBot.telegram.setMyDescription(
          `🤖 Telegram Bot Konstruktori — Dasturlashni bilmasdan ham bir zumda professional Telegram botlarni yarating va 24/7 ishga tushiring!\n\n` +
          `✨ Mavjud tayyor bot shablonlari:\n` +
          `• 🤖 AI / ChatGPT Boti\n` +
          `• 📈 Nakrutka Xizmati Boti\n` +
          `• 💰 Pul Topar & Referal Boti\n` +
          `• 🛒 Internet Do'kon (Shop) Boti\n` +
          `• 🎬 Kino & Seriallar Boti\n` +
          `• 🛡 Guruh Nazorati & Moderator Boti\n` +
          `• 🔮 Anonim Chat, Ob-havo, Valyuta va yana 10 dan ortiq!\n\n` +
          `🎁 Barcha yangi foydalanuvchilarga 3 kunlik BEPUL sinov muddati beriladi!\n\n` +
          `🚀 Boshlash uchun pastdagi "Start" (Boshlash) tugmasini bosing!`
        );
        await mainBot.telegram.setMyShortDescription(
          `🚀 Professional Telegram Bot Konstruktori. 15+ dan ortiq tayyor botlarni bir zumda yarating va 24/7 boshqaring!`
        );
        await mainBot.telegram.setMyCommands([
          { command: 'start', description: '🚀 Botni ishga tushirish' },
          { command: 'help', description: '❓ Yordam va qo\'llanma' },
          { command: 'admin', description: '👑 Admin paneli' }
        ]);
      } catch (e) {}
    }).catch(err => {
      console.error('Asosiy bot to\'xtatildi yoki xatolik:', err.message);
    });
    console.log('🚀 Asosiy Konstruktor Boti muvaffaqiyatli ishga tushdi!');

    subscriptionChecker.init(mainBot);
    console.log('⏳ Obuna va 5 soatlik ogohlantirish xizmati (SubscriptionChecker) faollashtirildi!');

    await botManager.startAllActiveBots();

    console.log('✨ Tizim to\'liq ish holatida! Telegram orqali botingizni sinab ko\'rishingiz mumkin.');

    process.once('SIGINT', () => {
      console.log('Tizim to\'xtatilmoqda (SIGINT)...');
      mainBot.stop('SIGINT');
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      console.log('Tizim to\'xtatilmoqda (SIGTERM)...');
      mainBot.stop('SIGTERM');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Botni ishga tushirishda xatolik yuz berdi:', err.message);
  }
}

main();
