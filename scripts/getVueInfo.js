(function () {
  const result = {
    logs: [],
    vueVersion: 'unknown',
    modifiedRoutes: [],
    allRoutes: []
  };

  function findVueRoot(root, maxDepth = 1000) {
    // ... (函数内容保持不变)
    const queue = [{ node: root, depth: 0 }];
    while (queue.length) {
      const { node, depth } = queue.shift();
      if (depth > maxDepth) break;
      if (node.__vue_app__ || node.__vue__ || node._vnode) {
        return node;
      }
      if (node.nodeType === 1 && node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          queue.push({ node: node.childNodes[i], depth: depth + 1 });
        }
      }
    }
    return null;
  }

  function findVueRouter(vueRoot) {
    // ... (函数内容保持不变)
    try {
      if (vueRoot.__vue_app__) return vueRoot.__vue_app__.config.globalProperties.$router;
      if (vueRoot.__vue__) return vueRoot.__vue__.$root.$options.router || vueRoot.__vue__._router;
    } catch (e) {
      result.logs.push('⚠️ 查找 Vue Router 时出错: ' + e.message);
    }
    return null;
  }
  
  function walkRoutes(routes, cb) {
    // ... (函数内容保持不变)
    routes.forEach(route => {
      cb(route);
      if (Array.isArray(route.children) && route.children.length) {
        walkRoutes(route.children, cb);
      }
    });
  }

  function isAuthTrue(val) {
    // ... (函数内容保持不变)
    return val === true || val === 'true' || val === 1 || val === '1';
  }

  function patchAllRouteAuth(router) {
    // ... (函数内容保持不变, 但将结果存入 result.modifiedRoutes)
    const modified = [];
    function patchMeta(route) {
      if (route.meta && typeof route.meta === 'object') {
        Object.keys(route.meta).forEach(key => {
          if (key.toLowerCase().includes('auth') && isAuthTrue(route.meta[key])) {
            route.meta[key] = false;
            modified.push({ path: route.path, name: route.name });
          }
        });
      }
    }
    if (typeof router.getRoutes === 'function') router.getRoutes().forEach(patchMeta);
    else if (router.options && Array.isArray(router.options.routes)) walkRoutes(router.options.routes, patchMeta);
    else result.logs.push('🚫 未识别的 Vue Router 版本，跳过 Route Auth Patch');
    
    result.modifiedRoutes = modified;
    if (modified.length) {
      result.logs.push(`🚀 已修改 ${modified.length} 个路由的 auth meta。`);
    } else {
      result.logs.push('ℹ️ 没有需要修改的路由 auth 字段。');
    }
  }

  function patchRouterGuards(router) {
    // ... (函数内容保持不变)
    ['beforeEach', 'beforeResolve', 'afterEach'].forEach(hook => {
      if (typeof router[hook] === 'function') router[hook] = () => {};
    });
    if (Array.isArray(router.beforeGuards)) router.beforeGuards.length = 0;
    if (Array.isArray(router.beforeHooks)) router.beforeHooks.length = 0;
    result.logs.push('✅ 路由守卫已清除。');
  }

  function listAllRoutes(router) {
    // ... (函数内容保持不变, 但将结果存入 result.allRoutes)
    const list = [];
    function joinPath(base, path) {
        if (!path) return base || '/';
        if (path.startsWith('/')) return path;
        if (!base || base === '/') return '/' + path;
        return (base.endsWith('/') ? base.slice(0, -1) : base) + '/' + path;
    }
    if (typeof router.getRoutes === 'function') {
        router.getRoutes().forEach(r => list.push({ name: r.name, path: r.path, meta: JSON.stringify(r.meta || {}) }));
    } else if (router.options && Array.isArray(router.options.routes)) {
        function traverse(routes, basePath) {
            routes.forEach(r => {
                const fullPath = joinPath(basePath, r.path);
                list.push({ name: r.name, path: fullPath, meta: JSON.stringify(r.meta || {}) });
                if (Array.isArray(r.children) && r.children.length) traverse(r.children, fullPath);
            });
        }
        traverse(router.options.routes, '');
    } else {
        result.logs.push('🚫 无法列出路由信息。');
        return;
    }
    result.allRoutes = list;
    result.logs.push(`🔍 共找到 ${list.length} 个路由。`);
  }

  // ======== 主流程 ========
  const vueRoot = findVueRoot(document.body);
  if (!vueRoot) {
    result.logs.push('❌ 未检测到 Vue 实例。');
    return result;
  }
  result.logs.push('✅ Vue 实例已找到。');

  const router = findVueRouter(vueRoot);
  if (!router) {
    result.logs.push('❌ 未检测到 Vue Router 实例。');
    return result;
  }
  result.logs.push('✅ Vue Router 实例已找到。');
  
  result.vueVersion = vueRoot.__vue_app__?.version || vueRoot.__vue__?.$root?.$options?._base?.version || 'unknown';
  result.logs.push(`✅ Vue 版本: ${result.vueVersion}`);

  patchAllRouteAuth(router);
  patchRouterGuards(router);
  listAllRoutes(router);

  return result;
})();
