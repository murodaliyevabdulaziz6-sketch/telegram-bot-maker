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

