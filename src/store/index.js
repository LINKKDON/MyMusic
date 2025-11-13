import Vue from 'vue';
import Vuex from 'vuex';
import state from './state';
import mutations from './mutations';
import actions from './actions';
import { changeAppearance } from '@/utils/common';
import Player from '@/utils/Player';
// vuex 自定义插件
import saveToLocalStorage from './plugins/localStorage';
import { getSendSettingsPlugin } from './plugins/sendSettings';

Vue.use(Vuex);

// 防抖函数 - 用于优化localStorage写入频率
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let plugins = [saveToLocalStorage];
if (process.env.IS_ELECTRON === true) {
  let sendSettings = getSendSettingsPlugin();
  plugins.push(sendSettings);
}
const options = {
  state,
  mutations,
  actions,
  plugins,
};

const store = new Vuex.Store(options);

if ([undefined, null].includes(store.state.settings.lang)) {
  const defaultLang = 'en';
  const langMapper = new Map()
    .set('zh', 'zh-CN')
    .set('zh-TW', 'zh-TW')
    .set('en', 'en')
    .set('tr', 'tr');
  store.state.settings.lang =
    langMapper.get(
      langMapper.has(navigator.language)
        ? navigator.language
        : navigator.language.slice(0, 2)
    ) || defaultLang;
  localStorage.setItem('settings', JSON.stringify(store.state.settings));
}

changeAppearance(store.state.settings.appearance);

window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (store.state.settings.appearance === 'auto') {
      changeAppearance(store.state.settings.appearance);
    }
  });

let player = new Player();

// 创建防抖的保存函数 - 500ms内的多次写入会被合并为一次
const debouncedSave = debounce(target => target.saveSelfToLocalStorage(), 500);

player = new Proxy(player, {
  set(target, prop, val) {
    // console.log({ prop, val });
    target[prop] = val;
    if (prop === '_howler') return true;

    // 使用防抖函数优化localStorage写入频率
    debouncedSave(target);
    target.sendSelfToIpcMain();
    return true;
  },
});
store.state.player = player;

export default store;
