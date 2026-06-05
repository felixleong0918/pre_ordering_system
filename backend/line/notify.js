const { getClient, isLineConfigured } = require('./client');
const {
  SKIP_RULE_SHORT,
  SKIP_RULE_CALLED,
  WAITING_STAY_HINT,
  SKIP_REASON_NOTE
} = require('./queueCopy');

const SEATED_DURATION = () => Number(process.env.SEATED_DURATION_MINUTES) || 60;

function formatLineError(err) {
  if (err?.body?.message) return String(err.body.message);
  if (err?.originalError?.response?.data?.message) return String(err.originalError.response.data.message);
  return err?.message || 'LINE push failed';
}

/** @returns {{ ok: boolean, skipped?: boolean, reason?: string, error?: string }} */
function pushResult(ok, { skipped, reason, error } = {}) {
  return { ok, skipped: !!skipped, reason: reason || null, error: error || null };
}

async function pushToUser(lineUserId, messages) {
  if (!lineUserId) return pushResult(false, { skipped: true, reason: 'no_line_user_id' });
  if (!isLineConfigured()) return pushResult(false, { skipped: true, reason: 'line_not_configured' });
  const client = getClient();
  try {
    await client.getProfile(lineUserId);
  } catch (err) {
    const error = `userId 無法用於此官方帳號推播（LIFF 可能綁在另一個 Provider 的 Channel）：${formatLineError(err)}`;
    console.error('LINE getProfile failed:', error);
    return pushResult(false, { error });
  }
  try {
    await client.pushMessage({ to: lineUserId, messages });
    return pushResult(true);
  } catch (err) {
    const error = formatLineError(err);
    console.error('LINE push failed:', error);
    return pushResult(false, { error });
  }
}

function formatOrderSummary(order) {
  if (!order?.items?.length) return '（尚無預點餐項目）';
  const items = order.items;
  const maxLines = 5;
  const lines = items.slice(0, maxLines).map((item) => {
    const qty = item.quantity > 0 ? item.quantity : 1;
    return `・${item.name} × ${qty}`;
  });
  if (items.length > maxLines) {
    lines.push(`…等 ${items.length} 項`);
  }
  return `預點餐摘要：\n${lines.join('\n')}`;
}

async function pushQueueTaken(queue, aheadCount) {
  if (!queue?.lineUserId) return pushResult(false, { skipped: true, reason: 'no_line_user_id' });
  const party = queue.partySize > 0 ? queue.partySize : 1;
  return pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【候位通知】取號成功\n\n您的號碼：${queue.number}（${party} 位）\n前方等候：約 ${aheadCount} 組\n\n輪到您的號碼時，我們將透過 LINE 通知您。\n您也可輸入「我的號碼」或點選選單查詢候位狀態。\n\n${SKIP_RULE_SHORT}`
  }]);
}

async function pushCalled(queue, order = null) {
  if (!queue?.lineUserId) return;
  const party = queue.partySize > 0 ? queue.partySize : 1;
  const summary = formatOrderSummary(order);
  await pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【叫號通知】輪到您了\n\n您的號碼：${queue.number}（${party} 位）\n請前往櫃台報到。\n\n${SKIP_RULE_CALLED}\n\n${summary}`
  }]);
}

async function pushSkipped(queue) {
  if (!queue?.lineUserId) return;
  await pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【過號通知】\n\n您的號碼 ${queue.number} 已過號。\n原因：${SKIP_REASON_NOTE}\n\n如需繼續候位，請重新取號或洽詢櫃台人員。`
  }]);
}

async function pushSeatedWelcome(queue) {
  if (!queue?.lineUserId) return;
  const duration = SEATED_DURATION();
  await pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【入座通知】\n\n已為您安排入座（號碼 ${queue.number}）。\n本次用餐時間約 ${duration} 分鐘，時間將近時我們會透過 LINE 提醒您。`
  }]);
}

