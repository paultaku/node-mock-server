import {
  MockServerManager,
  MultiServerManager,
  createMockServer,
  createMultiServerManager,
} from "./mock-server-manager";

// 示例 1: 使用 MockServerManager 类
async function exampleWithManager() {
  console.log("=== 示例 1: 使用 MockServerManager 类 ===");

  // 创建服务器管理器
  const manager = new MockServerManager({
    port: 3000,
    autoStart: false,
  });

  try {
    // 启动服务器
    await manager.start();
    console.log("服务器状态:", manager.getStatus());

    // 检查服务器是否运行
    console.log("服务器是否运行:", manager.isServerRunning());

    // 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 重启服务器
    await manager.restart();
    console.log("重启后状态:", manager.getStatus());

    // 停止服务器
    await manager.stop();
    console.log("停止后状态:", manager.getStatus());
  } catch (error) {
    console.error("错误:", error);
  }
}

// 示例 2: 使用便捷函数
async function exampleWithConvenienceFunction() {
  console.log("\n=== 示例 2: 使用便捷函数 ===");

  try {
    // 使用便捷函数创建并启动服务器
    const server = createMockServer(3001);
    console.log("便捷函数创建的服务器状态:", server.getStatus());

    // 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 停止服务器
    await server.stop();
    console.log("服务器已停止");
  } catch (error) {
    console.error("错误:", error);
  }
}

// 示例 3: 使用多服务器管理器
async function exampleWithMultiServerManager() {
  console.log("\n=== 示例 3: 使用多服务器管理器 ===");

  const multiManager = createMultiServerManager();

  try {
    // 创建多个服务器
    const server1 = await multiManager.createServer(3002);
    const server2 = await multiManager.createServer(3003);
    const server3 = await multiManager.createServer(3004);

    console.log("所有服务器状态:");
    console.log(multiManager.getAllServerStatus());

    // 检查特定端口
    console.log("端口 3002 是否被使用:", multiManager.isPortInUse(3002));

    // 获取特定服务器
    const server = multiManager.getServer(3002);
    if (server) {
      console.log("端口 3002 的服务器状态:", server.getStatus());
    }

    // 等待一段时间
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 移除一个服务器
    await multiManager.removeServer(3003);
    console.log("移除端口 3003 后，所有服务器状态:");
    console.log(multiManager.getAllServerStatus());

    // 停止所有服务器
    await multiManager.stopAllServers();
    console.log("所有服务器已停止");
  } catch (error) {
    console.error("错误:", error);
  }
}

// 示例 4: 在测试环境中使用
async function exampleForTesting() {
  console.log("\n=== 示例 4: 测试环境使用 ===");

  const testPorts = [3005, 3006, 3007];
  const servers: MockServerManager[] = [];

  try {
    // 启动多个测试服务器
    for (const port of testPorts) {
      const server = new MockServerManager({ port, autoStart: false });
      await server.start();
      servers.push(server);
      console.log(`测试服务器 ${port} 已启动`);
    }

    // 模拟测试过程
    console.log("开始测试...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("测试完成");

    // 清理所有测试服务器
    for (const server of servers) {
      await server.stop();
      console.log(`测试服务器 ${server.getPort()} 已停止`);
    }
  } catch (error) {
    console.error("测试错误:", error);
    // 确保清理
    for (const server of servers) {
      try {
        await server.stop();
      } catch (e) {
        console.error("清理错误:", e);
      }
    }
  }
}

// 主函数
async function main() {
  try {
    await exampleWithManager();
    await exampleWithConvenienceFunction();
    await exampleWithMultiServerManager();
    await exampleForTesting();

    console.log("\n=== 所有示例完成 ===");
  } catch (error) {
    console.error("主函数错误:", error);
  }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main();
}

export {
  exampleWithManager,
  exampleWithConvenienceFunction,
  exampleWithMultiServerManager,
  exampleForTesting,
};
