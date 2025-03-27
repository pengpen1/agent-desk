declare module '@modelcontextprotocol/sdk' {
  interface ClientInfo {
    name: string;
    version: string;
  }

  export class Client {
    constructor(clientInfo: ClientInfo, options: ClientOptions);
    connect(transport: Transport): Promise<void>;
    disconnect(): Promise<void>;
    callTool(toolCall: ToolCall): Promise<ToolCallResult>;
  }

  export interface Transport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  export class SSEClientTransport implements Transport {
    constructor(options: { baseUrl: string });
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  export class StdioClientTransport implements Transport {
    constructor(options: { command: string; args: string[] });
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  export interface ClientOptions {
    capabilities: {
      prompts: Record<string, unknown>;
      resources: Record<string, unknown>;
      tools: Record<string, unknown>;
    };
  }

  export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
  }

  export interface ToolCallResult {
    content?: Array<{
      text?: string;
    }>;
    isError?: boolean;
  }
} 