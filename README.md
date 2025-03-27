# MCP Client

MCP Client 是一个基于 Electron 和 React 的桌面客户端应用，用于管理和操作 MCPService 实现。

## 特性

- **多种服务器连接方式**：
  - HTTP/SSE 连接
  - 命令行启动
  - 包管理器（npx、bun、uvx 等）启动

- **服务操作功能**：
  - 查看可用的 MCP 服务
  - 调用服务并显示结果
  - 参数编辑

- **开发工具**：
  - 请求调试
  - 响应分析
  - 日志查看

- **用户体验**：
  - 深色/浅色主题切换
  - 国际化支持（英语、中文）

## 技术栈

- Electron
- React
- TypeScript
- Redux Toolkit
- TailwindCSS
- Monaco Editor

## 开发

### 前置条件

- Node.js (v18+)
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
# 启动 React 开发服务器
npm run dev

# 另一个终端启动 Electron
npm run electron:dev
```

### 构建

```bash
npm run build
npm run electron:build
```

## 使用指南

### 服务器连接

1. 在主页点击"添加服务器"
2. 选择服务器类型（HTTP/SSE、命令行或包管理器）
3. 输入所需配置
4. 保存后点击"连接"按钮连接到服务器

### 服务调用

1. 连接到服务器后，点击导航栏的"服务"查看可用服务
2. 点击服务卡片进入服务调用页面
3. 在参数编辑器中编写 JSON 格式的参数
4. 点击"调用"按钮执行服务调用
5. 查看右侧面板中的调用结果

### 设置

在"设置"页面可以：
- 切换深色/浅色主题
- 更改应用语言

## 许可证

MIT
