// src/popup/main.js
import { render, renderLogs } from './ui.js';
import { getVueInfo, navigateTo, toggleLoginHook } from '../services/injector.js';

document.addEventListener('DOMContentLoaded', async () => {
  const injectBtn = document.getElementById('injectBtn');
  const hookToggle = document.getElementById('hookToggle');
  const hookKeywordsInput = document.getElementById('hookKeywords');
  const routesTableContainer = document.getElementById('routes-table-container');
  let currentTabId;
  let hookConfig = { enabled: false, keywords: ['login', 'logout'] };

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      renderLogs(['No active tab found.']);
      return;
    }
    currentTabId = tabs[0].id;

    // 尝试从后台加载数据
    const response = await chrome.runtime.sendMessage({ type: 'GET_DATA', tabId: currentTabId });
    if (response && response.data) {
      if (response.data.vueInfo) {
        render(response.data.vueInfo);
      }
      // 合并后台存储的配置
      hookConfig = { ...hookConfig, ...response.data.hookConfig };
    }
    // 更新UI
    hookToggle.checked = hookConfig.enabled;
    hookKeywordsInput.value = hookConfig.keywords.join(',');

  } catch (error) {
    renderLogs(['Error initializing popup: ' + error.message]);
  }

  // 注入按钮点击事件
  injectBtn.addEventListener('click', async () => {
    if (!currentTabId) return;
    try {
      const vueInfo = await getVueInfo(currentTabId);
      await chrome.runtime.sendMessage({ type: 'SET_VUE_INFO', tabId: currentTabId, data: vueInfo });
      render(vueInfo);
    } catch (error) {
      renderLogs(['Error injecting script: ' + error.message]);
    }
  });

  // 更新 Hook 配置的函数
  async function updateHookConfig() {
    if (!currentTabId) return;
    hookConfig.enabled = hookToggle.checked;
    hookConfig.keywords = hookKeywordsInput.value.split(',').map(k => k.trim()).filter(Boolean);
    
    await chrome.runtime.sendMessage({ type: 'SET_HOOK_CONFIG', tabId: currentTabId, hookConfig: hookConfig });
    toggleLoginHook(currentTabId, hookConfig.enabled, hookConfig.keywords);
  }

  // Hook 开关点击事件
  hookToggle.addEventListener('change', updateHookConfig);
  // 关键字输入框输入事件 (debounce a bit)
  let debounceTimer;
  hookKeywordsInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateHookConfig, 500);
  });

  // 为路由表格添加事件委托
  routesTableContainer.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('visit-btn')) {
      const path = event.target.dataset.path;
      if (currentTabId && path) {
        navigateTo(currentTabId, path);
      }
    }
  });
});
