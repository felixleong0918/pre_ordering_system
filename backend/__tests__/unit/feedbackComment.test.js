'use strict';

const { handleFeedbackComment } = require('../../line/feedback');

function makeDb(row) {
  return {
    async get(sql) {
      if (sql.includes('awaiting_comment = 1')) {
        return row?.awaiting_comment === 1 ? row : null;
      }
      if (sql.includes('WHERE id = ?')) {
        return row;
      }
      return null;
    },
    async run(sql, params) {
      if (sql.includes('comment = ?')) {
        row.comment = params[0];
        row.awaiting_comment = 0;
      } else if (sql.includes('comment = NULL')) {
        row.comment = null;
        row.awaiting_comment = 0;
      }
    }
  };
}

describe('handleFeedbackComment', () => {
  const highRow = {
    id: 1,
    rating: 'good',
    rating_wait: 'good',
    rating_food: 'good',
    rating_service: 'good',
    awaiting_comment: 1,
    comment: null
  };

  test('ignores rating button labels so displayText does not consume comment step', async () => {
    const row = { ...highRow };
    const db = makeDb(row);
    const result = await handleFeedbackComment(db, { lineUserId: 'U1', text: '滿意' });
    expect(result).toBeNull();
    expect(row.awaiting_comment).toBe(1);
    expect(row.comment).toBeNull();
  });

  test('returns finish reply with Google flex for real comment when highly satisfied', async () => {
    const row = { ...highRow };
    const db = makeDb(row);
    const result = await handleFeedbackComment(db, { lineUserId: 'U1', text: '好吃' });
    expect(result).not.toBeNull();
    expect(Array.isArray(result.reply)).toBe(true);
    expect(result.reply[0]).toContain('寶貴意見');
    expect(result.reply[1].type).toBe('flex');
    expect(row.comment).toBe('好吃');
    expect(row.awaiting_comment).toBe(0);
  });

  test('returns finish reply with Google flex when skipping comment', async () => {
    const row = { ...highRow };
    const db = makeDb(row);
    const result = await handleFeedbackComment(db, { lineUserId: 'U1', text: '略過' });
    expect(Array.isArray(result.reply)).toBe(true);
    expect(result.reply[1].type).toBe('flex');
    expect(row.comment).toBeNull();
    expect(row.awaiting_comment).toBe(0);
  });
});
