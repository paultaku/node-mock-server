import {
  MultiServerManager,
  MockServerManager,
  createMultiServerManager,
} from "./mock-server-manager";

/**
 * Multi-server management demo
 * Demonstrates how to start, manage, and monitor multiple mock servers simultaneously
 */
class MultiServerDemo {
  private multiManager: MultiServerManager;
  private servers: Map<string, MockServerManager> = new Map();

  constructor() {
    this.multiManager = createMultiServerManager();
  }

  /**
   * Start servers for multiple environments
   */
  async startMultipleEnvironments() {
    console.log("🚀 Starting servers for multiple environments...\n");

    try {
      // Development environment server
      const devServer = await this.multiManager.createServer(3000, {
        mockRoot: "./mock",
      });
      this.servers.set("dev", devServer);
      console.log("✅ Development server started (port: 3000)");

      // Test environment server
      const testServer = await this.multiManager.createServer(3001, {
        mockRoot: "./mock-test",
      });
      this.servers.set("test", testServer);
      console.log("✅ Test server started (port: 3001)");

      // Staging environment server
      const stagingServer = await this.multiManager.createServer(3002, {
        mockRoot: "./mock-staging",
      });
      this.servers.set("staging", stagingServer);
      console.log("✅ Staging server started (port: 3002)");

      // Demo environment server
      const demoServer = await this.multiManager.createServer(3003, {
        mockRoot: "./mock-demo",
      });
      this.servers.set("demo", demoServer);
      console.log("✅ Demo server started (port: 3003)");

      console.log("\n📊 All server statuses:");
      this.printAllServerStatus();
    } catch (error) {
      console.error("❌ Failed to start servers:", error);
      throw error;
    }
  }

