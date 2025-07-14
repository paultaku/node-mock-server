import {
  MultiServerManager,
  MockServerManager,
  createMultiServerManager,
} from "./mock-server-manager";

/**
 * 多服务器管理演示
 * 展示如何同时启动、管理和监控多个 mock 服务器
 */
class MultiServerDemo {
  private multiManager: MultiServerManager;
  private servers: Map<string, MockServerManager> = new Map();

  constructor() {
    this.multiManager = createMultiServerManager();
  }

  /**
   * 启动多个不同环境的服务器
   */
  async startMultipleEnvironments() {
    console.log("🚀 启动多环境服务器...\n");

    try {
      // 开发环境服务器
      const devServer = await this.multiManager.createServer(3000, {
        mockRoot: "./mock",
      });
      this.servers.set("dev", devServer);
      console.log("✅ 开发环境服务器已启动 (端口: 3000)");

      // 测试环境服务器
      const testServer = await this.multiManager.createServer(3001, {
        mockRoot: "./mock-test",
      });
      this.servers.set("test", testServer);
      console.log("✅ 测试环境服务器已启动 (端口: 3001)");

      // 预发布环境服务器
      const stagingServer = await this.multiManager.createServer(3002, {
        mockRoot: "./mock-staging",
      });
      this.servers.set("staging", stagingServer);
      console.log("✅ 预发布环境服务器已启动 (端口: 3002)");

      // 演示环境服务器
      const demoServer = await this.multiManager.createServer(3003, {
        mockRoot: "./mock-demo",
      });
      this.servers.set("demo", demoServer);
      console.log("✅ 演示环境服务器已启动 (端口: 3003)");

      console.log("\n📊 所有服务器状态:");
      this.printAllServerStatus();
    } catch (error) {
      console.error("❌ 启动服务器失败:", error);
      throw error;
    }
  }

  /**
   * 监控所有服务器状态
   */
  async monitorServers() {
    console.log("\n🔍 开始监控服务器状态...\n");

    // 每5秒检查一次服务器状态
    const interval = setInterval(async () => {
      console.log("📊 服务器状态检查:", new Date().toLocaleTimeString());

      const statuses = this.multiManager.getAllServerStatus();
      statuses.forEach(({ port, status }) => {
        const statusIcon = status.isRunning ? "🟢" : "🔴";
        console.log(
          `${statusIcon} 端口 ${port}: ${
            status.isRunning ? "运行中" : "已停止"
          } - ${status.url}`
        );
      });

      // 检查每个服务器的 API 端点
      for (const [name, server] of this.servers) {
        try {
          const response = await fetch(
            `${server.getStatus().url}/api/endpoints`
          );
          if (response.ok) {
            const endpoints = (await response.json()) as any[];
            console.log(`  📋 ${name} 环境: ${endpoints.length} 个端点可用`);
          } else {
            console.log(`  ⚠️  ${name} 环境: API 不可用`);
          }
        } catch (error) {
          console.log(`  ❌ ${name} 环境: 连接失败`);
        }
      }
      console.log("");
    }, 5000);

    // 30秒后停止监控
    setTimeout(() => {
      clearInterval(interval);
      console.log("⏹️  监控已停止");
    }, 30000);
  }

  /**
   * 执行负载测试
   */
  async performLoadTest() {
    console.log("\n⚡ 开始负载测试...\n");

    const testPromises = [];
    const servers = Array.from(this.servers.values());

    // 对每个服务器发送并发请求
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

    // 统计结果
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

    console.log("📈 负载测试结果:");
    stats.forEach((stat, server) => {
      const successRate = (
        (stat.success / (stat.success + stat.failed)) *
        100
      ).toFixed(1);
      console.log(
        `  ${server}: ${stat.success} 成功, ${stat.failed} 失败 (成功率: ${successRate}%)`
      );
    });
  }

