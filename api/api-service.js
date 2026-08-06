const API_BASE_URL = 'https://api.supuzz.cn';
const BRAND_NAME = 'supuzz-us';
const DOMAIN = 'supuzz.com';

const isLocal = /^localhost$|^127\.|^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname);

// ── 访客标识 & 停留时长 ──
let enterTime = Date.now();
let pageViewId = null;

function getVisitorId() {
  const KEY = '_supuzz_vid';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch (e) {
    // localStorage 不可用时（如隐私模式），每次生成临时 id
    return crypto.randomUUID();
  }
}

function reportDuration() {
  if (!pageViewId) return;
  const duration = Math.round((Date.now() - enterTime) / 1000);
  navigator.sendBeacon(
    `${API_BASE_URL}/api/pageview/${pageViewId}/duration`,
    JSON.stringify({ duration })
  );
}

// 页面隐藏 / 关闭时上报停留时长
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') reportDuration();
});

export const apiService = {
  async feedback({ email, message, source, metadata } = {}) {
    try {
      const body = {
        brandName: BRAND_NAME,
        domain: DOMAIN,
        message,
      };
      if (email) body.email = email;
      if (source) body.source = source;
      if (metadata) body.metadata = metadata;

      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      return response.json();
    } catch (error) {
      console.warn('Failed to submit feedback:', error);
      throw error;
    }
  },

  async subscribe(email) {
    if (isLocal) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: BRAND_NAME,
          domain: DOMAIN,
          email,
        }),
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }
      
      return response.json();
    } catch (error) {
      console.warn('Failed to subscribe:', error);
      throw error;
    }
  },

  async pageview(pageUrl, referrer = '') {
    if (isLocal) return null;
    const payload = {
      brandName: BRAND_NAME,
      domain: DOMAIN,
      pageUrl: pageUrl || window.location.href,
      referrer: referrer || document.referrer || undefined,
      visitorId: getVisitorId(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
      });

      const data = await response.json();
      pageViewId = data.id;  // 保存 id，用于后续停留时长上报
      return data;
    } catch (error) {
      console.debug('Pageview tracking unavailable:', error.message);
      return null;
    }
  },
};

export default apiService;
