const { findMenuItemsByQuery } = require('./menuItems');

const REVIEW_PREFIX = /^評論\s*(.+)$/i;
const REVIEW_SUFFIX = /^(.+?)\s*評論$/i;

function extractDishQuery(text) {
  const t = text.trim();
  let match = t.match(REVIEW_PREFIX);
  if (match) return match[1].trim();
  match = t.match(REVIEW_SUFFIX);
  if (match) return match[1].trim();
  return null;
}

function isDishReviewMessage(text) {
  return !!extractDishQuery(text);
}

function formatRating(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n} 星`;
}

function truncate(text, max = 80) {
  const s = String(text || '').replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

async function fetchReviewsForItem(db, menuItemId, limit = 3) {
  return db.all(
    `SELECT reviewer, rating, content
     FROM dish_reviews
     WHERE menuItemId = ?
     ORDER BY id DESC
     LIMIT ?`,
    [menuItemId, limit]
  );
}

async function getReviewReply(db, text) {
  const query = extractDishQuery(text);
  if (!query) return null;

  const matches = findMenuItemsByQuery(query);
  if (!matches.length) {
    return `查無「${query}」相關餐點。\n請輸入「評論 菜名」，例如：評論 叉燒飯`;
  }

  if (matches.length > 1) {
    const names = matches.slice(0, 5).map((m) => m.name).join('、');
    return `找到多道餐點，請輸入更完整名稱：\n${names}`;
  }

  const item = matches[0];
  const reviews = await fetchReviewsForItem(db, item.id, 3);
  if (!reviews.length) {
    return `「${item.name}」目前尚無顧客評論。\n您可至預點餐頁面查看菜單與詳細資訊。`;
  }

  const lines = reviews.map((r, i) => {
    const who = r.reviewer || '匿名';
    return `${i + 1}. ${formatRating(r.rating)}｜${truncate(r.content)}\n   — ${who}`;
  });

  return `「${item.name}」顧客評價（最近 ${reviews.length} 則）：\n\n${lines.join('\n\n')}`;
}

function getDishReviewHelpReply() {
  return '查詢餐點評價請輸入：\n・評論 菜名\n・菜名 評論\n\n例如：評論 叉燒飯';
}

module.exports = {
  getReviewReply,
  isDishReviewMessage,
  getDishReviewHelpReply
};
