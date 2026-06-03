'use strict';

const {
  buildFeedbackDimensionsFlex,
  FEEDBACK_FLEX_THEME
} = require('../../line/notify');

const DIMENSIONS = ['overall', 'wait', 'food', 'service'];
const RATINGS = ['good', 'ok', 'bad'];

function collectPostbacks(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.action?.type === 'postback') out.push(node.action.data);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectPostbacks(item, out));
    else if (value && typeof value === 'object') collectPostbacks(value, out);
  }
  return out;
}

function collectButtons(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'button') out.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectButtons(item, out));
    else if (value && typeof value === 'object') collectButtons(value, out);
  }
  return out;
}

function collectSeparators(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'separator') out.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectSeparators(item, out));
    else if (value && typeof value === 'object') collectSeparators(value, out);
  }
  return out;
}

function collectTexts(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'text' && typeof node.text === 'string') out.push(node.text);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectTexts(item, out));
    else if (value && typeof value === 'object') collectTexts(value, out);
  }
  return out;
}

describe('buildFeedbackDimensionsFlex', () => {
  const flex = buildFeedbackDimensionsFlex(42);

  test('returns mega flex bubble with themed body', () => {
    expect(flex.type).toBe('flex');
    expect(flex.contents.type).toBe('bubble');
    expect(flex.contents.size).toBe('mega');
    expect(flex.contents.styles.body.backgroundColor).toBe(FEEDBACK_FLEX_THEME.bodyBg);
    expect(flex.contents.body.paddingAll).toBe('20px');
    expect(flex.contents.footer).toBeUndefined();
  });

  test('includes postback for each dimension and rating', () => {
    const postbacks = collectPostbacks(flex);
    expect(postbacks).toHaveLength(DIMENSIONS.length * RATINGS.length);
    for (const dim of DIMENSIONS) {
      for (const rating of RATINGS) {
        expect(postbacks).toContain(`action=feedback&queueId=42&dim=${dim}&rating=${rating}`);
      }
    }
  });

  test('has exactly one primary button on overall good rating', () => {
    const buttons = collectButtons(flex);
    const primaryButtons = buttons.filter((b) => b.style === 'primary');
    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0].action.data).toBe('action=feedback&queueId=42&dim=overall&rating=good');
  });

  test('rating buttons are equal width', () => {
    const buttons = collectButtons(flex);
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button.flex).toBe(1);
    });
  });

  test('includes separators and footer hint text', () => {
    const separators = collectSeparators(flex);
    expect(separators).toHaveLength(4);
    separators.forEach((sep) => {
      expect(sep.color).toBe(FEEDBACK_FLEX_THEME.separator);
    });

    const texts = collectTexts(flex);
    expect(texts).toContain('用餐體驗問卷');
    expect(texts).toContain('請為以下四項各選一個評分');
    expect(texts).toContain('完成後可於聊天室留言，或回覆「略過」');
  });
});
