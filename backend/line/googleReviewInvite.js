/** 香港鑫華茶餐廳 Google 地圖（與 crawler.py MAPS_URL 同源，永康街48號） */
const GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/place/%E9%A6%99%E6%B8%AF%E9%91%AB%E8%8F%AF%E8%8C%B6%E9%A4%90%E5%BB%B3/@25.0315368,121.5285299,17z/data=!4m6!3m5!1s0x3442a98363c3e723:0xe06da9a5893f3509!8m2!3d25.0315368!4d121.5285299!16s%2Fg%2F1tmk6619';

const THEME = {
  title: '#111827',
  body: '#374151',
  hint: '#6B7280',
  separator: '#E5E7EB',
  bodyBg: '#FFFFFF'
};

function getGoogleReviewUrl() {
  return GOOGLE_REVIEW_URL;
}

function buildGoogleReviewInviteFlex() {
  return {
    type: 'flex',
    altText: '若您願意，歡迎在 Google 地圖留下評價',
    contents: {
      type: 'bubble',
      size: 'mega',
      styles: {
        body: { backgroundColor: THEME.bodyBg }
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '感謝您的肯定！',
            weight: 'bold',
            size: 'lg',
            color: THEME.title
          },
          {
            type: 'text',
            text: '若您願意，也歡迎在 Google 地圖分享用餐體驗，幫助更多朋友認識我們。',
            size: 'sm',
            color: THEME.body,
            wrap: true
          },
          {
            type: 'separator',
            margin: 'lg',
            color: THEME.separator
          },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '前往 Google 留下評價',
              uri: GOOGLE_REVIEW_URL
            }
          },
          {
            type: 'text',
            text: '將開啟 Google 地圖店家頁面',
            size: 'xxs',
            color: THEME.hint,
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

module.exports = {
  GOOGLE_REVIEW_URL,
  getGoogleReviewUrl,
  buildGoogleReviewInviteFlex
};
