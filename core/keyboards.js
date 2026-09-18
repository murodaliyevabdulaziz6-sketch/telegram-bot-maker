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

