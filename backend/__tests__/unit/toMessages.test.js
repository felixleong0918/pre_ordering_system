'use strict';

const { toMessages } = require('../../line/feedback');
const { buildGoogleReviewInviteFlex } = require('../../line/googleReviewInvite');

describe('toMessages', () => {
  test('wraps plain string as text message', () => {
    expect(toMessages('你好')).toEqual([{ type: 'text', text: '你好' }]);
  });

  test('normalizes mixed string and flex objects in array', () => {
    const flex = buildGoogleReviewInviteFlex();
    const messages = toMessages(['感謝您的回饋', flex]);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ type: 'text', text: '感謝您的回饋' });
    expect(messages[1]).toBe(flex);
    expect(messages[1].type).toBe('flex');
  });
});
