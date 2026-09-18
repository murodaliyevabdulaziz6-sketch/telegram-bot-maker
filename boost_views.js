const https = require('https');

const targetUrl = 'https://t.me/MAKERRBOTKANALI/7?embed=1';
const referer = 'https://t.me/MAKERRBOTKANALI/7';
const totalTarget = 1000;

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.103 Mobile Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
];

let sent = 0;
let success = 0;

function sendView() {
  return new Promise((resolve) => {
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
    const options = {
      headers: {
        'User-Agent': ua,
        'Referer': referer,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'uz-UZ,uz;q=0.9,en-US;q=0.8,ru;q=0.7',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      },
      timeout: 6000
    };

    https.get(targetUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          success++;
        }
        resolve();
      });
    }).on('error', () => {
      resolve();
    });
  });
}

async function runBooster() {
  console.log("🚀 Telegram Post Ko'rish Booster ishga tushdi: " + targetUrl);
  console.log("🎯 Maqsad: 1000 ta ko'rish (views)...");

  const concurrency = 25;
  for (let i = 0; i < totalTarget; i += concurrency) {
    const batch = [];
    const currentBatchSize = Math.min(concurrency, totalTarget - i);
    for (let j = 0; j < currentBatchSize; j++) {
      batch.push(sendView());
    }
    await Promise.all(batch);
    sent += currentBatchSize;
    if (sent % 100 === 0 || sent >= totalTarget) {
      console.log(`📊 Yuborildi: ${sent} / ${totalTarget} ta (Muvaffaqiyatli: ${success})`);
    }
    await new Promise(r => setTimeout(r, 40));
  }
  console.log("🎉 1000 TA KO'RISH POSTGA TO'LIQ YUBORILDI!");
}

runBooster();