  /**
   * Monitor all server statuses
   */
  async monitorServers() {
    console.log("\n🔍 Start monitoring server statuses...\n");

    // Check server status every 5 seconds
    const interval = setInterval(async () => {
      console.log("📊 Server status check:", new Date().toLocaleTimeString());

      const statuses = this.multiManager.getAllServerStatus();
      statuses.forEach(({ port, status }) => {
        const statusIcon = status.isRunning ? "🟢" : "🔴";
        console.log(
          `${statusIcon} Port ${port}: ${
            status.isRunning ? "Running" : "Stopped"
          } - ${status.url}`
        );
      });

      // Check API endpoints for each server
      for (const [name, server] of this.servers) {
        try {
          const response = await fetch(
            `${server.getStatus().url}/api/endpoints`
          );
          if (response.ok) {
            const endpoints = (await response.json()) as any[];
            console.log(`  📋 ${name} environment: ${endpoints.length} endpoints available`);
          } else {
            console.log(`  ⚠️  ${name} environment: API unavailable`);
          }
        } catch (error) {
          console.log(`  ❌ ${name} environment: Connection failed`);
        }
      }
      console.log("");
    }, 5000);

    // Stop monitoring after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log("⏹️  Monitoring stopped");
    }, 30000);
  }

  /**
   * Perform load test
   */
  async performLoadTest() {
    console.log("\n⚡ Starting load test...\n");

    const testPromises = [];
    const servers = Array.from(this.servers.values());

    // Send concurrent requests to each server
    for (let i = 0; i < 10; i++) {
      for (const server of servers) {
        const url = server.getStatus().url;
        testPromises.push(
          fetch(`${url}/api/endpoints`)
            .then((response) => ({
              server: url,
              success: response.ok,
              status: response.status,
            }))
            .catch((error) => ({
              server: url,
              success: false,
              error: error.message,
            }))
        );
      }
    }

    const results = await Promise.all(testPromises);

    // Aggregate results
    const stats = new Map<string, { success: number; failed: number }>();
    results.forEach((result) => {
      const server = result.server;
      if (!stats.has(server)) {
        stats.set(server, { success: 0, failed: 0 });
      }
      const stat = stats.get(server)!;
      if (result.success) {
        stat.success++;
      } else {
        stat.failed++;
      }
    });

    console.log("📈 Load test results:");
    stats.forEach((stat, server) => {
      const successRate = (
        (stat.success / (stat.success + stat.failed)) *
        100
      ).toFixed(1);
      console.log(
        `  ${server}: ${stat.success} succeeded, ${stat.failed} failed (Success rate: ${successRate}%)`
      );
    });
  }

  /**
   * Dynamic server management
   */
  async dynamicServerManagement() {
    console.log("\n🎛️  Dynamic server management demo...\n");

    // Add new server
    console.log("➕ Adding new server (port: 3004)...");
    const newServer = await this.multiManager.createServer(3004);
    this.servers.set("dynamic", newServer);
    console.log("✅ New server added");

    // Check port usage
    console.log("\n🔍 Checking port usage:");
    for (let port = 3000; port <= 3005; port++) {
      const inUse = this.multiManager.isPortInUse(port);
      console.log(`  Port ${port}: ${inUse ? "🟢 In use" : "⚪ Free"}`);
    }

    // Remove specific server
    console.log("\n➖ Removing test environment server...");
    await this.multiManager.removeServer(3001);
    this.servers.delete("test");
    console.log("✅ Test environment server removed");

    // Restart specific server
    console.log("\n🔄 Restarting development environment server...");
    const devServer = this.servers.get("dev");
    if (devServer) {
      await devServer.restart();
      console.log("✅ Development environment server restarted");
    }

    console.log("\n📊 Final server statuses:");
    this.printAllServerStatus();
  }

  /**
   * Simulate failure recovery
   */
  async simulateFailureRecovery() {
    console.log("\n🛠️  Simulating failure recovery...\n");

    // Simulate server failure
    console.log("💥 Simulating server failure...");
    const demoServer = this.servers.get("demo");
    if (demoServer) {
      await demoServer.stop();
      console.log("✅ Demo server stopped (simulated failure)");

      // Wait for a while
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Auto recovery
      console.log("🔧 Starting recovery...");
      await demoServer.start();
      console.log("✅ Demo server recovered");

      // Verify recovery
      const status = demoServer.getStatus();
      console.log(`📊 Status after recovery: ${status.isRunning ? "Running" : "Stopped"}`);
    }
  }

  /**
   * Gracefully shutdown all servers
   */
  async gracefulShutdown() {
    console.log("\n🛑 Starting graceful shutdown...\n");

    const shutdownPromises = Array.from(this.servers.entries()).map(
      async ([name, server]) => {
        console.log(`🔄 Shutting down ${name} environment server...`);
        await server.stop();
        console.log(`✅ ${name} environment server shut down`);
      }
    );

    await Promise.all(shutdownPromises);
    console.log("\n🎉 All servers have been gracefully shut down");
  }

  /**
   * Print all server statuses
   */
  private printAllServerStatus() {
    const statuses = this.multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      const statusIcon = status.isRunning ? "🟢" : "🔴";
      console.log(
        `${statusIcon} Port ${port}: ${status.url} - ${
          status.isRunning ? "Running" : "Stopped"
        }`
      );
    });
  }

  /**
   * Run the full demo
   */
  async runFullDemo() {
    try {
      console.log("🎬 Starting multi-server management demo\n");
      console.log("=".repeat(50));

      // 1. Start multiple environments
      await this.startMultipleEnvironments();

      // 2. Monitor servers
      await this.monitorServers();

      // 3. Load test
      await this.performLoadTest();

      // 4. Dynamic management
      await this.dynamicServerManagement();

      // 5. Failure recovery
      await this.simulateFailureRecovery();

      // 6. Graceful shutdown
      await this.gracefulShutdown();

      console.log("\n🎉 Demo completed!");
    } catch (error) {
      console.error("❌ Error occurred during demo:", error);
      await this.gracefulShutdown();
    }
  }
}

// Convenience function: quickly start multiple servers
export async function quickStartMultipleServers(
  ports: number[] = [3000, 3001, 3002, 3003]
) {
  const multiManager = createMultiServerManager();
  const servers: MockServerManager[] = [];

  try {
    console.log("🚀 Quickly starting multiple servers...\n");

    for (const port of ports) {
      const server = await multiManager.createServer(port);
      servers.push(server);
      console.log(`✅ Server started (port: ${port})`);
    }

    console.log("\n📊 All server statuses:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      console.log(`  🟢 Port ${port}: ${status.url}`);
    });

    return { multiManager, servers };
  } catch (error) {
    console.error("❌ Failed to start:", error);
    throw error;
  }
}

// If this file is run directly, execute the full demo
if (require.main === module) {
  const demo = new MultiServerDemo();
  demo.runFullDemo();
}

export { MultiServerDemo };
