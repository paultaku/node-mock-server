import { startMockServer } from "../src/server";
import { MockServerManager } from "../src/mock-server-manager";
import path from "path";

async function testRefactoredServer() {
  console.log("=== Testing Refactored startMockServer Function ===");

  // Test 1: Using default mock root path
  console.log("\n1. Testing default mock root path:");
  try {
    await startMockServer(3001);
    console.log("✅ Default mock root path test successful");
  } catch (error) {
    console.error("❌ Default mock root path test failed:", error);
  }

  // Test 2: Using custom mock root path
  console.log("\n2. Testing custom mock root path:");
  try {
    const customMockRoot = path.resolve(__dirname, "../mock");
    await startMockServer(3002, customMockRoot);
    console.log("✅ Custom mock root path test successful");
  } catch (error) {
    console.error("❌ Custom mock root path test failed:", error);
  }

  // Test 3: Using MockServerManager with custom mock root path
  console.log("\n3. Testing MockServerManager with custom mock root path:");
  try {
    const manager = new MockServerManager({
      port: 3003,
      mockRoot: path.resolve(__dirname, "../mock"),
      autoStart: false,
    });

    await manager.start();
    console.log("✅ MockServerManager custom mock root path test successful");
    console.log("Server status:", manager.getStatus());

    await manager.stop();
    console.log("✅ Server stopped");
  } catch (error) {
    console.error("❌ MockServerManager test failed:", error);
  }

  // Test 4: Using relative path
  console.log("\n4. Testing relative path:");
  try {
    await startMockServer(3004, "./mock");
    console.log("✅ Relative path test successful");
  } catch (error) {
    console.error("❌ Relative path test failed:", error);
  }

  console.log("\n=== Test completed ===");
}

// Run tests
testRefactoredServer().catch((error) => {
  console.error("Error occurred during testing:", error);
  process.exit(1);
});
