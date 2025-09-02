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
   * Start server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Server is already running on port ${this.port}`);
      return;
    }

    try {
      await startMockServer(this.port, this.mockRoot);
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
   * Stop server
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
   * Restart server
   */
  async restart(): Promise<void> {
    console.log("Restarting server...");
    await this.stop();
    await this.start();
    console.log("Server restarted successfully");
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Get mock root directory
   */
  getMockRoot(): string {
    return this.mockRoot;
  }

  /**
   * Get server status information
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

// Manager for creating multiple server instances
export class MultiServerManager {
  private servers: Map<number, MockServerManager> = new Map();

  /**
   * Create and start a server
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
   * Stop and remove a server
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
   * Stop all servers
   */
  async stopAllServers(): Promise<void> {
    const stopPromises = Array.from(this.servers.values()).map((server) =>
      server.stop()
    );
    await Promise.all(stopPromises);
    this.servers.clear();
  }

  /**
   * Get status of all servers
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
   * Get server by port
   */
  getServer(port: number): MockServerManager | undefined {
    return this.servers.get(port);
  }

  /**
   * Check whether a port is in use
   */
  isPortInUse(port: number): boolean {
    return this.servers.has(port);
  }
}

// Export convenience helpers
export function createMockServer(port: number = 3000): MockServerManager {
  return new MockServerManager({ port, autoStart: true });
}

export function createMultiServerManager(): MultiServerManager {
  return new MultiServerManager();
}
