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