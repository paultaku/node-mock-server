import { startMockServer } from "../src/server";
import { createMultiServerManager } from "../src/mock-server-manager";
import path from "path";
import fs from "fs-extra";

async function environmentIsolationExample() {
  console.log("=== Environment Isolation Example ===");

  // Define configurations for different environments
  const environments = {
    development: {
      name: "Development Environment",
      port: 3001,
      mockRoot: path.resolve(__dirname, "../mock-dev"),
      description:
        "For local development, includes debug information and detailed errors",
    },
    testing: {
      name: "Testing Environment",
      port: 3002,
      mockRoot: path.resolve(__dirname, "../mock-test"),
      description: "For automated testing, includes various edge cases",
    },
    staging: {
      name: "Staging Environment",
      port: 3003,
      mockRoot: path.resolve(__dirname, "../mock-staging"),
      description: "For pre-release testing, simulates production environment",
    },
    production: {
      name: "Production Environment",
      port: 3004,
      mockRoot: path.resolve(__dirname, "../mock-prod"),
      description:
        "Production environment configuration, minimal response data",
    },
  };

  // Ensure all environment directories exist
  console.log("Creating environment directories...");
  for (const [env, config] of Object.entries(environments)) {
    await fs.ensureDir(config.mockRoot);
    console.log(`✅ ${config.name} directory: ${config.mockRoot}`);
  }

  // Method 1: Directly using startMockServer function
  console.log("\nMethod 1: Directly using startMockServer function");
  try {
    for (const [env, config] of Object.entries(environments)) {
      await startMockServer(config.port, config.mockRoot);
      console.log(
        `✅ ${config.name} started successfully (port ${config.port})`
      );
    }
  } catch (error) {
    console.error("❌ Direct startup failed:", error);
  }

  // Method 2: Using MultiServerManager for management
  console.log("\nMethod 2: Using MultiServerManager for management");
  try {
    const multiManager = createMultiServerManager();

    // Start all environments
    for (const [env, config] of Object.entries(environments)) {
      await multiManager.createServer(config.port, {
        mockRoot: config.mockRoot,
      });
      console.log(`✅ ${config.name} started successfully via manager`);
    }

    // View all server statuses
    const statuses = multiManager.getAllServerStatus();
    console.log("\nCurrently running servers:");
    statuses.forEach(({ port, status }) => {
      const env = Object.values(environments).find((e) => e.port === port);
      console.log(
        `  ${env?.name || "Unknown"}: ${status.url} | Mock: ${status.mockRoot}`
      );
    });

    // Stop all servers
    await multiManager.stopAllServers();
    console.log("✅ All servers stopped");
  } catch (error) {
    console.error("❌ Manager startup failed:", error);
  }

  // Method 3: On-demand startup of specific environment
  console.log("\nMethod 3: On-demand startup of specific environment");
  try {
    // Start corresponding server based on current environment variable
    const currentEnv = process.env.NODE_ENV || "development";
    const config = environments[currentEnv as keyof typeof environments];

    if (config) {
      await startMockServer(config.port, config.mockRoot);
      console.log(
        `✅ Current environment (${currentEnv}) started successfully: ${config.name}`
      );
    } else {
      console.log(`⚠️ Environment configuration not found: ${currentEnv}`);
    }
  } catch (error) {
    console.error("❌ On-demand startup failed:", error);
  }

  // Method 4: Using environment variable configuration
  console.log("\nMethod 4: Using environment variable configuration");
  try {
    // Set environment variables
    process.env.MOCK_ROOT = environments.development.mockRoot;
    process.env.PORT = "3005";

    await startMockServer(parseInt(process.env.PORT));
    console.log(
      "✅ Server with environment variable configuration started successfully"
    );

    // Clean up environment variables
    delete process.env.MOCK_ROOT;
    delete process.env.PORT;
  } catch (error) {
    console.error("❌ Environment variable configuration failed:", error);
  }

  console.log("\n=== Environment isolation example completed ===");
  console.log("\nUsage recommendations:");
  console.log("1. Create independent mock directories for each environment");
  console.log("2. Use different ports to avoid conflicts");
  console.log(
    "3. Configure different mock data based on environment characteristics"
  );
  console.log("4. Use environment variables for configuration management");
  console.log("5. Consider using MultiServerManager for unified management");
}

// Run example
environmentIsolationExample().catch((error) => {
  console.error("Example run failed:", error);
  process.exit(1);
});
