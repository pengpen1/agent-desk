import { ServerConfig } from './slices/serverSlice';

// 定义 RootState 类型
export interface RootState {
  server: {
    configs: ServerConfig[];
    activeConfigId: string | null;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
  };
  theme: {
    mode: 'light' | 'dark';
  };
}

// 导出 AppDispatch 类型
export type AppDispatch = any; // 暂时使用 any，稍后可以更新为具体类型 