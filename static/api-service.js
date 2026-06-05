const API_BASE_URL = 'https://api.supuzz.cn';
const BRAND_NAME = 'supuzz-us';
const DOMAIN = 'supuzz.com';

export const apiService = {
  async feedback(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: BRAND_NAME,
          domain: DOMAIN,
          ...data,
        }),
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
    const payload = {
      brandName: BRAND_NAME,
      domain: DOMAIN,
      pageUrl: window.location.href,
      referrer: referrer || document.referrer,
      userAgent: navigator.userAgent,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
        keepalive: true,
      });
      
      return response.json();
    } catch (error) {
      console.debug('Pageview tracking unavailable:', error.message);
      return null;
    }
  },
};

export default apiService;