# Node Mock Server

A TypeScript-based mock server that supports automatic generation of mock response files from Swagger (OpenAPI 3.0) YAML files and provides a web interface for managing mock responses. Supports single-server and multi-server management, suitable for development, testing, and production environments.

## 🚀 Features

- **Automatic Mock File Generation**: Automatically generate mock response files from Swagger YAML files
- **Smart Path Matching**: Support multi-level paths and path parameter matching (e.g., `/user/{username}`)
- **Web Management Interface**: React-based UI for visual management and switching of mock responses
- **Real-time Switching**: Switch endpoint mock responses in real-time via API or UI
- **Multi-Server Management**: Support starting and managing multiple server instances simultaneously
- **Environment Isolation**: Configure independent servers and mock data for different environments
- **Type Safety**: Use TypeScript and Zod for type validation
- **Safe File Naming**: Automatically handle special characters to avoid path conflicts

## 📦 Installation

```bash
npm install
```

## 🎯 Quick Start

### 1. Generate Mock Files

Generate mock response files from Swagger YAML file:

```bash
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

### 2. Start Server

#### Basic Startup

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

#### Using Function Call Startup

```typescript
import { startMockServer } from "./src/server";

// Using default port 3000 and default mock root directory
await startMockServer();

// Using custom port
await startMockServer(3001);

// Using custom port and custom mock root directory
await startMockServer(3001, "./custom-mock");

// Using absolute path
await startMockServer(3001, "/path/to/mock");
```

### 3. Access Management Interface

Open your browser and visit `http://localhost:3000` to view the web management interface.

## 🏗️ Project Structure

```
node-mock-server/
├── src/
│   ├── server.ts                    # Core server logic
│   ├── mock-server-manager.ts       # Server management classes
│   ├── example-usage.ts            # Basic usage examples
│   ├── manager-example.ts          # Manager usage examples
│   ├── multi-server-demo.ts        # Multi-server demonstration
│   ├── simple-multi-server.ts      # Simplified multi-server examples
│   ├── cli/
│   │   └── generate-mock.ts        # CLI tool entry
│   ├── mock-generator.ts           # Mock directory and file generation logic
│   └── types/
│       └── swagger.ts              # Zod type definitions
├── mock/                           # Auto-generated mock directory
├── public/
│   └── index.html                  # React management interface
├── demo/
│   └── swagger.yaml                # Example Swagger file
└── package.json
```

## 🔧 Usage

### Single Server Management

#### Using MockServerManager

```typescript
import { MockServerManager } from "./src/mock-server-manager";

// Create server manager
const manager = new MockServerManager({
  port: 3000,
  autoStart: false,
});

// Start server
await manager.start();

// Check status
console.log(manager.getStatus());

// Restart server
await manager.restart();

// Stop server
await manager.stop();
```

#### Using Convenience Functions

```typescript
import { createMockServer } from "./src/mock-server-manager";

// Create and auto-start server
const server = createMockServer(3000);
```

### Multi-Server Management

#### Basic Multi-Server Management

```typescript
import { createMultiServerManager } from "./src/mock-server-manager";

// Create multi-server manager
const multiManager = createMultiServerManager();

// Start multiple servers
const server1 = await multiManager.createServer(3000);
const server2 = await multiManager.createServer(3001);
const server3 = await multiManager.createServer(3002);

// View all server statuses
const statuses = multiManager.getAllServerStatus();
console.log(statuses);

// Stop all servers
await multiManager.stopAllServers();
```

#### Environment-Isolated Multi-Servers

```typescript
// Start independent servers for different environments
const environments = [
  { name: "Development Environment", port: 3000, mockRoot: "./mock" },
  { name: "Testing Environment", port: 3001, mockRoot: "./mock-test" },
  { name: "Staging Environment", port: 3002, mockRoot: "./mock-staging" },
];

for (const env of environments) {
  await multiManager.createServer(env.port, {
    mockRoot: env.mockRoot,
  });
}

// Or directly use startMockServer function
await startMockServer(3000, "./mock");
await startMockServer(3001, "./mock-test");
await startMockServer(3002, "./mock-staging");
```

### Testing Environment Usage

```typescript
import { MockServerManager } from "./src/mock-server-manager";

async function testWithMockServer() {
  const testPort = Math.floor(Math.random() * 1000) + 3000;
  const server = new MockServerManager({ port: testPort });

  try {
    await server.start();

    // Execute tests...
    const response = await fetch(`http://localhost:${testPort}/api/endpoints`);
    const endpoints = await response.json();

    // Verify results...
  } finally {
    await server.stop();
  }
}
```

## 📋 Available Script Commands

```bash
# Basic commands
npm run dev                    # Start default server
npm run generate              # Generate mock files
npm run build                 # Build project
npm start                     # Start production server

# Examples and demonstrations
npm run example               # Run basic examples
npm run manager               # Run manager examples
npm run multi-demo            # Run complete multi-server demo
npm run simple-multi          # Run simplified multi-server examples
npm run test-refactor         # Test refactored functionality
npm run custom-mock-demo      # Custom mock root path demo

# Testing
npm test                      # Run tests
npm run test:watch            # Run tests in watch mode
```

## 🌍 Usage Scenarios

### 1. Multi-Environment Development

```typescript
// Run development, testing, and staging environments simultaneously
const devServer = await multiManager.createServer(3000);
const testServer = await multiManager.createServer(3001);
const stagingServer = await multiManager.createServer(3002);
```

### 2. Load Testing

```typescript
// Start multiple servers for load testing
const servers = [];
for (let i = 0; i < 5; i++) {
  const server = await multiManager.createServer(3000 + i);
  servers.push(server);
}

