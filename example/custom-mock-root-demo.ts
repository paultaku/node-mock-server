import { startMockServer } from "../src/server";
import {
  MockServerManager,
  createMultiServerManager,
} from "../src/mock-server-manager";
import path from "path";
import fs from "fs-extra";

async function customMockRootDemo() {
  console.log("=== Custom Mock Root Path Demo ===");

  // Create different mock directories for demonstration
  const mockDirs = {
    development: path.resolve(__dirname, "../mock-dev"),
    testing: path.resolve(__dirname, "../mock-test"),
    staging: path.resolve(__dirname, "../mock-staging"),
  };

  // Ensure directories exist
  for (const [env, dir] of Object.entries(mockDirs)) {
    await fs.ensureDir(dir);
    console.log(`✅ Directory ensured: ${dir}`);
  }

  // Demo 1: Directly using startMockServer function
  console.log("\n1. Directly using startMockServer function:");
  try {
    // Start development environment server
    await startMockServer(3001, mockDirs.development);
    console.log(
      "✅ Development environment server started successfully (port 3001)"
    );

    // Start testing environment server
    await startMockServer(3002, mockDirs.testing);
    console.log(
      "✅ Testing environment server started successfully (port 3002)"
    );

    // Start staging environment server
    await startMockServer(3003, mockDirs.staging);
    console.log(
      "✅ Staging environment server started successfully (port 3003)"
    );
  } catch (error) {
    console.error("❌ Failed to start servers directly:", error);
  }

  // Demo 2: Using MockServerManager
  console.log("\n2. Using MockServerManager:");
  try {
    const devManager = new MockServerManager({
      port: 3004,
      mockRoot: mockDirs.development,
      autoStart: false,
    });

    const testManager = new MockServerManager({
      port: 3005,
      mockRoot: mockDirs.testing,
      autoStart: false,
    });

    await devManager.start();
    await testManager.start();

    console.log("✅ MockServerManager started successfully");
    console.log("Development environment status:", devManager.getStatus());
    console.log("Testing environment status:", testManager.getStatus());

    // Stop servers
    await devManager.stop();
    await testManager.stop();
    console.log("✅ Servers stopped");
  } catch (error) {
    console.error("❌ MockServerManager test failed:", error);
  }

  // Demo 3: Using MultiServerManager to manage multiple environments
  console.log("\n3. Using MultiServerManager to manage multiple environments:");
  try {
    const multiManager = createMultiServerManager();

    // Create servers for different environments
    const environments = [
      {
        name: "Development Environment",
        port: 3006,
        mockRoot: mockDirs.development,
      },
      { name: "Testing Environment", port: 3007, mockRoot: mockDirs.testing },
      { name: "Staging Environment", port: 3008, mockRoot: mockDirs.staging },
    ];

    for (const env of environments) {
      await multiManager.createServer(env.port, {
        mockRoot: env.mockRoot,
      });
      console.log(
        `✅ ${env.name} server started successfully (port ${env.port})`
      );
    }

    // View all server statuses
    const statuses = multiManager.getAllServerStatus();
    console.log("\nAll server statuses:");
    statuses.forEach(({ port, status }) => {
      console.log(
        `  Port ${port}: ${
          status.isRunning ? "Running" : "Stopped"
        } | Mock root: ${status.mockRoot}`
      );
    });

    // Stop all servers
    await multiManager.stopAllServers();
    console.log("✅ All servers stopped");
  } catch (error) {
    console.error("❌ MultiServerManager test failed:", error);
  }

  // Demo 4: Using environment variables
  console.log("\n4. Using environment variables:");
  try {
    // Simulate setting environment variables
    process.env.MOCK_ROOT = mockDirs.development;
    process.env.PORT = "3009";

    // This will use MOCK_ROOT from environment variables
    await startMockServer(parseInt(process.env.PORT));
    console.log(
      "✅ Server with environment variable configuration started successfully"
    );

    // Clean up environment variables
    delete process.env.MOCK_ROOT;
    delete process.env.PORT;
  } catch (error) {
    console.error("❌ Environment variable test failed:", error);
  }

  console.log("\n=== Demo completed ===");
  console.log("\nUsage instructions:");
  console.log("1. Direct call: startMockServer(port, mockRoot)");
  console.log("2. Using manager: new MockServerManager({ port, mockRoot })");
  console.log("3. Multi-server: multiManager.createServer(port, { mockRoot })");
  console.log("4. Environment variable: MOCK_ROOT=./path/to/mock npm run dev");
}

// Run demo
customMockRootDemo().catch((error) => {
  console.error("Error occurred during demo:", error);
  process.exit(1);
});
