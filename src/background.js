// 使用 Map 在内存中为每个标签页存储数据
// 数据结构: { vueInfo: object, hookConfig: { enabled: boolean, keywords: string[] } }
const tabDataStore = new Map();

// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = request.tabId;
  let currentData = tabDataStore.get(tabId) || { 
    vueInfo: null, 
    hookConfig: { enabled: false, keywords: ['login', 'logout'] } 
  };

  switch (request.type) {
    case 'GET_DATA':
      sendResponse({ data: currentData });
      break;
    
    case 'SET_VUE_INFO':
      currentData.vueInfo = request.data;
      tabDataStore.set(tabId, currentData);
      sendResponse({ success: true });
      break;

    case 'SET_HOOK_CONFIG':
      currentData.hookConfig = request.hookConfig;
      tabDataStore.set(tabId, currentData);
      sendResponse({ success: true });
      break;
  }
  
  // 异步消息处理需要返回 true
  return true;
});

// 当标签页关闭时，清除关联的数据
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabDataStore.has(tabId)) {
    tabDataStore.delete(tabId);
  }
});

