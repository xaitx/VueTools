// src/services/injector.js

/**
 * 执行脚本以获取 Vue 信息
 * @param {number} tabId - 标签页ID
 * @returns {Promise<object>} - 包含 Vue 信息的 Promise
 */
export function getVueInfo(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['scripts/getVueInfo.js'],
        world: 'MAIN'
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        if (injectionResults && injectionResults.length > 0 && injectionResults[0].result) {
          resolve(injectionResults[0].result);
        } else {
          reject(new Error("No result returned from the script."));
        }
      }
    );
  });
}

/**
 * 执行导航到指定路径的脚本
 * @param {number} tabId - 标签页ID
 * @param {string} path - 目标路径
 */
export function navigateTo(tabId, path) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    world: 'MAIN',
    func: (targetPath) => {
      function findVueRoot(root, maxDepth = 1000) {
        const queue = [{ node: root, depth: 0 }];
        while (queue.length) {
          const { node, depth } = queue.shift();
          if (depth > maxDepth) break;
          if (node.__vue_app__ || node.__vue__ || node._vnode) return node;
          if (node.nodeType === 1 && node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
              queue.push({ node: node.childNodes[i], depth: depth + 1 });
            }
          }
        }
        return null;
      }

      function findVueRouter(vueRoot) {
        try {
          if (vueRoot.__vue_app__) return vueRoot.__vue_app__.config.globalProperties.$router;
          if (vueRoot.__vue__) return vueRoot.__vue__.$root.$options.router || vueRoot.__vue__._router;
        } catch (e) { /* no-op */ }
        return null;
      }

      const vueRoot = findVueRoot(document.body);
      if (vueRoot) {
        const router = findVueRouter(vueRoot);
        if (router && typeof router.push === 'function') {
          router.push(targetPath);
        }
      }
    },
    args: [path]
  });
}

/**
 * 切换 router.push 的 Hook
 * @param {number} tabId - 标签页ID
 * @param {boolean} enable - 是否启用 Hook
 * @param {string[]} keywords - 要拦截的关键字数组
 */
export function toggleLoginHook(tabId, enable, keywords = []) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    world: 'MAIN',
    func: (shouldEnable, blockKeywords) => {
      function findVueRouter(vueRoot) {
        try {
          if (vueRoot.__vue_app__) return vueRoot.__vue_app__.config.globalProperties.$router;
          if (vueRoot.__vue__) return vueRoot.__vue__.$root.$options.router || vueRoot.__vue__._router;
        } catch (e) { /* no-op */ }
        return null;
      }
      
      function findVueRoot(root, maxDepth = 1000) {
        const queue = [{ node: root, depth: 0 }];
        while (queue.length) {
            const { node, depth } = queue.shift();
            if (depth > maxDepth) break;
            if (node.__vue_app__ || node.__vue__ || node._vnode) return node;
            if (node.nodeType === 1 && node.childNodes) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    queue.push({ node: node.childNodes[i], depth: depth + 1 });
                }
            }
        }
        return null;
      }

      const vueRoot = findVueRoot(document.body);
      if (!vueRoot) return;
      
      const router = findVueRouter(vueRoot);
      if (!router) return;

      // 在 router 对象上存储原始的 push 方法
      if (!router._originalPush) {
        router._originalPush = router.push;
      }

      if (shouldEnable) {
        router.push = function(...args) {
          const path = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].path);
          if (path) {
            const shouldBlock = blockKeywords.some(keyword => path.toLowerCase().includes(keyword.toLowerCase()));
            if (shouldBlock) {
              console.log(`[JS Injector] Blocked navigation to: ${path}`);
              return; // 阻止跳转
            }
          }
          return router._originalPush.apply(this, args);
        };
      } else {
        // 恢复原始的 push 方法
        if (router._originalPush) {
          router.push = router._originalPush;
        }
      }
    },
    args: [enable, keywords]
  });
}
