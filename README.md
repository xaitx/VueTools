# VueTools - Vue.js DevTools Chrome 扩展

这是一个 Chrome 浏览器扩展，旨在帮助开发者调试和检查 Vue.js 应用程序。

## 功能

*   **弹出窗口界面**: 通过浏览器工具栏图标访问，提供核心功能的快速入口。
*   **Vue.js 信息检测**: 能够检测页面上的 Vue.js 实例并提取相关信息。
*   **脚本注入**: 动态向页面注入脚本以与 Vue.js 应用程序进行交互。

## 文件结构

```
manifest.json       # 扩展程序的配置文件
popup.html          # 弹出窗口的 HTML 结构
popup.css           # 弹出窗口的样式
images/             # 存放图标和图片
scripts/
    getVueInfo.js   # 用于获取 Vue 信息的脚本
src/
    background.js   # 扩展的后台服务脚本
    popup/
        main.js     # 弹出窗口的主要逻辑
        ui.js       # 弹出窗口的 UI 交互逻辑
    services/
        injector.js # 负责向页面注入脚本的服务
```

## 如何使用

1.  克隆此仓库。
2.  打开 Chrome 浏览器，进入 `chrome://extensions/`。
3.  启用“开发者模式”。
4.  点击“加载已解压的扩展程序”，然后选择项目根目录。

## 参考项目

*   [CloudVueRoute](https://github.com/cloud-jie/CloudVueRoute)

## 贡献

欢迎提交问题和拉取请求。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
