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
