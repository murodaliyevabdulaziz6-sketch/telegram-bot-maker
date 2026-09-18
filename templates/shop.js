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
