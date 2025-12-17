import router from '@/router';
import { doLogout, getCookie } from '@/utils/auth';
import { updateHttps } from '@/utils/common';
import axios from 'axios';

let baseURL = '';
// Web 和 Electron 跑在不同端口避免同时启动时冲突
if (process.env.IS_ELECTRON) {
  if (process.env.NODE_ENV === 'production') {
    baseURL = process.env.VUE_APP_ELECTRON_API_URL;
  } else {
    baseURL = process.env.VUE_APP_ELECTRON_API_URL_DEV;
  }
} else {
  baseURL = process.env.VUE_APP_NETEASE_API_URL;
}

const service = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

// 缓存 localStorage 解析结果，避免每次请求都重新解析
let cachedSettings = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5000; // 5秒缓存时间

function getCachedSettings() {
  const now = Date.now();
  if (!cachedSettings || now - settingsCacheTime > SETTINGS_CACHE_TTL) {
    try {
      cachedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
      settingsCacheTime = now;
    } catch (error) {
      console.warn('[request.js] Failed to parse settings:', error);
      cachedSettings = {};
    }
  }
  return cachedSettings;
}

// 监听 storage 事件，当设置更改时清除缓存
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === 'settings') {
      cachedSettings = null;
    }
  });
}

service.interceptors.request.use(function (config) {
  if (!config.params) config.params = {};
  if (baseURL.length) {
    if (
      baseURL[0] !== '/' &&
      !process.env.IS_ELECTRON &&
      getCookie('MUSIC_U') !== null
    ) {
      const musicU = getCookie('MUSIC_U');
      const cookies = (config.params.cookie || '')
        .split(';')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const cookieMap = {};
      cookies.forEach(c => {
        const i = c.indexOf('=');
        if (i !== -1) cookieMap[c.substring(0, i)] = c.substring(i + 1);
      });

      // 覆盖/添加
      if (musicU) cookieMap['MUSIC_U'] = musicU;
      cookieMap['os'] = 'pc';

      config.params.cookie = Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
    }
  } else {
    console.error("You must set up the baseURL in the service's config");
  }

  if (!process.env.IS_ELECTRON && !config.url?.includes('/login')) {
    config.params.randomCNIP = true;
  }

  // Force real_ip - 使用缓存的设置
  const settings = getCachedSettings();
  if (process.env.VUE_APP_REAL_IP) {
    config.params.realIP = process.env.VUE_APP_REAL_IP;
  } else if (settings.enableRealIP) {
    config.params.realIP = settings.realIP;
  }

  const proxy = settings.proxyConfig;
  if (proxy && ['HTTP', 'HTTPS'].includes(proxy.protocol)) {
    config.params.proxy = `${proxy.protocol}://${proxy.server}:${proxy.port}`;
  }

  return config;
});

service.interceptors.response.use(
  response => {
    const res = response.data;

    // 递归处理所有图片 URL，将 HTTP 转换为 HTTPS (原地修改以提升性能)
    function httpsifyImageUrls(obj) {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          httpsifyImageUrls(obj[i]);
        }
        return obj;
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          // 处理图片相关字段
          if (
            typeof value === 'string' &&
            (key === 'picUrl' ||
              key === 'coverImgUrl' ||
              key === 'avatarUrl' ||
              key === 'backgroundCoverUrl' ||
              key === 'img1v1Url' ||
              key === 'imgUrl' ||
              key === 'cover' ||
              key === 'avatar')
          ) {
            if (value.startsWith('http:')) {
              obj[key] = updateHttps(value);
            }
          } else if (typeof value === 'object' && value !== null) {
            httpsifyImageUrls(value);
          }
        }
      }
      return obj;
    }

    httpsifyImageUrls(res);
    return res;
  },
  async error => {
    /** @type {import('axios').AxiosResponse | null} */
    let response;
    let data;
    if (error.response) {
      response = error.response;
      data = response.data;
    }

    if (
      response &&
      typeof data === 'object' &&
      data.code === 301 &&
      data.msg === '需要登录'
    ) {
      console.warn('Token has expired. Logout now!');

      // 登出帳戶
      doLogout();

      // 導向登入頁面
      if (process.env.IS_ELECTRON === true) {
        router.push({ name: 'loginAccount' });
      } else {
        router.push({ name: 'login' });
      }
    }

    return Promise.reject(error);
  }
);

export default service;
