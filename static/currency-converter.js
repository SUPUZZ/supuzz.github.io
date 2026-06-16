/**
 * Currency Converter Module
 * 自动获取汇率并转换价格
 */

const CurrencyConverter = {
  // 默认汇率（备用）
  defaultRates: {
    USD: 1,
    EUR: 0.92,
    JPY: 149.5,
    CNY: 7.2
  },
  
  // 缓存配置
  cacheKey: 'supuzz_exchange_rates',
  cacheExpiry: 24 * 60 * 60 * 1000, // 24小时

  // 货币配置
  currencies: {
    es: { code: 'EUR', symbol: '€', position: 'before' },
    ja: { code: 'JPY', symbol: '¥', position: 'before' }
  },

  /**
   * 获取缓存的汇率
   */
  getCachedRates() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheExpiry) {
          return rates;
        }
      }
    } catch (e) {
      console.warn('Failed to get cached rates:', e);
    }
    return null;
  },

  /**
   * 保存汇率到缓存
   */
  saveRatesToCache(rates) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        rates,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache rates:', e);
    }
  },

  /**
   * 从API获取汇率
   */
  async fetchRates() {
    try {
      // 使用 frankfurter.app 免费API
      const response = await fetch(
        'https://api.frankfurter.app/latest?from=USD'
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      // 添加EUR和JPY的汇率
      return {
        USD: 1,
        EUR: data.rates.EUR,
        JPY: data.rates.JPY,
        CNY: data.rates.CNY || 7.2
      };
    } catch (error) {
      console.warn('Failed to fetch rates, using defaults:', error);
      return this.defaultRates;
    }
  },

  /**
   * 获取汇率（优先缓存，失败则请求）
   */
  async getRates() {
    // 优先使用缓存
    const cachedRates = this.getCachedRates();
    if (cachedRates) {
      return cachedRates;
    }

    // 请求新汇率
    const rates = await this.fetchRates();
    
    // 保存到缓存
    this.saveRatesToCache(rates);
    
    return rates;
  },

  /**
   * 转换价格
   */
  convertPrice(usdPrice, fromCurrency, toCurrency) {
    const rates = this.defaultRates; // 使用默认汇率
    if (fromCurrency === toCurrency) {
      return usdPrice;
    }
    
    // 转换到USD，再转换到目标货币
    const inUSD = usdPrice / (rates[fromCurrency] || 1);
    const result = inUSD * (rates[toCurrency] || 1);
    
    return result;
  },

  /**
   * 格式化价格
   */
  formatPrice(amount, currency) {
    const config = this.currencies[currency] || { code: 'USD', symbol: '$', position: 'before' };
    
    // JPY 不需要小数
    const decimals = currency === 'ja' ? 0 : 2;
    const formatted = amount.toFixed(decimals);
    
    if (config.position === 'before') {
      return `${config.symbol}${formatted}`;
    } else {
      return `${formatted}${config.symbol}`;
    }
  },

  /**
   * 初始化价格转换
   */
  async init() {
    const rates = await this.getRates();
    
    // 存储到全局，供格式化函数使用
    window.supuzzRates = rates;
    window.supuzzCurrencies = this.currencies;
    
    return rates;
  },

  /**
   * 更新页面上的价格显示
   */
  async updatePrices(lang) {
    const rates = await this.getRates();
    const currencyConfig = this.currencies[lang];
    
    if (!currencyConfig) return;

    const targetCurrency = currencyConfig.code;
    
    // 查找所有带 data-usd-price 属性的元素
    document.querySelectorAll('[data-usd-price]').forEach(el => {
      const usdPrice = parseFloat(el.dataset.usdPrice);
      if (!isNaN(usdPrice)) {
        const convertedPrice = this.convertPrice(usdPrice, 'USD', targetCurrency);
        const formattedPrice = this.formatPrice(convertedPrice, lang);
        el.textContent = formattedPrice;
      }
    });

    // 查找所有带 data-usd 属性的元素（直接是美元价格）
    document.querySelectorAll('[data-usd]').forEach(el => {
      const usdPrice = parseFloat(el.dataset.usd);
      if (!isNaN(usdPrice)) {
        const convertedPrice = this.convertPrice(usdPrice, 'USD', targetCurrency);
        const formattedPrice = this.formatPrice(convertedPrice, lang);
        el.textContent = formattedPrice;
      }
    });
  }
};

// 导出
window.CurrencyConverter = CurrencyConverter;
