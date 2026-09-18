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


