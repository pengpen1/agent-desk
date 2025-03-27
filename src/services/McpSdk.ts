/**
 * MCP SDK 封装适配器
 */

// 基本接口定义
export interface ToolCallParams {
  method: string;
  params?: Record<string, unknown>;
}

export interface ToolCallResult {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPClient {
  connect: (transport: Transport) => Promise<void>;
  callTool: (params: ToolCallParams) => Promise<ToolCallResult>;
}

export interface ClientInfo {
  name: string;
  version: string;
}

export interface ClientOptions {
  clientId?: string;
}

export interface Transport {
  isConnected?: boolean;
}

export interface SSETransportOptions {
  baseUrl: string;
}

export interface StdioTransportOptions {
  command: string;
  args: string[];
}

export interface MCPSdk {
  Client: new(clientInfo: ClientInfo, options?: ClientOptions) => MCPClient;
  SSEClientTransport: new(options: SSETransportOptions) => Transport;
  StdioClientTransport: new(options: StdioTransportOptions) => Transport;
}

/**
 * 动态加载 MCP SDK
 */
export async function getMcpSdk(): Promise<MCPSdk> {
  try {
    const clientModule = await import('@modelcontextprotocol/sdk/client/index.js');
    const sseModule = await import('@modelcontextprotocol/sdk/client/sse.js');
    const stdioModule = await import('@modelcontextprotocol/sdk/client/stdio.js');
    
    return {
      Client: clientModule.Client,
      SSEClientTransport: sseModule.SSEClientTransport,
      StdioClientTransport: stdioModule.StdioClientTransport
    };
  } catch (error) {
    console.error('Failed to load MCP SDK:', error);
    throw new Error(`MCP SDK 加载失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 