async function pushAlmostCalled(queue, aheadCount) {
  if (!queue?.lineUserId) return false;
  return pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【候位提醒】就快到您了\n\n您的號碼：${queue.number}\n前方等候：約 ${aheadCount} 組\n\n請留意叫號通知。\n${WAITING_STAY_HINT}\n\n${SKIP_RULE_SHORT}`
  }]);
}

async function pushSeatedWarn(queue, minutesLeft) {
  if (!queue?.lineUserId) return false;
  return pushToUser(queue.lineUserId, [{
    type: 'text',
    text: `【用餐時間提醒】\n\n號碼 ${queue.number} 的用餐時間剩餘約 ${minutesLeft} 分鐘。\n如需加點，歡迎洽詢服務人員。`
  }]);
}

function buildFeedbackIntroText(queue, { timeUp = false } = {}) {
  const prefix = timeUp
    ? `用餐時間已到，感謝您的光臨！（號碼 ${queue.number}）`
    : `感謝您的光臨！（號碼 ${queue.number}）`;
  return `${prefix}\n\n誠摯邀請您協助填寫用餐體驗問卷（約 1 分鐘）：整體滿意度、等候體驗、餐點、服務\n\n請點選下方按鈕評分；完成後亦可留言分享建議（回覆「略過」可跳過）。`;
}

const FEEDBACK_FLEX_THEME = {
  title: '#111827',
  label: '#374151',
  subtitle: '#6B7280',
  hint: '#9CA3AF',
  separator: '#E5E7EB',
  bodyBg: '#FFFFFF'
};

function buildFlexSeparator() {
  return {
    type: 'separator',
    margin: 'lg',
    color: FEEDBACK_FLEX_THEME.separator
  };
}

function buildFeedbackFlexHeader() {
  return [
    {
      type: 'text',
      text: '用餐體驗問卷',
      weight: 'bold',
      size: 'xl',
      color: FEEDBACK_FLEX_THEME.title
    },
    {
      type: 'text',
      text: '請為以下四項各選一個評分',
      size: 'xs',
      color: FEEDBACK_FLEX_THEME.subtitle,
      margin: 'sm'
    },
    buildFlexSeparator()
  ];
}

function ratingButton(queueId, dim, rating, label, primary = false) {
  return {
    type: 'button',
    style: primary ? 'primary' : 'secondary',
    height: 'sm',
    flex: 1,
    action: {
      type: 'postback',
      label,
      data: `action=feedback&queueId=${queueId}&dim=${dim}&rating=${rating}`
    }
  };
}

function buildDimensionRow(queueId, dim, dimLabel, { isFirst = false } = {}) {
  return {
    type: 'box',
    layout: 'vertical',
    margin: isFirst ? 'lg' : 'md',
    spacing: 'xs',
    contents: [
      {
        type: 'text',
        text: dimLabel,
        size: 'sm',
        weight: 'bold',
        color: FEEDBACK_FLEX_THEME.label
      },
      {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          ratingButton(queueId, dim, 'good', '滿意', dim === 'overall'),
          ratingButton(queueId, dim, 'ok', '普通'),
          ratingButton(queueId, dim, 'bad', '不滿意')
        ]
      }
    ]
  };
}

const FEEDBACK_DIMENSIONS = [
  ['overall', '整體滿意度'],
  ['wait', '等候體驗'],
  ['food', '餐點'],
  ['service', '服務']
];

function buildFeedbackDimensionsFlex(queueId) {
  const bodyContents = [
    ...buildFeedbackFlexHeader(),
    ...FEEDBACK_DIMENSIONS.flatMap(([dim, label], index) => {
      const items = [buildDimensionRow(queueId, dim, label, { isFirst: index === 0 })];
      if (index < FEEDBACK_DIMENSIONS.length - 1) {
        items.push(buildFlexSeparator());
      }
      return items;
    }),
    {
      type: 'text',
      text: '完成後可於聊天室留言，或回覆「略過」',
      size: 'xxs',
      color: FEEDBACK_FLEX_THEME.hint,
      align: 'center',
      wrap: true,
      margin: 'xl'
    }
  ];

  return {
    type: 'flex',
    altText: '用餐體驗問卷｜請為整體、等候、餐點、服務評分',
    contents: {
      type: 'bubble',
      size: 'mega',
      styles: {
        body: { backgroundColor: FEEDBACK_FLEX_THEME.bodyBg }
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: bodyContents
      }
    }
  };
}

/** @deprecated 相容舊呼叫 */
function buildFeedbackFlex(queueId) {
  return buildFeedbackDimensionsFlex(queueId);
}

async function pushSeatedTimeUp(queue) {
  if (!queue?.lineUserId) return false;
  return pushToUser(queue.lineUserId, [
    { type: 'text', text: buildFeedbackIntroText(queue, { timeUp: true }) },
    buildFeedbackDimensionsFlex(queue.id)
  ]);
}

/** 提早離開：不發時間到／預警，只發回饋問卷 */
async function pushFeedbackOnly(queue) {
  if (!queue?.lineUserId) return false;
  return pushToUser(queue.lineUserId, [
    { type: 'text', text: buildFeedbackIntroText(queue) },
    buildFeedbackDimensionsFlex(queue.id)
  ]);
}

module.exports = {
  pushCalled,
  pushQueueTaken,
  pushSkipped,
  pushSeatedWelcome,
  pushAlmostCalled,
  pushSeatedWarn,
  pushSeatedTimeUp,
  pushFeedbackOnly,
  formatOrderSummary,
  buildFeedbackFlex,
  buildFeedbackIntroText,
  buildFeedbackDimensionsFlex,
  FEEDBACK_FLEX_THEME,
  pushToUser
};
