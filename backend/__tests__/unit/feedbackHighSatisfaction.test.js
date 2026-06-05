'use strict';

const { isHighSatisfaction } = require('../../line/feedback');

function row(overrides = {}) {
  return {
    rating: 'good',
    rating_wait: 'good',
    rating_food: 'good',
    rating_service: 'good',
    awaiting_comment: 0,
    comment: null,
    ...overrides
  };
}

describe('isHighSatisfaction', () => {
  test('true when overall good and no dimension is bad', () => {
    expect(isHighSatisfaction(row())).toBe(true);
    expect(isHighSatisfaction(row({ rating_wait: 'ok', rating_food: 'ok' }))).toBe(true);
  });

  test('false when overall is not good', () => {
    expect(isHighSatisfaction(row({ rating: 'ok' }))).toBe(false);
    expect(isHighSatisfaction(row({ rating: 'bad' }))).toBe(false);
  });

  test('false when any dimension is bad', () => {
    expect(isHighSatisfaction(row({ rating_food: 'bad' }))).toBe(false);
    expect(isHighSatisfaction(row({ rating_wait: 'bad' }))).toBe(false);
    expect(isHighSatisfaction(row({ rating_service: 'bad' }))).toBe(false);
  });

  test('false when feedback is incomplete', () => {
    expect(isHighSatisfaction(row({ rating_wait: null }))).toBe(false);
  });
});
