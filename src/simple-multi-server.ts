import {
  MultiServerManager,
  createMultiServerManager,
} from "./mock-server-manager";

/**
 * Simplified multi-server management example
 * Demonstrates how to quickly start and manage multiple mock servers
 */
async function simpleMultiServerExample() {
  console.log("🚀 Simplified multi-server management example\n");

  // Create multi-server manager
  const multiManager = createMultiServerManager();

  try {
    // 1. Start multiple servers
    console.log("📡 Starting multiple servers...");

    const server1 = await multiManager.createServer(3000);
    console.log("✅ Server 1 started (port: 3000)");

    const server2 = await multiManager.createServer(3001);
    console.log("✅ Server 2 started (port: 3001)");

    const server3 = await multiManager.createServer(3002);
    console.log("✅ Server 3 started (port: 3002)");

    // 2. Show all server statuses
    console.log("\n📊 Current server statuses:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      console.log(
        `  🟢 Port ${port}: ${status.url} - ${
          status.isRunning ? "Running" : "Stopped"
        }`
      );
    });

    // 3. Test server connections
    console.log("\n🔍 Testing server connections...");
    for (const { port, status } of statuses) {
      try {
        const response = await fetch(`${status.url}/api/endpoints`);
        if (response.ok) {
          const endpoints = (await response.json()) as any[];
          console.log(`  ✅ Port ${port}: ${endpoints.length} endpoints available`);
        } else {
          console.log(`  ⚠️  Port ${port}: API response abnormal (${response.status})`);
        }
      } catch (error) {
        console.log(`  ❌ Port ${port}: Connection failed`);
      }
    }

    // 4. Dynamic management demo
    console.log("\n🎛️  Dynamic management demo...");

    // Add new server
    const server4 = await multiManager.createServer(3003);
    console.log("➕ New server added (port: 3003)");

    // Remove a server
    await multiManager.removeServer(3001);
    console.log("➖ Server removed (port: 3001)");

    // Show updated statuses
    console.log("\n📊 Server statuses after update:");
    const updatedStatuses = multiManager.getAllServerStatus();
    updatedStatuses.forEach(({ port, status }) => {
      console.log(`  🟢 Port ${port}: ${status.url}`);
    });

    // 5. Wait for a while for user observation
    console.log("\n⏳ Waiting 10 seconds for you to observe server statuses...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // 6. Gracefully shut down all servers
    console.log("\n🛑 Shutting down all servers...");
    await multiManager.stopAllServers();
    console.log("✅ All servers have been shut down");
  } catch (error) {
    console.error("❌ Error occurred:", error);
    // Ensure cleanup
    await multiManager.stopAllServers();
  }
}

/**
 * Multi-environment isolation example
 * Start independent servers for different environments
 */
async function environmentIsolationExample() {
  console.log("\n🌍 Multi-environment isolation example\n");

  const multiManager = createMultiServerManager();

  try {
    // Start servers for different environments
    const environments = [
      { name: "Development", port: 3000, mockRoot: "./mock" },
      { name: "Testing", port: 3001, mockRoot: "./mock-test" },
      { name: "Staging", port: 3002, mockRoot: "./mock-staging" },
      { name: "Demo", port: 3003, mockRoot: "./mock-demo" },
    ];

    console.log("🚀 Starting multi-environment servers...");

    for (const env of environments) {
      const server = await multiManager.createServer(env.port, {
        mockRoot: env.mockRoot,
      });
      console.log(`✅ ${env.name} started (port: ${env.port})`);
    }

    // Show environment info
    console.log("\n📋 Environment info:");
    const statuses = multiManager.getAllServerStatus();
    statuses.forEach(({ port, status }) => {
      const env = environments.find((e) => e.port === port);
      const envName = env ? env.name : "Unknown environment";
      console.log(`  🟢 ${envName} (port: ${port}): ${status.url}`);
    });

    // Wait for user observation
    console.log("\n⏳ Waiting 15 seconds for you to observe multi-environment servers...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Shut down all environments
    console.log("\n🛑 Shutting down all environment servers...");
    await multiManager.stopAllServers();
    console.log("✅ All environment servers have been shut down");
  } catch (error) {
    console.error("❌ Error occurred in environment isolation example:", error);
    await multiManager.stopAllServers();
  }
}

/**
 * Load balancing simulation example
 * Simulate multiple servers handling requests
 */
async function loadBalancingExample() {
  console.log("\n⚖️  Load balancing simulation example\n");

  const multiManager = createMultiServerManager();
  const servers: any[] = [];

  try {
    // Start multiple servers to simulate load balancing
    const serverCount = 3;
    console.log(`🚀 Starting ${serverCount} servers for load balancing simulation...`);

    for (let i = 0; i < serverCount; i++) {
      const port = 3000 + i;
      const server = await multiManager.createServer(port);
      servers.push(server);
      console.log(`✅ Server ${i + 1} started (port: ${port})`);
    }

    // Simulate load balancing request distribution
    console.log("\n🔄 Simulating load balancing request distribution...");
    const requestCount = 20;

    for (let i = 0; i < requestCount; i++) {
      // Round-robin distribution
      const serverIndex = i % servers.length;
      const server = servers[serverIndex];
      const url = server.getStatus().url;

      try {
        const response = await fetch(`${url}/api/endpoints`);
        if (response.ok) {
          console.log(
            `  📤 Request ${i + 1}: sent to server ${
              serverIndex + 1
            } (port: ${server.getPort()}) - ✅ Success`
          );
        } else {
          console.log(
            `  📤 Request ${i + 1}: sent to server ${
              serverIndex + 1
            } (port: ${server.getPort()}) - ⚠️  Failed`
          );
        }
      } catch (error) {
        console.log(
          `  📤 Request ${i + 1}: sent to server ${
            serverIndex + 1
          } (port: ${server.getPort()}) - ❌ Error`
        );
      }

      // Short delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n📈 Load balancing simulation completed");

    // Wait for observation
    console.log("\n⏳ Waiting 5 seconds for you to observe...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Shut down all servers
    console.log("\n🛑 Shutting down all servers...");
    await multiManager.stopAllServers();
    console.log("✅ All servers have been shut down");
  } catch (error) {
    console.error("❌ Error occurred in load balancing example:", error);
    await multiManager.stopAllServers();
  }
}

// Main function
async function main() {
  await simpleMultiServerExample();
  await environmentIsolationExample();
  await loadBalancingExample();
}

if (require.main === module) {
  main();
}
