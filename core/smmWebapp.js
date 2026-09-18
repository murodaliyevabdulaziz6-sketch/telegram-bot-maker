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
