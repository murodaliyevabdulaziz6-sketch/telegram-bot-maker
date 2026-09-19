const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

const filesToBundle = [
  'config.js',
  'database/db.js',
  'core/helpers.js',
  'core/keyboards.js',
  'core/webapp.js',
  'core/smmWebapp.js',
  'templates/ai.js',
  'templates/anonim.js',
  'templates/autopost.js',
  'templates/currency.js',
  'templates/custom_buttons.js',
  'templates/feedback.js',
  'templates/kino.js',
  'templates/moderator.js',
  'templates/nakrutka.js',
  'templates/namoz.js',
  'templates/pul_topar.js',
  'templates/quiz.js',
  'templates/quotes.js',
  'templates/shop.js',
  'templates/tools.js',
  'templates/translator.js',
  'templates/weather.js',
  'templates/index.js',
  'core/botManager.js',
  'core/subscriptionChecker.js',
  'handlers/adminHandlers.js',
  'handlers/tariffHandlers.js',
  'handlers/userHandlers.js'
];

let bundleCode = `// ==========================================
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
  let resolved = path.join(currentDir, reqPath).replace(/\\\\/g, '/');
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

`;

for (const relFile of filesToBundle) {
  const fullPath = path.join(projectRoot, relFile);
  if (!fs.existsSync(fullPath)) {
    console.error('MISSING FILE:', fullPath);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const modKey = relFile.replace(/\\/g, '/');
  bundleCode += `\n// ---- FILE: ${modKey} ----\ndefineModule('${modKey}', function(exports, module, require) {\n${content}\n});\n`;
}


// Main runner code template
const mainRunnerCode = `
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
  const line = '[' + new Date().toISOString() + '] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\\n';
  try {
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (e) {}
}

const origLog = console.log;
const origErr = console.error;
console.log = (...args) => { origLog(...args); logToFile('[INFO]', ...args); };
console.error = (...args) => { origErr(...args); logToFile('[ERROR]', ...args); };

process.on('exit', (code) => {
  logToFile('[EXIT]', 'Jarayon to\\'xtadi, kod: ' + code);
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
        const m = str.match(/https:\\/\\/[a-zA-Z0-9_.-]+\\.serveousercontent\\.com/);
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
            return await origReply(text.replace(/[*_\`\\[\\]]/g, ''), plain);
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
          \`🤖 Telegram Bot Konstruktori — Dasturlashni bilmasdan ham bir zumda professional Telegram botlarni yarating va 24/7 ishga tushiring!\\n\\n\` +
          \`✨ Mavjud tayyor bot shablonlari:\\n\` +
          \`• 🤖 AI / ChatGPT Boti\\n\` +
          \`• 📈 Nakrutka Xizmati Boti\\n\` +
          \`• 💰 Pul Topar & Referal Boti\\n\` +
          \`• 🛒 Internet Do'kon (Shop) Boti\\n\` +
          \`• 🎬 Kino & Seriallar Boti\\n\` +
          \`• 🛡 Guruh Nazorati & Moderator Boti\\n\` +
          \`• 🔮 Anonim Chat, Ob-havo, Valyuta va yana 10 dan ortiq!\\n\\n\` +
          \`🎁 Barcha yangi foydalanuvchilarga 3 kunlik BEPUL sinov muddati beriladi!\\n\\n\` +
          \`🚀 Boshlash uchun pastdagi "Start" (Boshlash) tugmasini bosing!\`
        );
        await mainBot.telegram.setMyShortDescription(
          \`🚀 Professional Telegram Bot Konstruktori. 15+ dan ortiq tayyor botlarni bir zumda yarating va 24/7 boshqaring!\`
        );
        await mainBot.telegram.setMyCommands([
          { command: 'start', description: '🚀 Botni ishga tushirish' },
          { command: 'help', description: '❓ Yordam va qo\\'llanma' },
          { command: 'admin', description: '👑 Admin paneli' }
        ]);
      } catch (e) {}
    }).catch(err => {
      console.error('Asosiy bot to\\'xtatildi yoki xatolik:', err.message);
    });
    console.log('🚀 Asosiy Konstruktor Boti muvaffaqiyatli ishga tushdi!');

    subscriptionChecker.init(mainBot);
    console.log('⏳ Obuna va 5 soatlik ogohlantirish xizmati (SubscriptionChecker) faollashtirildi!');

    await botManager.startAllActiveBots();

    console.log('✨ Tizim to\\'liq ish holatida! Telegram orqali botingizni sinab ko\\'rishingiz mumkin.');

    process.once('SIGINT', () => {
      console.log('Tizim to\\'xtatilmoqda (SIGINT)...');
      mainBot.stop('SIGINT');
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      console.log('Tizim to\\'xtatilmoqda (SIGTERM)...');
      mainBot.stop('SIGTERM');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Botni ishga tushirishda xatolik yuz berdi:', err.message);
  }
}

main();
`;

bundleCode += mainRunnerCode;

fs.writeFileSync(path.join(projectRoot, 'single_index.js'), bundleCode, 'utf-8');
fs.writeFileSync(path.join(projectRoot, 'index.js'), bundleCode, 'utf-8');
console.log('SUCCESS: index.js updated with ALL modules! Size:', bundleCode.length, 'bytes');


