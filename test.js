const assert = require('assert');
const { templates, templatesMap } = require('./templates');
const db = require('./database/db');
const botManager = require('./core/botManager');
const keyboards = require('./core/keyboards');
const config = require('./config');

console.log('🧪 BOT KONSTRUKTORI TESTLARI BOSHLANDI...\n');

// 1. Shablonlar tekshiruvi
console.log('1️⃣ 15+ ta Bot Shablonlarini tekshirish:');
assert(templates.length >= 15, `Kamida 15 ta shablon bo'lishi kerak, lekin ${templates.length} ta topildi`);

templates.forEach((tpl, i) => {
  assert(tpl.id, `Shablon ${i} da 'id' yo'q`);
  assert(tpl.name, `Shablon ${tpl.id} da 'name' yo'q`);
  assert(tpl.description, `Shablon ${tpl.id} da 'description' yo'q`);
  assert(typeof tpl.setupBot === 'function', `Shablon ${tpl.id} da 'setupBot' funksiyasi yo'q`);
  console.log(`   ✅ [${i + 1}] ${tpl.name} (${tpl.id}) — To'liq tayyor`);
});

// 2. Ma'lumotlar bazasi va 7 kunlik trial tekshiruvi
console.log('\n2️⃣ Ma\'lumotlar bazasi va 7 kunlik sinov tizimini tekshirish:');
const testUserId = Date.now();
const testUser = {
  id: testUserId,
  username: 'testuser',
  first_name: 'Test'
};

const user = db.getOrCreateUser(testUser);
assert(user.tariff === 'free_trial', 'Boshlang\'ich tarif free_trial bo\'lishi kerak');
assert(db.isSubscriptionActive(testUser.id) === true, 'Yangi foydalanuvchi uchun obuna faol bo\'lishi kerak');

const daysLeft = db.getSubscriptionDaysLeft(testUser.id);
assert(daysLeft >= 1 && daysLeft <= (config.TRIAL_DAYS || 7), `Sinov muddati berilishi kerak, lekin ${daysLeft} chiqdi`);
console.log(`   ✅ Foydalanuvchi yaratildi va sinov berildi (${daysLeft} kun qoldi)`);

// 3. Pro tarif berish va kun qo'shish/ayirish tekshiruvi
db.setTariff(testUser.id, 'pro_month', 30);
const updatedUser = db.getUser(testUser.id);
assert(updatedUser.tariff === 'pro_month', 'Tarif pro_month bo\'lishi kerak');
const daysAfterAdd = db.addDays(testUser.id, 10);
assert(daysAfterAdd >= 42 && daysAfterAdd <= 44, `Kun qo'shish to'g'ri ishlashi kerak (kutilgan 43, chiqdi ${daysAfterAdd})`);
const daysAfterSub = db.subtractDays(testUser.id, 15);
assert(daysAfterSub >= 27 && daysAfterSub <= 29, `Kun ayirish to'g'ri ishlashi kerak (kutilgan 28, chiqdi ${daysAfterSub})`);
console.log(`   ✅ 25 Pro tarifi, kun qo'shish va kun ayirish testlari muvaffaqiyatli o'tdi`);

// 4. Adminlik tekshiruvi
console.log('\n3️⃣ Administratorlar boshqaruvi tekshiruvi:');
db.addAdmin(999999992);
assert(db.isAdmin(999999992) === true, 'Admin qo\'shilishi kerak');
db.removeAdmin(999999992);
assert(db.isAdmin(999999992) === false, 'Admin o\'chirilishi kerak');
console.log(`   ✅ Admin qo'shish va o'chirish muvaffaqiyatli ishladi`);

// 5. Bot boshqaruvi tekshiruvi
console.log('\n4️⃣ Bot yaratish va saqlash tekshiruvi:');
const dummyBot = db.createBot(testUser.id, '123456:DummyTokenTest', 'ai', {
  id: 123456,
  username: 'TestAiBot',
  first_name: 'Test AI Bot'
});
assert(dummyBot.bot_username === 'TestAiBot');
const userBots = db.getUserBots(testUser.id);
assert(userBots.length > 0, 'Foydalanuvchi botlari topilishi kerak');
db.deleteBot(dummyBot.id);
console.log(`   ✅ Bot bazaga yozildi va o'chirildi`);

// 6. Tugmalar tekshiruvi
console.log('\n5️⃣ Interfeys va tugmalar tekshiruvi:');
const mainKb = keyboards.getMainKeyboard(true);
assert(mainKb, 'Asosiy menyu tugmalari yaratilishi kerak');
const tplKb = keyboards.getTemplatesKeyboard();
assert(tplKb, 'Shablonlar menyusi yaratilishi kerak');
console.log(`   ✅ Barcha klaviatura va inline tugmalar to'g'ri shakllandi`);

console.log('\n🎉 BARCHA TESTLAR 100% MUVAFFAQIYATLI O\'TDI!');
