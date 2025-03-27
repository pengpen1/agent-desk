import { ServerConfig } from '../store/slices/serverSlice';
import { getMcpSdk, MCPClient, Transport, ToolCallParams, ToolCallResult } from './McpSdk';

// 服务和返回类型定义
export interface Service {
  id: string;
  name: string;
  description: string;
}

export interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  toolCalls: Array<{
    name: string;
    description: string;
  }>;
}

export interface ServiceResponse {
  result: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

let mcpClient: MCPClient | null = null;
let activeTransport: Transport | null = null;

/**
 * 连接到MCP服务器
 */
export async function connectToServer(config: ServerConfig): Promise<boolean> {
  try {
    // 如果已有连接，先断开
    if (mcpClient) {
      await disconnectFromServer();
    }

    // 加载SDK
    const sdk = await getMcpSdk();
    
    // 根据服务器类型创建适当的传输实例
    if (config.type === 'http') {
      activeTransport = new sdk.SSEClientTransport({
        baseUrl: config.config.baseUrl || 'http://localhost:3000',
      });
    } else if (config.type === 'command') {
      activeTransport = new sdk.StdioClientTransport({
        command: config.config.command || '',
        args: config.config.command ? config.config.command.split(' ') : [],
      });
    } else if (config.type === 'package') {
      // 处理package类型配置
      const packageManager = config.config.packageManager || 'npx';
      const packageName = config.config.packageName || '';
      
      if (!packageName) {
        console.error('Package name is required for package type connection');
        return false;
      }
      
      activeTransport = new sdk.StdioClientTransport({
        command: packageManager,
        args: [packageName],
      });
    } else {
      console.error('Unknown server type:', config.type);
      return false;
    }

    // 创建客户端实例
    mcpClient = new sdk.Client(
      { name: 'mcp-client', version: '1.0.0' },
      { clientId: 'mcp-client-' + Date.now() }
    );

    // 连接到服务器
    await mcpClient.connect(activeTransport);
    return true;
  } catch (error) {
    console.error('Failed to connect to MCP server:', error);
    mcpClient = null;
    activeTransport = null;
    return false;
  }
}

/**
 * 断开与MCP服务器的连接
 */
export async function disconnectFromServer(): Promise<boolean> {
  if (!mcpClient) {
    return true; // 已经断开连接
  }
  
  try {
    // SDK可能没有直接提供disconnect方法，我们通过清除客户端引用来断开连接
    mcpClient = null;
    activeTransport = null;
    return true;
  } catch (error) {
    console.error('Failed to disconnect from MCP server:', error);
    return false;
  }
}

/**
 * 获取可用服务列表
 */
export async function getServices(): Promise<Service[]> {
  if (!mcpClient) {
    console.error('Not connected to MCP server');
    return [];
  }

  try {
    const response = await mcpClient.callTool({
      method: 'rpc.discover',
    });

    if (response.error) {
      console.error('Error getting services:', response.error);
      return [];
    }

    // 转换返回结果为Service类型
    const services = response.result as Record<string, unknown>[] || [];
    return services.map((service) => ({
      id: service.id as string,
      name: (service.name as string) || service.id as string,
      description: (service.description as string) || '',
    }));
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
}

/**
 * 获取服务详情
 */
export async function getServiceDetails(serviceId: string): Promise<ServiceDetail | null> {
  if (!mcpClient) {
    console.error('Not connected to MCP server');
    return null;
  }

  try {
    const response = await mcpClient.callTool({
      method: 'rpc.describe',
      params: {
        id: serviceId,
      },
    });

    if (response.error) {
      console.error(`Error getting details for service ${serviceId}:`, response.error);
      return null;
    }

    const result = response.result as Record<string, unknown>;
    const toolCalls = (result.toolCalls as Record<string, unknown>[]) || [];
    
    return {
      id: result.id as string,
      name: (result.name as string) || result.id as string,
      description: (result.description as string) || '',
      toolCalls: toolCalls.map((tool) => ({
        name: tool.name as string,
        description: (tool.description as string) || '',
      })),
    };
  } catch (error) {
    console.error(`Error getting details for service ${serviceId}:`, error);
    return null;
  }
}

/**
 * 调用服务方法
 */
export async function invokeService(
  serviceId: string,
  method: string,
  params: Record<string, unknown> = {}
): Promise<ServiceResponse> {
  if (!mcpClient) {
    return {
      result: null,
      error: {
        code: -32000,
        message: 'Not connected to MCP server',
      },
    };
  }

  try {
    const callParams: ToolCallParams = {
      method: `${serviceId}.${method}`,
      params,
    };

    const response = await mcpClient.callTool(callParams);
    return {
      result: response.result,
      error: response.error,
    };
  } catch (error) {
    console.error(`Error invoking ${serviceId}.${method}:`, error);
    return {
      result: null,
      error: {
        code: -32603,
        message: `Error invoking ${serviceId}.${method}: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
} 