  /**
   * 动态管理服务器
   */
  async dynamicServerManagement() {
    console.log("\n🎛️  动态服务器管理演示...\n");

    // 添加新服务器
    console.log("➕ 添加新服务器 (端口: 3004)...");
    const newServer = await this.multiManager.createServer(3004);
    this.servers.set("dynamic", newServer);
    console.log("✅ 新服务器已添加");

    // 检查端口使用情况
    console.log("\n🔍 检查端口使用情况:");
    for (let port = 3000; port <= 3005; port++) {
      const inUse = this.multiManager.isPortInUse(port);
      console.log(`  端口 ${port}: ${inUse ? "🟢 使用中" : "⚪ 空闲"}`);
    }

    // 移除特定服务器
    console.log("\n➖ 移除测试环境服务器...");
    await this.multiManager.removeServer(3001);
    this.servers.delete("test");
    console.log("✅ 测试环境服务器已移除");

    // 重启特定服务器
    console.log("\n🔄 重启开发环境服务器...");
    const devServer = this.servers.get("dev");
    if (devServer) {
      await devServer.restart();
      console.log("✅ 开发环境服务器已重启");
    }

    console.log("\n📊 最终服务器状态:");
    this.printAllServerStatus();
  }

  /**
   * 模拟故障恢复
   */
  async simulateFailureRecovery() {
    console.log("\n🛠️  模拟故障恢复...\n");

    // 模拟服务器故障
    console.log("💥 模拟服务器故障...");
    const demoServer = this.servers.get("demo");
    if (demoServer) {
      await demoServer.stop();
      console.log("✅ 演示服务器已停止 (模拟故障)");

      // 等待一段时间
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 自动恢复
      console.log("🔧 开始故障恢复...");
      await demoServer.start();
      console.log("✅ 演示服务器已恢复");

      // 验证恢复
      const status = demoServer.getStatus();
      console.log(`📊 恢复后状态: ${status.isRunning ? "运行中" : "已停止"}`);
    }
  }

  /**
   * 优雅关闭所有服务器
   */
  async gracefulShutdown() {
    console.log("\n🛑 开始优雅关闭...\n");

    const shutdownPromises = Array.from(this.servers.entries()).map(
      async ([name, server]) => {
        console.log(`🔄 正在关闭 ${name} 环境服务器...`);
        await server.stop();
        console.log(`✅ ${name} 环境服务器已关闭`);
      }
    );

    await Promise.all(shutdownPromises);
    console.log("\n🎉 所有服务器已优雅关闭");
  }

  /**
   * 打印所有服务器状态
   */
  private printAllServerStatus() {
    const statuses = this.multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      const statusIcon = status.isRunning ? "🟢" : "🔴";
      console.log(
        `${statusIcon} 端口 ${port}: ${status.url} - ${
          status.isRunning ? "运行中" : "已停止"
        }`
      );
    });
  }

  /**
   * 运行完整演示
   */
  async runFullDemo() {
    try {
      console.log("🎬 开始多服务器管理演示\n");
      console.log("=".repeat(50));

      // 1. 启动多个环境
      await this.startMultipleEnvironments();

      // 2. 监控服务器
      await this.monitorServers();

      // 3. 负载测试
      await this.performLoadTest();

      // 4. 动态管理
      await this.dynamicServerManagement();

      // 5. 故障恢复
      await this.simulateFailureRecovery();

      // 6. 优雅关闭
      await this.gracefulShutdown();

      console.log("\n🎉 演示完成！");
    } catch (error) {
      console.error("❌ 演示过程中发生错误:", error);
      await this.gracefulShutdown();
    }
  }
}

// 便捷函数：快速启动多服务器
export async function quickStartMultipleServers(
  ports: number[] = [3000, 3001, 3002, 3003]
) {
  const multiManager = createMultiServerManager();
  const servers: MockServerManager[] = [];

  try {
    console.log("🚀 快速启动多个服务器...\n");

    for (const port of ports) {
      const server = await multiManager.createServer(port);
      servers.push(server);
      console.log(`✅ 服务器已启动 (端口: ${port})`);
    }

    console.log("\n📊 所有服务器状态:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      console.log(`  🟢 端口 ${port}: ${status.url}`);
    });

    return { multiManager, servers };
  } catch (error) {
    console.error("❌ 启动失败:", error);
    throw error;
  }
}

// 如果直接运行此文件，执行完整演示
if (require.main === module) {
  const demo = new MultiServerDemo();
  demo.runFullDemo();
}

export { MultiServerDemo };
