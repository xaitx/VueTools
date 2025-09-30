// src/popup/ui.js

/**
 * 渲染日志
 * @param {string[]} logs - 日志数组
 */
export function renderLogs(logs) {
  const logsContainer = document.getElementById('logs-container');
  logsContainer.innerText = logs.join('\n');
}

/**
 * 渲染路由表格
 * @param {object[]} routes - 路由数组
 */
export function renderRoutesTable(routes) {
  const routesTableContainer = document.getElementById('routes-table-container');
  routesTableContainer.innerHTML = ''; // 清空旧表格

  if (!routes || routes.length === 0) {
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  thead.innerHTML = `
    <tr>
      <th>Path</th>
      <th>Title</th>
      <th>Action</th>
    </tr>
  `;

  routes.forEach(route => {
    const row = document.createElement('tr');
    let title = '';
    try {
      const meta = JSON.parse(route.meta);
      if (meta && meta.title) {
        title = meta.title;
      }
    } catch (e) { /* no-op */ }
    
    const displayName = title || route.name || '';

    row.innerHTML = `
      <td>${route.path}</td>
      <td>${displayName}</td>
      <td><button class="visit-btn" data-path="${route.path}">访问</button></td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  routesTableContainer.appendChild(table);
}

/**
 * 渲染整个UI
 * @param {object} data - 从注入脚本获取的数据
 */
export function render(data) {
  if (!data) return;
  renderLogs(data.logs || []);
  renderRoutesTable(data.allRoutes || []);
}
