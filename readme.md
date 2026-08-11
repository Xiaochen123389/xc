# TMS 供应链管理系统原型

这是一个基于纯 HTML/CSS/JS 的 TMS（Transportation Management System）供应链管理系统原型，包含 13 个业务页面。

## 在线预览

直接访问单文件原型：

- **GitHub Pages**: `https://<你的用户名>.github.io/<仓库名>/tms-prototype.html`
- **本地打开**: 将 `tms-prototype.html` 下载到本地后用浏览器打开即可

## 仓库内容

| 目录/文件 | 说明 |
|----------|------|
| `pages/` | 13 个业务页面源码 |
| `assets/app.js` | 全局交互组件库 |
| `design-tokens.css` | 设计 token |
| `build-single-file.js` | 单文件构建脚本 |
| `tms-prototype.html` | 构建后的单文件原型（需复制到仓库根目录或桌面） |
| `tms-server.js` | 本地预览服务器 |

## 页面列表

1. 工作台 `dashboard.html`
2. 创建运单 `waybill-create.html`
3. 运单列表 `waybill-list.html`
4. 提单创建 `bill-create.html`
5. 提单列表 `bill-list.html`
6. 应收账单 `receivable.html`
7. 应付账单 `payable.html`
8. 地址簿 `address.html`
9. 服务商管理 `service.html`
10. 运价管理 `rates.html`
11. 超限审批 `oversize.html`
12. 登录 `login.html`
13. 演示入口 `demo-entry.html`

## 本地运行

```bash
npm install
node tms-server.js
```

默认访问 `http://localhost:3000`

## 构建单文件原型

```bash
node build-single-file.js
```

输出到桌面：`C:\Users\%USERNAME%\Desktop\tms-prototype.html`