// Round-robin distribute requests to different servers
for (let i = 0; i < 100; i++) {
  const serverIndex = i % servers.length;
  const server = servers[serverIndex];
  // Send request to server
}
```

### 3. A/B 测试

```typescript
// 启动两个不同配置的服务器
const serverA = await multiManager.createServer(3000, {
  mockRoot: "./mock-version-a",
});
const serverB = await multiManager.createServer(3001, {
  mockRoot: "./mock-version-b",
});
```

### 4. 微服务模拟

```typescript
// 模拟微服务架构
const userService = await multiManager.createServer(3000);
const orderService = await multiManager.createServer(3001);
const paymentService = await multiManager.createServer(3002);
const notificationService = await multiManager.createServer(3003);
```

## 🔌 API 端点

### Mock 服务器端点

- `GET /api/endpoints` - 获取所有可用的 API 端点
- `POST /api/set-mock` - 设置端点的 mock 响应
- `GET /api/mock-state` - 获取端点的当前 mock 状态

### 示例请求

```bash
# 获取所有端点
curl http://localhost:3000/api/endpoints

# 设置mock响应
curl -X POST http://localhost:3000/api/set-mock \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/user/login",
    "method": "GET",
    "mockFile": "successful-operation-200.json"
  }'

# 访问mock API
curl http://localhost:3000/user/login
```

## 📊 Mock 文件格式

生成的 mock 文件格式如下：

```json
{
  "header": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ],
  "body": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## ⚙️ 配置选项

### 环境变量

- `PORT` - 服务器端口 (默认: 3000)

### Mock 文件命名规则

- 文件名格式: `{description}-{status}.json`
- 描述会自动转换为小写并用连字符分隔
- 特殊字符会被过滤或替换

### 支持的 HTTP 方法

- GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

## 🛠️ API 参考

### startMockServer(port?: number, mockRoot?: string): Promise<void>

启动 mock 服务器

- `port`: 端口号，默认为 3000
- `mockRoot`: mock 文件根目录，默认为 "./mock"
- 返回 Promise，启动成功时 resolve

### MockServerManager 类

#### 构造函数

```typescript
new MockServerManager(config: MockServerConfig)
```

#### 方法

- `start(): Promise<void>` - 启动服务器
- `stop(): Promise<void>` - 停止服务器
- `restart(): Promise<void>` - 重启服务器
- `isServerRunning(): boolean` - 检查服务器状态
- `getStatus()` - 获取服务器状态信息

### MultiServerManager 类

#### 方法

- `createServer(port, config): Promise<MockServerManager>` - 创建服务器
- `removeServer(port): Promise<void>` - 移除服务器
- `stopAllServers(): Promise<void>` - 停止所有服务器
- `getAllServerStatus()` - 获取所有服务器状态
- `getServer(port): MockServerManager | undefined` - 获取特定服务器
- `isPortInUse(port): boolean` - 检查端口是否被使用

## 🎯 最佳实践

### 1. 端口管理

```typescript
// 使用端口范围避免冲突
const startPort = 3000;
const serverCount = 5;

for (let i = 0; i < serverCount; i++) {
  const port = startPort + i;
  if (!multiManager.isPortInUse(port)) {
    await multiManager.createServer(port);
  }
}
```

### 2. 错误处理

```typescript
try {
  const server = await multiManager.createServer(3000);
} catch (error) {
  if (error.message.includes("already exists")) {
    console.log("端口已被使用");
  } else {
    console.error("启动失败:", error);
  }
}
```

### 3. 资源清理

```typescript
// 确保在程序结束时清理资源
process.on("SIGINT", async () => {
  console.log("正在关闭所有服务器...");
  await multiManager.stopAllServers();
  process.exit(0);
});
```

### 4. 健康检查

```typescript
// 定期检查服务器健康状态
setInterval(async () => {
  const statuses = multiManager.getAllServerStatus();
  for (const { port, status } of statuses) {
    try {
      const response = await fetch(`${status.url}/api/endpoints`);
      if (!response.ok) {
        console.log(`服务器 ${port} 不健康`);
      }
    } catch (error) {
      console.log(`服务器 ${port} 连接失败`);
    }
  }
}, 30000); // 每30秒检查一次
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**

   ```typescript
   // 使用随机端口
   const port = Math.floor(Math.random() * 1000) + 3000;
   await startMockServer(port);
   ```

2. **服务器启动失败**

   ```typescript
   try {
     await startMockServer(3000);
   } catch (error) {
     console.error("启动失败:", error);
   }
   ```

3. **资源清理**

   ```typescript
   const server = createMockServer(3000);
   try {
     // 使用服务器
   } finally {
     await server.stop();
   }
   ```

4. **端口冲突**
   ```typescript
   // 检查端口是否可用
   if (!multiManager.isPortInUse(port)) {
     await multiManager.createServer(port);
   }
   ```

## 📈 性能考虑

1. **服务器数量限制**: 建议同时运行的服务器数量不超过 10 个
2. **内存使用**: 每个服务器实例大约占用 50-100MB 内存
3. **端口范围**: 建议使用 3000-3999 范围的端口
4. **清理策略**: 及时清理不需要的服务器实例

## 📝 注意事项

- Mock 目录和文件名只允许字母、数字、连字符、下划线和花括号
- 路径参数格式: `{paramName}`
- 默认响应文件: `successful-operation-200.json`
- 支持通过查询参数临时切换响应: `?mock=error-404.json`
- 端口冲突: 确保端口未被占用
- 资源清理: 在测试完成后记得停止服务器
- 错误处理: 使用 try-catch 处理启动失败的情况
- 并发限制: 避免在同一端口启动多个服务器实例

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📚 相关文档

- [多服务器管理指南](./MULTI_SERVER_GUIDE.md) - 详细的多服务器使用指南
- [重构说明](./REFACTOR_README.md) - 重构历史和迁移指南
