const API_BASE_URL = 'https://api.supuzz.cn';
const BRAND_NAME = 'supuzz-us';
const DOMAIN = 'supuzz.com';

const isLocal = /^localhost$|^127\.|^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname);

// ── 访客标识 & 停留时长 ──
let enterTime = Date.now();
let pageViewId = null;
let durationReportPending = false;
let lastReportedDuration = 0;

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
  if (!pageViewId) {
    durationReportPending = true;
    return;
  }

  const duration = Math.min(86400, Math.max(1, Math.round((Date.now() - enterTime) / 1000)));
  if (duration <= lastReportedDuration) return;

  const endpoint = `${API_BASE_URL}/api/pageview/${pageViewId}/duration`;

  // 统一用 sendBeacon（POST + text/plain）：CORS 简单请求、无需预检，页面卸载时更可靠。
  navigator.sendBeacon(endpoint, JSON.stringify({ duration }));
  lastReportedDuration = duration;
}

// 页面隐藏 / 关闭时上报停留时长
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') reportDuration();
});
window.addEventListener('pagehide', reportDuration);

function getPageLanguage() {
  const path = window.location.pathname || '';
  for (const dir of ['es', 'ja', 'zh-Hant', 'de', 'pt', 'fr']) {
    if (path.indexOf('/' + dir + '/') !== -1) return dir;
  }
  return 'en';
}

// Campaign attribution for the newsletter: read explicit source first, then UTM.
function readSubscriptionContext() {
  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
    term: params.get('utm_term') || undefined,
  };
  for (const key of Object.keys(utm)) if (utm[key] === undefined) delete utm[key];
  return {
    urlSource: params.get('source') || undefined,
    utm: Object.keys(utm).length ? utm : undefined,
  };
}

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

  async subscribe(email, options = {}) {
    if (isLocal) return null;
    try {
      const context = readSubscriptionContext();
      const body = {
        brandName: BRAND_NAME,
        domain: DOMAIN,
        email,
        source: options.source || context.urlSource || (context.utm && context.utm.source) || 'website',
        campaign: options.campaign || (context.utm && context.utm.campaign),
        language: options.language || getPageLanguage(),
      };
      if (context.utm) body.utm = context.utm;
      for (const key of Object.keys(body)) if (body[key] === undefined) delete body[key];

      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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

  // Community co-creation: upload a build photo or submit a written article.
  // `formData` is a FormData instance; do not set Content-Type so the browser
  // can add the multipart boundary automatically.
  async submitCommunity(formData) {
    if (isLocal) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/submissions`, {
        method: 'POST',
        body: formData,
        credentials: 'omit',
      });

      if (!response.ok) {
        let message = 'Failed to submit';
        try {
          const data = await response.json();
          if (data && (data.message || data.error)) message = data.message || data.error;
        } catch (error) {
          // Non-JSON error body; keep the generic message.
        }
        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      console.warn('Failed to submit community content:', error);
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
      if (durationReportPending || document.visibilityState === 'hidden') {
        reportDuration();
      }
      return data;
    } catch (error) {
      console.debug('Pageview tracking unavailable:', error.message);
      return null;
    }
  },
};

export default apiService;
