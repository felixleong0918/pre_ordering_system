'use strict';

const { buildFinishReply } = require('../../line/feedback');

describe('buildFinishReply', () => {
  const highRow = {
    rating: 'good',
    rating_wait: 'good',
    rating_food: 'ok',
    rating_service: 'good',
    comment: null
  };

  const lowRow = {
    rating: 'ok',
    rating_wait: 'good',
    rating_food: 'good',
    rating_service: 'good',
    comment: null
  };

  test('returns thank you text only when not high satisfaction', () => {
    const reply = buildFinishReply(lowRow);
    expect(typeof reply).toBe('string');
    expect(reply).toContain('感謝');
  });

  test('returns thank you plus Google flex when high satisfaction', () => {
    const reply = buildFinishReply(highRow);
    expect(Array.isArray(reply)).toBe(true);
    expect(reply).toHaveLength(2);
    expect(typeof reply[0]).toBe('string');
    expect(reply[1].type).toBe('flex');
  });

  test('uses comment thank you message when comment present', () => {
    const reply = buildFinishReply({ ...highRow, comment: '很好吃' });
    expect(reply[0]).toContain('寶貴意見');
  });
});
