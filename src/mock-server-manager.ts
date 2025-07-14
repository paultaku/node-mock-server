import { Server } from "http";
import { startMockServer } from "./server";

export interface MockServerConfig {
  port: number;
  mockRoot?: string;
  autoStart?: boolean;
}

export class MockServerManager {
  private server: Server | null = null;
  private port: number;
  private mockRoot: string;
  private isRunning: boolean = false;

  constructor(config: MockServerConfig) {
    this.port = config.port;
    this.mockRoot = config.mockRoot || "./mock";

    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Server is already running on port ${this.port}`);
      return;
    }

    try {
      await startMockServer(this.port);
      this.isRunning = true;
      console.log(
        `MockServerManager: Server started successfully on port ${this.port}`
      );
    } catch (error) {
      console.error(
        `MockServerManager: Failed to start server on port ${this.port}:`,
        error
      );
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRunning) {
        console.log("Server is not running");
        resolve();
        return;
      }

      if (this.server) {
        this.server.close((error) => {
          if (error) {
            console.error("Error stopping server:", error);
            reject(error);
          } else {
            this.isRunning = false;
            this.server = null;
            console.log(
              `MockServerManager: Server stopped on port ${this.port}`
            );
            resolve();
          }
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }

  /**
   * 重启服务器
   */
  async restart(): Promise<void> {
    console.log("Restarting server...");
    await this.stop();
    await this.start();
    console.log("Server restarted successfully");
  }

  /**
   * 检查服务器是否正在运行
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取服务器端口
   */
  getPort(): number {
    return this.port;
  }

  /**
   * 获取 mock 根目录
   */
  getMockRoot(): string {
    return this.mockRoot;
  }

  /**
   * 获取服务器状态信息
   */
  getStatus(): {
    isRunning: boolean;
    port: number;
    mockRoot: string;
    url: string;
  } {
    return {
      isRunning: this.isRunning,
      port: this.port,
      mockRoot: this.mockRoot,
      url: `http://localhost:${this.port}`,
    };
  }
}

// 创建多个服务器实例的管理器
export class MultiServerManager {
  private servers: Map<number, MockServerManager> = new Map();

  /**
   * 创建并启动一个服务器
   */
  async createServer(
    port: number,
    config?: Partial<MockServerConfig>
  ): Promise<MockServerManager> {
    if (this.servers.has(port)) {
      throw new Error(`Server on port ${port} already exists`);
    }

    const serverConfig: MockServerConfig = {
      port,
      autoStart: false,
      ...config,
    };

    const server = new MockServerManager(serverConfig);
    await server.start();
    this.servers.set(port, server);

    return server;
  }

  /**
   * 停止并移除一个服务器
   */
  async removeServer(port: number): Promise<void> {
    const server = this.servers.get(port);
    if (!server) {
      throw new Error(`Server on port ${port} not found`);
    }

    await server.stop();
    this.servers.delete(port);
  }

  /**
   * 停止所有服务器
   */
  async stopAllServers(): Promise<void> {
    const stopPromises = Array.from(this.servers.values()).map((server) =>
      server.stop()
    );
    await Promise.all(stopPromises);
    this.servers.clear();
  }

  /**
   * 获取所有服务器状态
   */
  getAllServerStatus(): Array<{
    port: number;
    status: ReturnType<MockServerManager["getStatus"]>;
  }> {
    return Array.from(this.servers.entries()).map(([port, server]) => ({
      port,
      status: server.getStatus(),
    }));
  }

  /**
   * 获取特定端口的服务器
   */
  getServer(port: number): MockServerManager | undefined {
    return this.servers.get(port);
  }

  /**
   * 检查端口是否被使用
   */
  isPortInUse(port: number): boolean {
    return this.servers.has(port);
  }
}

// 导出便捷函数
export function createMockServer(port: number = 3000): MockServerManager {
  return new MockServerManager({ port, autoStart: true });
}

export function createMultiServerManager(): MultiServerManager {
  return new MultiServerManager();
}
