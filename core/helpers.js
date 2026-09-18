// Telegram xavfsiz matn yordamchisi
function cleanName(name) {
  if (!name) return 'Foydalanuvchi';
  return String(name).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '').trim() || 'Foydalanuvchi';
}

function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

module.exports = {
  cleanName,
  escapeMarkdown
};
