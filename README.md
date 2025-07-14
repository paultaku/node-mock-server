# Node Mock Server

一个基于 TypeScript 的 mock 服务器，支持从 Swagger (OpenAPI 3.0) YAML 文件自动生成 mock 响应文件，并提供 Web 界面来管理 mock 响应。支持单服务器和多服务器管理，适用于开发、测试和生产环境。

## 🚀 功能特性

- **自动 Mock 文件生成**: 从 Swagger YAML 文件自动生成 mock 响应文件
- **智能路径匹配**: 支持多级路径和路径参数匹配 (如 `/user/{username}`)
- **Web 管理界面**: React-based UI，可视化管理和切换 mock 响应
- **实时切换**: 通过 API 或 UI 实时切换端点的 mock 响应
- **多服务器管理**: 支持同时启动和管理多个服务器实例
- **环境隔离**: 为不同环境配置独立的服务器和 mock 数据
- **类型安全**: 使用 TypeScript 和 Zod 进行类型验证
- **安全的文件命名**: 自动处理特殊字符，避免路径冲突

## 📦 安装

```bash
npm install
```

## 🎯 快速开始

### 1. 生成 Mock 文件

从 Swagger YAML 文件生成 mock 响应文件：

```bash
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

### 2. 启动服务器

#### 基本启动

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

#### 使用函数调用启动

```typescript
import { startMockServer } from "./src/server";

// 使用默认端口 3000
await startMockServer();

// 使用自定义端口
await startMockServer(3001);
```

### 3. 访问管理界面

打开浏览器访问 `http://localhost:3000` 查看 Web 管理界面。

## 🏗️ 项目结构

```
node-mock-server/
├── src/
│   ├── server.ts                    # 核心服务器逻辑
│   ├── mock-server-manager.ts       # 服务器管理类
│   ├── example-usage.ts            # 基本使用示例
│   ├── manager-example.ts          # 管理器使用示例
│   ├── multi-server-demo.ts        # 多服务器演示
│   ├── simple-multi-server.ts      # 简化多服务器示例
│   ├── cli/
│   │   └── generate-mock.ts        # CLI工具入口
│   ├── mock-generator.ts           # Mock目录和文件生成逻辑
│   └── types/
│       └── swagger.ts              # Zod类型定义
├── mock/                           # 自动生成的mock目录
├── public/
│   └── index.html                  # React管理界面
├── demo/
│   └── swagger.yaml                # 示例Swagger文件
└── package.json
```

## 🔧 使用方法

### 单服务器管理

#### 使用 MockServerManager

```typescript
import { MockServerManager } from "./src/mock-server-manager";

// 创建服务器管理器
const manager = new MockServerManager({
  port: 3000,
  autoStart: false,
});

// 启动服务器
await manager.start();

// 检查状态
console.log(manager.getStatus());

// 重启服务器
await manager.restart();

// 停止服务器
await manager.stop();
```

#### 使用便捷函数

```typescript
import { createMockServer } from "./src/mock-server-manager";

// 创建并自动启动服务器
const server = createMockServer(3000);
```

### 多服务器管理

#### 基本多服务器管理

```typescript
import { createMultiServerManager } from "./src/mock-server-manager";

// 创建多服务器管理器
const multiManager = createMultiServerManager();

// 启动多个服务器
const server1 = await multiManager.createServer(3000);
const server2 = await multiManager.createServer(3001);
const server3 = await multiManager.createServer(3002);

// 查看所有服务器状态
const statuses = multiManager.getAllServerStatus();
console.log(statuses);

// 停止所有服务器
await multiManager.stopAllServers();
```

#### 环境隔离的多服务器

```typescript
// 为不同环境启动独立的服务器
const environments = [
  { name: "开发环境", port: 3000, mockRoot: "./mock" },
  { name: "测试环境", port: 3001, mockRoot: "./mock-test" },
  { name: "预发布环境", port: 3002, mockRoot: "./mock-staging" },
];

for (const env of environments) {
  await multiManager.createServer(env.port, {
    mockRoot: env.mockRoot,
  });
}
```

### 测试环境使用

```typescript
import { MockServerManager } from "./src/mock-server-manager";

async function testWithMockServer() {
  const testPort = Math.floor(Math.random() * 1000) + 3000;
  const server = new MockServerManager({ port: testPort });

  try {
    await server.start();

    // 执行测试...
    const response = await fetch(`http://localhost:${testPort}/api/endpoints`);
    const endpoints = await response.json();

    // 验证结果...
  } finally {
    await server.stop();
  }
}
```

## 📋 可用的脚本命令

```bash
# 基本命令
npm run dev                    # 启动默认服务器
npm run generate              # 生成 mock 文件
npm run build                 # 构建项目
npm start                     # 启动生产服务器

# 示例和演示
npm run example               # 运行基本示例
npm run manager               # 运行管理器示例
npm run multi-demo            # 运行完整多服务器演示
npm run simple-multi          # 运行简化多服务器示例

# 测试
npm test                      # 运行测试
npm run test:watch            # 监听模式运行测试
```

## 🌍 使用场景

### 1. 多环境开发

```typescript
// 同时运行开发、测试、预发布环境
const devServer = await multiManager.createServer(3000);
const testServer = await multiManager.createServer(3001);
const stagingServer = await multiManager.createServer(3002);
```

### 2. 负载测试

```typescript
// 启动多个服务器进行负载测试
const servers = [];
for (let i = 0; i < 5; i++) {
  const server = await multiManager.createServer(3000 + i);
  servers.push(server);
}

// 轮询分发请求到不同服务器
for (let i = 0; i < 100; i++) {
  const serverIndex = i % servers.length;
  const server = servers[serverIndex];
  // 发送请求到 server
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

### startMockServer(port?: number): Promise<void>

启动 mock 服务器

- `port`: 端口号，默认为 3000
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
