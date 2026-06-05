'use strict';

const {
  GOOGLE_REVIEW_URL,
  getGoogleReviewUrl,
  buildGoogleReviewInviteFlex
} = require('../../line/googleReviewInvite');

function findUriButton(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'button' && node.action?.type === 'uri') return node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findUriButton(item);
        if (found) return found;
      }
    } else if (value && typeof value === 'object') {
      const found = findUriButton(value);
      if (found) return found;
    }
  }
  return null;
}

describe('googleReviewInvite', () => {
  test('getGoogleReviewUrl returns hardcoded HTTPS maps URL', () => {
    expect(getGoogleReviewUrl()).toBe(GOOGLE_REVIEW_URL);
    expect(getGoogleReviewUrl()).toMatch(/^https:\/\//);
    expect(getGoogleReviewUrl()).toContain('google.com/maps');
  });

  test('buildGoogleReviewInviteFlex returns flex with review button', () => {
    const flex = buildGoogleReviewInviteFlex();
    expect(flex.type).toBe('flex');
    expect(flex.altText).toContain('Google');

    const button = findUriButton(flex);
    expect(button).not.toBeNull();
    expect(button.action.uri).toBe(GOOGLE_REVIEW_URL);
    expect(button.action.label).toBe('前往 Google 留下評價');
    expect(button.style).toBe('primary');
  });
});
