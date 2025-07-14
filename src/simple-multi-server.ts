import {
  MultiServerManager,
  createMultiServerManager,
} from "./mock-server-manager";

/**
 * 简化的多服务器管理示例
 * 展示如何快速启动和管理多个 mock 服务器
 */
async function simpleMultiServerExample() {
  console.log("🚀 简化的多服务器管理示例\n");

  // 创建多服务器管理器
  const multiManager = createMultiServerManager();

  try {
    // 1. 启动多个服务器
    console.log("📡 启动多个服务器...");

    const server1 = await multiManager.createServer(3000);
    console.log("✅ 服务器 1 已启动 (端口: 3000)");

    const server2 = await multiManager.createServer(3001);
    console.log("✅ 服务器 2 已启动 (端口: 3001)");

    const server3 = await multiManager.createServer(3002);
    console.log("✅ 服务器 3 已启动 (端口: 3002)");

    // 2. 显示所有服务器状态
    console.log("\n📊 当前服务器状态:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      console.log(
        `  🟢 端口 ${port}: ${status.url} - ${
          status.isRunning ? "运行中" : "已停止"
        }`
      );
    });

    // 3. 测试服务器连接
    console.log("\n🔍 测试服务器连接...");
    for (const { port, status } of statuses) {
      try {
        const response = await fetch(`${status.url}/api/endpoints`);
        if (response.ok) {
          const endpoints = (await response.json()) as any[];
          console.log(`  ✅ 端口 ${port}: ${endpoints.length} 个端点可用`);
        } else {
          console.log(`  ⚠️  端口 ${port}: API 响应异常 (${response.status})`);
        }
      } catch (error) {
        console.log(`  ❌ 端口 ${port}: 连接失败`);
      }
    }

    // 4. 动态管理演示
    console.log("\n🎛️  动态管理演示...");

    // 添加新服务器
    const server4 = await multiManager.createServer(3003);
    console.log("➕ 新服务器已添加 (端口: 3003)");

    // 移除一个服务器
    await multiManager.removeServer(3001);
    console.log("➖ 服务器已移除 (端口: 3001)");

    // 显示更新后的状态
    console.log("\n📊 更新后的服务器状态:");
    const updatedStatuses = multiManager.getAllServerStatus();
    updatedStatuses.forEach(({ port, status }) => {
      console.log(`  🟢 端口 ${port}: ${status.url}`);
    });

    // 5. 等待一段时间让用户观察
    console.log("\n⏳ 等待 10 秒让您观察服务器状态...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // 6. 优雅关闭所有服务器
    console.log("\n🛑 关闭所有服务器...");
    await multiManager.stopAllServers();
    console.log("✅ 所有服务器已关闭");
  } catch (error) {
    console.error("❌ 发生错误:", error);
    // 确保清理
    await multiManager.stopAllServers();
  }
}

/**
 * 环境隔离的多服务器示例
 * 为不同环境启动独立的服务器
 */
async function environmentIsolationExample() {
  console.log("\n🌍 环境隔离的多服务器示例\n");

  const multiManager = createMultiServerManager();

  try {
    // 为不同环境启动服务器
    const environments = [
      { name: "开发环境", port: 3000, mockRoot: "./mock" },
      { name: "测试环境", port: 3001, mockRoot: "./mock-test" },
      { name: "预发布环境", port: 3002, mockRoot: "./mock-staging" },
      { name: "演示环境", port: 3003, mockRoot: "./mock-demo" },
    ];

    console.log("🚀 启动多环境服务器...");

    for (const env of environments) {
      const server = await multiManager.createServer(env.port, {
        mockRoot: env.mockRoot,
      });
      console.log(`✅ ${env.name} 已启动 (端口: ${env.port})`);
    }

    // 显示环境信息
    console.log("\n📋 环境信息:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      const env = environments.find((e) => e.port === port);
      const envName = env ? env.name : "未知环境";
      console.log(`  🟢 ${envName} (端口: ${port}): ${status.url}`);
    });

    // 等待用户观察
    console.log("\n⏳ 等待 15 秒让您观察多环境服务器...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // 关闭所有环境
    console.log("\n🛑 关闭所有环境服务器...");
    await multiManager.stopAllServers();
    console.log("✅ 所有环境服务器已关闭");
  } catch (error) {
    console.error("❌ 环境隔离示例发生错误:", error);
    await multiManager.stopAllServers();
  }
}

/**
 * 负载均衡模拟示例
 * 模拟多个服务器处理请求
 */
async function loadBalancingExample() {
  console.log("\n⚖️  负载均衡模拟示例\n");

  const multiManager = createMultiServerManager();
  const servers: any[] = [];

  try {
    // 启动多个服务器模拟负载均衡
    const serverCount = 3;
    console.log(`🚀 启动 ${serverCount} 个服务器进行负载均衡模拟...`);

    for (let i = 0; i < serverCount; i++) {
      const port = 3000 + i;
      const server = await multiManager.createServer(port);
      servers.push(server);
      console.log(`✅ 服务器 ${i + 1} 已启动 (端口: ${port})`);
    }

    // 模拟负载均衡请求分发
    console.log("\n🔄 模拟负载均衡请求分发...");
    const requestCount = 20;

    for (let i = 0; i < requestCount; i++) {
      // 轮询方式分发请求
      const serverIndex = i % servers.length;
      const server = servers[serverIndex];
      const url = server.getStatus().url;

      try {
        const response = await fetch(`${url}/api/endpoints`);
        if (response.ok) {
          console.log(
            `  📤 请求 ${i + 1}: 发送到服务器 ${
              serverIndex + 1
            } (端口: ${server.getPort()}) - ✅ 成功`
          );
        } else {
          console.log(
            `  📤 请求 ${i + 1}: 发送到服务器 ${
              serverIndex + 1
            } (端口: ${server.getPort()}) - ⚠️  失败`
          );
        }
      } catch (error) {
        console.log(
          `  📤 请求 ${i + 1}: 发送到服务器 ${
            serverIndex + 1
          } (端口: ${server.getPort()}) - ❌ 错误`
        );
      }

      // 短暂延迟
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n📈 负载均衡模拟完成");

    // 等待观察
    console.log("⏳ 等待 5 秒...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 关闭所有服务器
    console.log("\n🛑 关闭负载均衡服务器...");
    await multiManager.stopAllServers();
    console.log("✅ 所有负载均衡服务器已关闭");
  } catch (error) {
    console.error("❌ 负载均衡示例发生错误:", error);
    await multiManager.stopAllServers();
  }
}

// 主函数：运行所有示例
async function main() {
  console.log("🎬 多服务器管理示例集合\n");
  console.log("=".repeat(50));

  try {
    // 运行简化示例
    await simpleMultiServerExample();

    // 运行环境隔离示例
    await environmentIsolationExample();

    // 运行负载均衡示例
    await loadBalancingExample();

    console.log("\n🎉 所有示例完成！");
  } catch (error) {
    console.error("❌ 主函数发生错误:", error);
  }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main();
}

export {
  simpleMultiServerExample,
  environmentIsolationExample,
  loadBalancingExample,
};
