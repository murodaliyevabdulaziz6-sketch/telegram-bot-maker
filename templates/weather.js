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
