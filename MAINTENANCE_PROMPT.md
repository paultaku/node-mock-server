# Node Mock Server - 维护提示词

## 项目概述

**Role**: Senior software developer, responsible for maintaining and extending a clean, well-organized, and maintainable mock server codebase.

---

## 用户场景

### 1. 自动静态 Mock 文件系统生成

- 用户希望基于 Swagger (OpenAPI 3.0, YAML) API 定义自动生成静态 mock 目录结构
- 例如，`/user/login` 端点使用 GET 方法将生成类似 `mock/user/login/GET` 的文件夹，并在其中包含 `successful-operation-200.json`、`invalid-username-password-supplied-400.json` 等文件
- 示例响应文件内容：

```json
{
  "header": [],
  "body": { "token": "abc123", "user": { "id": 1, "name": "John Doe" } }
}
```

### 2. 通过 UI 切换 API 响应

- 用户可以通过基于 React 的前端 UI 为每个 API 端点切换活动的 mock 响应（例如选择 `successful-operation-200.json` 或 `invalid-username-password-supplied-400.json`）
- 后端 Express 服务器根据 UI 选择返回选定的 mock 响应

---

## 技术架构

- **语言**: TypeScript
- **类型验证**: zod
- **后端**: Express
- **前端**: React (嵌入在 HTML 中，使用 CDN)
- **Mock 目录生成**: CLI 工具，支持 YAML Swagger 解析，自动生成多级路径
- **单元测试**: Jest (已配置但测试因复杂性而移除)

---

## 详细功能与实现

### 1. 自动 Mock 目录生成

- 使用 CLI 工具（例如 `npm run generate -- --swagger ./demo/swagger.yaml --output ./mock`）解析 Swagger YAML 并自动生成 mock 目录和响应文件
- 响应文件命名固定（例如 `successful-operation-200.json`、`invalid-username-password-supplied-400.json`），内容基于 Swagger 响应模式自动生成，优先使用 example 字段
- 支持多级路径和路径参数（例如 `/user/{username}`）
- **安全性**: 只允许字母、数字、-、\*、{} 在 mock 目录和文件名中使用；跳过无效名称以避免路由冲突和 path-to-regexp 错误

### 2. Mock 服务器

- 具有自动路由的 Express 服务器，支持多级和路径参数匹配（例如 `/user/jack` 匹配 `/user/{username}`）
- 从 mock 文件返回 header 和 body
- **API 端点**:
  - GET /api/endpoints - 获取所有可用的 API 端点及其当前的 mock 状态
  - POST /api/set-mock - 为端点设置 mock 响应
  - GET /api/mock-state - 获取端点的当前 mock 状态
- **防御性处理**: 验证文件存在，优雅处理缺失响应，设置适当的 HTTP 状态码

### 3. UI (已实现)

- React 前端显示所有端点和方法，允许用户切换当前的 mock 响应
- 使用 API 获取和设置当前响应
- **功能**:
  - 实时端点列表和统计
  - 每个端点可用 mock 文件的下拉选择
  - 视觉状态指示器（成功/错误/警告）
  - 响应式设计和现代 UI

### 4. 类型安全

- 使用 zod 定义 Swagger 结构、mock 响应结构和用于切换响应的 API 类型
- 启用严格模式的全面 TypeScript 配置

### 5. 单元测试

- 使用 Jest 配置准备测试 Swagger 解析、mock 目录生成、响应切换等

---

## 推荐依赖

- yaml: YAML 解析
- zod: 类型验证
- fs-extra: 文件操作
- commander: CLI 工具
- express, @types/express: API 服务器
- jest, ts-jest: 单元测试
- ts-node, typescript: 开发环境

---

## 当前目录结构

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
├── public/
│   └── index.html                  # React前端 (CDN-based)
├── mock/                           # 自动生成的mock目录
├── demo/
│   └── swagger.yaml                # 示例Swagger文件
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

---

## 使用示例

### 1. 生成 Mock

