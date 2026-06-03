/** 候位／過號規則文案（與 frontend-customer/lib/queueRules.js 同步） */

const SKIP_RULE_SHORT = '叫號後請您儘快至櫃台報到；若未在現場，號碼將過號，需重新取號。';

const SKIP_RULE_LINE = SKIP_RULE_SHORT;

const SKIP_RULE_CALLED = '請您立即前往櫃台報到；逾時未到將視為過號。';

const WAITING_STAY_HINT = '請您留在店內附近，留意 LINE 叫號通知。';

const SKIP_REASON_NOTE = '叫號時未在現場報到';

module.exports = {
  SKIP_RULE_SHORT,
  SKIP_RULE_LINE,
  SKIP_RULE_CALLED,
  WAITING_STAY_HINT,
  SKIP_REASON_NOTE
};
