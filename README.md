# Agent Desk (MCP Client)

Agent Desk 是一个基于 Electron 和 React 的桌面客户端应用，用于管理和操作 MCPService 实现。

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

## 项目架构

### 目录结构

```text
agent-desk/
├── dist-electron/     # Electron 构建输出
├── electron/          # Electron 主进程代码
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── public/            # 静态资源
├── src/               # 前端源代码
│   ├── assets/        # 静态资源
│   ├── components/    # React 组件
│   ├── i18n/          # 国际化资源
│   │   └── locales/   # 语言文件
│   ├── pages/         # 页面组件
│   ├── services/      # 服务层
│   ├── store/         # Redux 状态管理
│   │   └── slices/    # Redux 切片
│   └── types/         # TypeScript 类型定义
└── ...                # 配置文件
```

### 核心模块

#### 1. Electron 主进程 (`electron/main.ts`)

主进程负责：

- 创建和管理应用窗口
- 处理窗口控制（最小化、最大化、关闭）
- 管理服务器进程（启动、监控、关闭）
- 持久化存储（使用 electron-store）
- 进程间通信（IPC）

#### 2. 服务层 (`src/services/`)

- **McpSdk.ts**: MCP SDK 的封装适配器，提供与 MCP 服务器通信的接口
- **McpClientService.ts**: 提供高级服务操作 API，包括：
  - 连接/断开服务器
  - 获取服务列表
  - 获取服务详情
  - 调用服务方法

#### 3. 状态管理 (`src/store/`)

使用 Redux Toolkit 管理应用状态：

- **serverSlice.ts**: 管理服务器配置和连接状态
- **themeSlice.ts**: 管理应用主题设置

#### 4. 页面组件 (`src/pages/`)

- **ServerManager.tsx**: 服务器管理页面，允许用户添加、连接和管理服务器
- **ServiceList.tsx**: 服务列表页面，显示当前连接服务器上的可用服务
- **ServiceInvoker.tsx**: 服务调用页面，提供参数编辑和结果显示
- **Settings.tsx**: 设置页面，管理主题和语言偏好

#### 5. 国际化 (`src/i18n/`)

使用 i18next 实现多语言支持：

- 英语 (en.json)
- 中文 (zh.json)

## 数据流

1. **服务器连接流程**：

   - 用户在 ServerManager 页面添加服务器配置
   - 配置存储到 Redux 和 electron-store
   - 连接时，通过 McpClientService 创建适当的传输实例
   - 连接状态更新到 Redux

2. **服务调用流程**：

   - 用户在 ServiceList 页面选择服务
   - ServiceInvoker 页面加载服务详情
   - 用户编辑 JSON 参数
   - 调用通过 McpClientService 发送到服务器
   - 结果显示在 Monaco Editor 中

3. **主题切换流程**：
   - 用户在 Settings 页面或头部导航切换主题
   - 主题状态更新到 Redux 和 electron-store
   - useEffect 钩子应用相应的 CSS 类

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
- 更改应用语言（英语、中文）

## 扩展开发

### 添加新的服务器类型

1. 在 `serverSlice.ts` 中扩展 `ServerConfig` 类型
2. 在 `McpClientService.ts` 中的 `connectToServer` 函数中添加处理逻辑
3. 在 `ServerManager.tsx` 中添加相应的 UI 表单

### 添加新的语言支持

1. 在 `src/i18n/locales/` 目录下创建新的语言文件
2. 在 `Settings.tsx` 中添加语言选项

## 许可证

MIT
