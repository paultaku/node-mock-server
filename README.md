# Node Mock Server

一个基于 TypeScript 的 mock 服务器，支持从 Swagger (OpenAPI 3.0) YAML 文件自动生成 mock 响应文件，并提供 Web 界面来管理 mock 响应。

## 功能特性

- 🚀 **自动 Mock 文件生成**: 从 Swagger YAML 文件自动生成 mock 响应文件
- 🎯 **智能路径匹配**: 支持多级路径和路径参数匹配 (如 `/user/{username}`)
- 🎨 **Web 管理界面**: React-based UI，可视化管理和切换 mock 响应
- 🔄 **实时切换**: 通过 API 或 UI 实时切换端点的 mock 响应
- 🛡️ **类型安全**: 使用 TypeScript 和 Zod 进行类型验证
- 📁 **安全的文件命名**: 自动处理特殊字符，避免路径冲突

## 快速开始

### 安装依赖

```bash
npm install
```

### 生成 Mock 文件

从 Swagger YAML 文件生成 mock 响应文件：

```bash
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

或者使用 CLI 工具：

```bash
npx ts-node src/cli/generate-mock.ts --swagger ./demo/swagger.yaml --output ./mock
```

### 启动 Mock 服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 项目结构

```
node-mock-server/
├── src/
│   ├── cli/
│   │   └── generate-mock.ts      # CLI工具入口
│   ├── mock-generator.ts         # Mock目录和文件生成逻辑
│   ├── server.ts                 # Express mock服务器
│   └── types/
│       └── swagger.ts            # Zod类型定义
├── mock/                         # 自动生成的mock目录
├── public/
│   └── index.html               # React管理界面
├── demo/
│   └── swagger.yaml             # 示例Swagger文件
└── package.json
```

## Mock 文件格式

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

## API 端点

### Mock 服务器端点

- `GET /api/endpoints` - 获取所有可用的 API 端点
- `POST /api/set-mock` - 设置端点的 mock 响应
- `GET /api/mock-state/:method/:path` - 获取端点的当前 mock 状态

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

## Web 管理界面

访问 `http://localhost:3000` 打开 Web 管理界面，可以：

- 查看所有可用的 API 端点
- 实时切换每个端点的 mock 响应
- 查看端点统计信息
- 刷新端点列表

## 配置选项

### 环境变量

- `PORT` - 服务器端口 (默认: 3000)

### Mock 文件命名规则

- 文件名格式: `{description}-{status}.json`
- 描述会自动转换为小写并用连字符分隔
- 特殊字符会被过滤或替换

### 支持的 HTTP 方法

- GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

## 开发

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 示例

### 1. 生成 Mock 文件

```bash
# 从示例Swagger文件生成mock
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

### 2. 启动服务器

```bash
npm run dev
```

### 3. 访问管理界面

打开浏览器访问 `http://localhost:3000`

### 4. 测试 API

```bash
# 测试用户登录
curl http://localhost:3000/user/login

# 测试宠物查询
curl http://localhost:3000/pet/findByStatus

# 测试带参数的路径
curl http://localhost:3000/user/john
```

## 注意事项

- Mock 目录和文件名只允许字母、数字、连字符、下划线和花括号
- 路径参数格式: `{paramName}`
- 默认响应文件: `successful-operation-200.json`
- 支持通过查询参数临时切换响应: `?mock=error-404.json`

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
