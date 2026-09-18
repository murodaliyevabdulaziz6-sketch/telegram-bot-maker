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