```bash
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

### 2. 启动

```bash
npm run dev
```

### 3. 访问管理 UI

打开浏览器访问 `http://localhost:3000`

### 4. API 测试

```bash
# 获取所有端点
curl http://localhost:3000/api/endpoints

# 设置mock响应
curl -X POST http://localhost:3000/api/set-mock \
  -H "Content-Type: application/json" \
  -d '{"path": "/user/login", "method": "GET", "mockFile": "successful-operation-200.json"}'

# 测试mock API
curl http://localhost:3000/user/login
```

---

## 关键功能实现

- ✅ **自动 mock 文件生成** 从 Swagger YAML
- ✅ **智能路径匹配** 支持参数
- ✅ **基于 React 的管理 UI** 实时切换
- ✅ **类型安全实现** Zod 验证
- ✅ **防御性错误处理** 和安全措施
- ✅ **全面的 CLI 工具** mock 生成
- ✅ **API 端点** 程序化控制
- ✅ **现代 UI 设计** 状态指示器

---

## 多服务器管理功能

### 新增功能

- **模块化设计**: 服务器逻辑封装在 `startMockServer()` 函数中
- **多服务器管理**: `MockServerManager` 和 `MultiServerManager` 类
- **环境隔离**: 支持不同环境的独立服务器配置
- **负载测试**: 支持多服务器负载测试
- **健康监控**: 实时服务器状态检查

### 使用场景

1. **多环境开发**: 同时运行开发、测试、预发布环境
2. **负载测试**: 启动多个服务器进行性能测试
3. **A/B 测试**: 不同配置的服务器版本对比
4. **微服务模拟**: 模拟微服务架构

### 可用脚本

```bash
npm run dev                    # 启动默认服务器
npm run example               # 运行基本示例
npm run manager               # 运行管理器示例
npm run multi-demo            # 运行完整多服务器演示
npm run simple-multi          # 运行简化多服务器示例
npm run generate              # 生成 mock 文件
```

---

## 注意事项

- 不要在 mock 目录或文件名中使用特殊字符如 : _ ? ( ) [ ]；只使用字母、数字、-、_、{}
- 路径参数支持格式 {paramName}
- 默认 mock 文件是 successful-operation-200.json
- 支持通过查询参数临时切换响应: ?mock=error-404.json
- 系统已生产就绪，可以根据需要扩展高级功能（例如 mock 响应的热切换、UI 交互、mock 文件的自动刷新）

---

## 维护指南

### 常见问题解决

1. **path-to-regexp 错误**: 通常由 Express 版本兼容性问题引起，已通过降级到 Express 4.x 解决
2. **端口冲突**: 使用 `MultiServerManager` 的端口检查功能
3. **Mock 文件生成问题**: 检查 Swagger 文件格式和路径参数
4. **服务器启动失败**: 检查端口占用和依赖安装

### 扩展建议

1. **添加新的 HTTP 方法支持**
2. **增强 UI 功能**（如批量操作、导入/导出配置）
3. **添加认证和授权**
4. **支持 WebSocket 连接**
5. **添加性能监控和日志记录**

### 测试策略

1. **单元测试**: 测试各个模块的功能
2. **集成测试**: 测试完整的服务器功能
3. **端到端测试**: 测试 UI 和 API 的交互
4. **性能测试**: 测试多服务器场景下的性能

---

## 版本历史

### v1.0.0 - 基础功能

- 基本的 mock 服务器功能
- Swagger 文件解析和 mock 生成
- React UI 管理界面

### v2.0.0 - 多服务器管理

- 模块化服务器架构
- 多服务器管理类
- 环境隔离支持
- 负载测试功能

---

## 贡献指南

1. **代码风格**: 遵循 TypeScript 最佳实践
2. **测试**: 新功能需要包含测试
3. **文档**: 更新相关文档和示例
4. **类型安全**: 使用 Zod 进行类型验证
5. **错误处理**: 实现防御性编程

---

## 联系信息

- **项目**: @paultaku/node-mock-server
- **作者**: paultaku
- **许可证**: MIT
