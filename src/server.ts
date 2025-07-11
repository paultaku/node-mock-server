import express, { Request, Response } from "express";
import path from "path";
import fs from "fs-extra";
import { z } from "zod";

const MOCK_ROOT = path.resolve(__dirname, "../mock");
const DEFAULT_MOCK_FILE = "successful-operation-200.json";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// 存储当前每个端点的mock响应状态
const mockStates = new Map<string, string>();

const app = express();

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 只允许字母、数字、-、_、{}，不允许 : * ? ( ) [ ] 等
function isValidMockPart(part: string): boolean {
  return /^[a-zA-Z0-9_\-{}]+$/.test(part);
}

// 获取所有 mock endpoint 模板（如 user/{username}/GET）
async function getAllMockTemplates(): Promise<string[][]> {
  async function walk(dir: string, parts: string[] = []): Promise<string[][]> {
    const entries = await fs.readdir(dir);
    let results: string[][] = [];

    for (const entry of entries) {
      if (!isValidMockPart(entry)) continue; // 跳过非法命名
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // 判断该目录下是否有 json 文件（即方法目录）
        const files = await fs.readdir(fullPath);
        const jsonFiles = files.filter((f) => f.endsWith(".json"));
        if (jsonFiles.length > 0) {
          // 这是方法目录，push parts+method
          results.push([...parts, entry]);
        }
        // 继续递归
        results = results.concat(await walk(fullPath, [...parts, entry]));
      }
    }
    return results;
  }
  return walk(MOCK_ROOT);
}

// 路径参数模板匹配
function matchTemplate(
  requestParts: string[],
  templates: string[][],
  method: string
): { template: string[]; params: Record<string, string> } | null {
  let bestMatch: { template: string[]; params: Record<string, string> } | null =
    null;

  for (const tpl of templates) {
    if (tpl.length !== requestParts.length + 1) continue; // +1 for method
    const lastElement = tpl[tpl.length - 1];
    if (!lastElement || lastElement.toUpperCase() !== method) continue;

    let params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < requestParts.length; i++) {
      const tplElement = tpl[i];
      if (!tplElement) continue;

      if (tplElement.startsWith("{") && tplElement.endsWith("}")) {
        params[tplElement.slice(1, -1)] = requestParts[i] || "";
      } else if (tplElement !== requestParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      bestMatch = { template: tpl, params };
      break;
    }
  }

  return bestMatch;
}

// 获取端点的所有可用mock文件
async function getAvailableMockFiles(endpointDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(endpointDir);
    return files.filter((file): file is string => file.endsWith(".json"));
  } catch (error) {
    return [];
  }
}

// 获取当前端点的mock状态key
function getMockStateKey(path: string, method: string): string {
  return `${method.toUpperCase()}:${path}`;
}

// API端点：获取所有可用的端点
app.get("/api/endpoints", async (req: Request, res: Response) => {
  try {
    console.log("Getting all mock templates...");
    const templates = await getAllMockTemplates();
    console.log("Templates found:", templates);
    const endpoints = templates.map((template) => {
      const method = template[template.length - 1] || "";
      const pathParts = template.slice(0, -1);
      const apiPath = "/" + pathParts.join("/");
      const stateKey = getMockStateKey(apiPath, method);
      const currentMock = mockStates.get(stateKey) || DEFAULT_MOCK_FILE;

      return {
        path: apiPath,
        method: method,
        currentMock: currentMock,
        availableMocks: [] as string[], // 将在下面填充
      };
    });

    // 获取每个端点的可用mock文件
    for (const endpoint of endpoints) {
      const endpointDir = path.join(
        MOCK_ROOT,
        ...endpoint.path.replace(/^\//, "").split("/"),
        endpoint.method
      );
      endpoint.availableMocks = await getAvailableMockFiles(endpointDir);
    }

    res.json(endpoints);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get endpoints", detail: String(error) });
  }
});

// API端点：设置端点的mock响应
const SetMockRequestSchema = z.object({
  path: z.string(),
  method: z.string(),
  mockFile: z.string(),
});

app.post("/api/set-mock", async (req: Request, res: Response) => {
  try {
    const {
      path: apiPath,
      method,
      mockFile,
    } = SetMockRequestSchema.parse(req.body);

    // 验证mock文件是否存在
    const endpointDir = path.join(
      MOCK_ROOT,
      ...apiPath.replace(/^\//, "").split("/"),
      method.toUpperCase()
    );
    const mockFilePath = path.join(endpointDir, mockFile);

    if (!(await fs.pathExists(mockFilePath))) {
      return res
        .status(400)
        .json({ error: "Mock file not found", file: mockFilePath });
    }

    // 设置状态
    const stateKey = getMockStateKey(apiPath, method);
    mockStates.set(stateKey, mockFile);

    return res.json({ success: true, message: "Mock response updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request data", details: error.errors });
    } else {
      return res
        .status(500)
        .json({ error: "Failed to set mock", detail: String(error) });
    }
  }
});

// API端点：获取端点的当前mock状态
app.get("/api/mock-state", async (req: Request, res: Response) => {
  try {
    const { method, path: apiPath } = req.query;
    if (
      !method ||
      !apiPath ||
      typeof method !== "string" ||
      typeof apiPath !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "Missing method or path parameter" });
    }
    const stateKey = getMockStateKey(apiPath, method);
    const currentMock = mockStates.get(stateKey) || DEFAULT_MOCK_FILE;

    return res.json({ currentMock });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to get mock state", detail: String(error) });
  }
});

// 主要的mock服务器逻辑
app.use(async (req: Request, res: Response, next) => {
  try {
    const reqPath = req.path.replace(/^\//, "");
    const method = req.method.toUpperCase();
    const requestParts = reqPath ? reqPath.split("/") : [];

    // 跳过API端点
    if (reqPath.startsWith("api/")) {
      return next();
    }

    const templates = await getAllMockTemplates();
    const match = matchTemplate(requestParts, templates, method);

    let endpointDir: string;
    let apiPath: string;

    if (match) {
      endpointDir = path.join(MOCK_ROOT, ...match.template);
      apiPath = "/" + match.template.slice(0, -1).join("/");
    } else {
      // fallback: 精确路径
      endpointDir = path.join(MOCK_ROOT, ...requestParts, method);
      apiPath = "/" + requestParts.join("/");
    }

    // 选择 mock 响应文件
    const stateKey = getMockStateKey(apiPath, method);
    const mockFile =
      (req.query.mock as string) ||
      mockStates.get(stateKey) ||
      DEFAULT_MOCK_FILE;
    const filePath = path.join(endpointDir, mockFile);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        error: "Mock file not found",
        file: filePath,
        availableFiles: await getAvailableMockFiles(endpointDir),
      });
    }

    const mock = await fs.readJson(filePath);

    // 设置 header
    if (Array.isArray(mock.header)) {
      for (const h of mock.header) {
        if (h && h.key && h.value) {
          res.setHeader(h.key, h.value);
        }
      }
    }

    // 设置状态码
    const statusMatch = mockFile.match(/-(\d+)\.json$/);
    if (statusMatch && statusMatch[1]) {
      res.status(parseInt(statusMatch[1]));
    }

    return res.json(mock.body);
  } catch (err) {
    console.error("Error handling request:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: String(err),
      path: req.path,
      method: req.method || "UNKNOWN",
    });
  }
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
  console.log(
    `API endpoints available at http://localhost:${PORT}/api/endpoints`
  );
  console.log(`Mock root directory: ${MOCK_ROOT}`);
});
