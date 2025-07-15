import { startMockServer } from "../src/server";

// 示例 1: 使用默认端口启动服务器
async function startDefaultServer() {
  try {
    await startMockServer();
    console.log("Default server started successfully");
  } catch (error) {
    console.error("Failed to start default server:", error);
  }
}

// 示例 2: 使用自定义端口启动服务器
async function startCustomPortServer() {
  try {
    await startMockServer(3001);
    console.log("Custom port server started successfully");
  } catch (error) {
    console.error("Failed to start custom port server:", error);
  }
}

// 示例 3: 启动多个服务器实例
async function startMultipleServers() {
  try {
    // 启动第一个服务器
    await startMockServer(3000);
    console.log("First server started on port 3000");

    // 启动第二个服务器
    await startMockServer(3001);
    console.log("Second server started on port 3001");

    // 启动第三个服务器
    await startMockServer(3002);
    console.log("Third server started on port 3002");
  } catch (error) {
    console.error("Failed to start multiple servers:", error);
  }
}

// 示例 4: 在测试环境中使用
async function startServerForTesting() {
  try {
    const port = Math.floor(Math.random() * 1000) + 3000; // 随机端口
    await startMockServer(port);
    console.log(`Test server started on port ${port}`);

    // 这里可以进行测试...

    // 测试完成后可以关闭服务器
    // 注意：这里需要手动管理服务器的关闭
  } catch (error) {
    console.error("Failed to start test server:", error);
  }
}

// 导出函数供其他模块使用
export {
  startDefaultServer,
  startCustomPortServer,
  startMultipleServers,
  startServerForTesting,
};

// 如果直接运行此文件，启动默认服务器
if (require.main === module) {
  startDefaultServer();
} 