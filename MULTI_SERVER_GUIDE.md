# 多服务器管理指南

## 概述

这个指南展示了如何使用重构后的 Mock Server 来同时管理多个服务器实例。

## 快速开始

### 1. 基本多服务器管理

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

### 2. 环境隔离的多服务器

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

## 可用的示例

### 1. 简化示例

```bash
npm run simple-multi
```

- 启动 3 个基本服务器
- 演示动态添加/移除服务器
- 测试服务器连接
- 优雅关闭

### 2. 完整演示

```bash
npm run multi-demo
```

- 多环境服务器管理
- 实时监控和状态检查
- 负载测试
- 故障恢复模拟
- 完整的生命周期管理

### 3. 管理器示例

```bash
npm run manager
```

- 单个服务器管理
- 便捷函数使用
- 多服务器管理器
- 测试环境使用

## 使用场景

### 1. 多环境开发

```typescript
// 同时运行开发、测试、预发布环境
const devServer = await multiManager.createServer(3000);
const testServer = await multiManager.createServer(3001);
const stagingServer = await multiManager.createServer(3002);

// 每个环境可以有不同的 mock 数据
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

// 随机分发用户到不同版本
```

### 4. 微服务模拟

```typescript
// 模拟微服务架构
const userService = await multiManager.createServer(3000);
const orderService = await multiManager.createServer(3001);
const paymentService = await multiManager.createServer(3002);
const notificationService = await multiManager.createServer(3003);
```

## API 参考

### MultiServerManager 类

#### 创建管理器

```typescript
import { createMultiServerManager } from "./src/mock-server-manager";
const multiManager = createMultiServerManager();
```

#### 主要方法

**createServer(port, config?)**

```typescript
const server = await multiManager.createServer(3000, {
  mockRoot: "./custom-mock",
  autoStart: true,
});
```

**removeServer(port)**

```typescript
await multiManager.removeServer(3000);
```

**stopAllServers()**

```typescript
await multiManager.stopAllServers();
```

**getAllServerStatus()**

```typescript
const statuses = multiManager.getAllServerStatus();
// 返回: Array<{ port: number, status: ServerStatus }>
```

**getServer(port)**

```typescript
const server = multiManager.getServer(3000);
if (server) {
  await server.restart();
}
```

**isPortInUse(port)**

```typescript
const inUse = multiManager.isPortInUse(3000);
```

### MockServerManager 类

#### 单个服务器管理

```typescript
import { MockServerManager } from "./src/mock-server-manager";

const manager = new MockServerManager({
  port: 3000,
  autoStart: false,
});

await manager.start();
await manager.stop();
await manager.restart();

const status = manager.getStatus();
const isRunning = manager.isServerRunning();
```

## 最佳实践

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

## 故障排除

### 常见问题

1. **端口冲突**

   ```typescript
   // 检查端口是否可用
   if (!multiManager.isPortInUse(port)) {
     await multiManager.createServer(port);
   }
   ```

2. **服务器启动失败**

   ```typescript
   try {
     await multiManager.createServer(port);
   } catch (error) {
     console.error("启动失败:", error);
     // 尝试其他端口
   }
   ```

3. **内存泄漏**

   ```typescript
   // 确保及时清理不用的服务器
   await multiManager.removeServer(port);
   // 或者
   await multiManager.stopAllServers();
   ```

4. **网络连接问题**
   ```typescript
   // 检查服务器是否可访问
   const response = await fetch(`${serverUrl}/api/endpoints`);
   if (!response.ok) {
     console.log("服务器不可访问");
   }
   ```

## 性能考虑

1. **服务器数量限制**: 建议同时运行的服务器数量不超过 10 个
2. **内存使用**: 每个服务器实例大约占用 50-100MB 内存
3. **端口范围**: 建议使用 3000-3999 范围的端口
4. **清理策略**: 及时清理不需要的服务器实例

## 扩展功能

### 自定义监控

```typescript
class CustomMultiServerManager extends MultiServerManager {
  async monitorWithCustomLogic() {
    // 自定义监控逻辑
  }
}
```

### 自动恢复

```typescript
// 自动重启失败的服务器
setInterval(async () => {
  const statuses = this.getAllServerStatus();
  for (const { port, status } of statuses) {
    if (!status.isRunning) {
      console.log(`重启服务器 ${port}`);
      await this.createServer(port);
    }
  }
}, 60000);
```
