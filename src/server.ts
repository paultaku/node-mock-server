import express, { Request, Response } from "express";
import path from "path";
import fs from "fs-extra";
import { z } from "zod";
import {
  getStatusJsonPath,
  readStatusJson,
  writeStatusJson,
  loadAllStatusJson,
} from "./status-manager";

const MOCK_ROOT = path.resolve(__dirname, "../mock");
const DEFAULT_MOCK_FILE = "successful-operation-200.json";

// Store the mock response state of each endpoint
let mockStates = new Map<string, string>();

// Only allow letters, numbers, -, _, {}, not : * ? ( ) [ ] etc.
function isValidMockPart(part: string): boolean {
  return /^[a-zA-Z0-9_\-{}]+$/.test(part);
}

// Get all mock endpoint templates (e.g. user/{username}/GET)
async function getAllMockTemplates(): Promise<string[][]> {
  async function walk(dir: string, parts: string[] = []): Promise<string[][]> {
    const entries = await fs.readdir(dir);
    let results: string[][] = [];

    for (const entry of entries) {
      if (!isValidMockPart(entry)) continue; // Skip invalid names
      const fullPath = path.join(dir, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // Check if there are json files under this directory (i.e. method directory)
        const files = await fs.readdir(fullPath);
        const jsonFiles = files.filter((f) => f.endsWith(".json"));
        if (jsonFiles.length > 0) {
          // This is a method directory, push parts+method
          results.push([...parts, entry]);
        }
        // Continue recursion
        results = results.concat(await walk(fullPath, [...parts, entry]));
      }
    }
    return results;
  }
  return walk(MOCK_ROOT);
}

// Path parameter template matching
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

// Get all available mock files for an endpoint
async function getAvailableMockFiles(endpointDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(endpointDir);
    return files.filter((file): file is string => file.endsWith(".json"));
  } catch (error) {
    return [];
  }
}

// Get the mock state key for the current endpoint
function getMockStateKey(path: string, method: string): string {
  return `${method.toUpperCase()}:${path}`;
}

// Create Express app
function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../public")));

  // 服务启动时加载所有 status.json
  (async () => {
    const templates = await getAllMockTemplates();
    mockStates = await loadAllStatusJson(MOCK_ROOT, templates);
    console.log("[status-manager] 已加载所有 status.json");
  })();

  // API endpoint: get all available endpoints
  app.get("/api/endpoints", async (req: Request, res: Response) => {
    try {
      console.log("Getting all mock templates...");
      const templates = await getAllMockTemplates();
      console.log("Templates found:", templates);
      const endpoints = [];
      for (const template of templates) {
        const method = template[template.length - 1] || "";
        const pathParts = template.slice(0, -1);
        const apiPath = "/" + pathParts.join("/");
        const stateKey = getMockStateKey(apiPath, method);
        const currentMock = mockStates.get(stateKey) || DEFAULT_MOCK_FILE;
        // 读取 status.json 获取 delayMillisecond
        const statusPath = getStatusJsonPath(MOCK_ROOT, apiPath, method);
        let delayMillisecond = undefined;
        try {
          const status = await readStatusJson(statusPath);
          if (status && typeof status.delayMillisecond === "number") {
            delayMillisecond = status.delayMillisecond;
          }
        } catch {}
        endpoints.push({
          path: apiPath,
          method: method,
          currentMock: currentMock,
          availableMocks: [] as string[], // 明确类型
          delayMillisecond,
        });
      }
      // Get available mock files for each endpoint
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

  // API endpoint: set the mock response for an endpoint
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

      // Validate if the mock file exists
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

      // Set state
      const stateKey = getMockStateKey(apiPath, method);
      mockStates.set(stateKey, mockFile);

      // 写入 status.json
      const statusPath = getStatusJsonPath(MOCK_ROOT, apiPath, method);
      await writeStatusJson(statusPath, mockFile);
      console.log(`[status-manager] 已更新 ${statusPath} -> ${mockFile}`);

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

  // API endpoint: get the current mock state of an endpoint
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

  // 新增：设置延迟的 API
  // 1. /api/set-delay 校验和写入
  const SetDelayRequestSchema = z.object({
    path: z.string(),
    method: z.string(),
    delayMillisecond: z.number().min(0).max(60000),
  });

  app.post("/api/set-delay", async (req: Request, res: Response) => {
    try {
      const { path: apiPath, method, delayMillisecond } = SetDelayRequestSchema.parse(req.body);
      const statusPath = getStatusJsonPath(MOCK_ROOT, apiPath, method);
      let status = await readStatusJson(statusPath);
      if (!status) status = { selected: DEFAULT_MOCK_FILE };
      await fs.writeJson(statusPath, { ...status, delayMillisecond }, { spaces: 2 });
      console.log(`[status-manager] 已为 ${statusPath} 设置延迟 ${delayMillisecond}ms`);
      return res.json({ success: true, message: `Delay set to ${delayMillisecond}ms` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        return res.status(500).json({ error: "Failed to set delay", detail: String(error) });
      }
    }
  });

  // The main mock server logic
  app.use(async (req: Request, res: Response, next) => {
    try {
      const reqPath = req.path.replace(/^\//, "");
      const method = req.method.toUpperCase();
      const requestParts = reqPath ? reqPath.split("/") : [];

      // Skip API endpoints
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
        // fallback: exact path
        endpointDir = path.join(MOCK_ROOT, ...requestParts, method);
        apiPath = "/" + requestParts.join("/");
      }

      // Select mock response file
      const stateKey = getMockStateKey(apiPath, method);
      let mockFile = mockStates.get(stateKey);
      if (!mockFile) {
        // fallback: 读取 status.json 或默认
        const statusPath = getStatusJsonPath(MOCK_ROOT, apiPath, method);
        const status = await readStatusJson(statusPath);
        if (status && status.selected) {
          mockFile = status.selected;
          mockStates.set(stateKey, mockFile);
          console.log(`[status-manager] fallback 读取 ${statusPath} -> ${mockFile}`);
        } else {
          mockFile = DEFAULT_MOCK_FILE;
          mockStates.set(stateKey, mockFile);
          console.log(`[status-manager] fallback 默认 ${stateKey} -> ${mockFile}`);
        }
      }
      const filePath = path.join(endpointDir, mockFile);

      if (!(await fs.pathExists(filePath))) {
        return res.status(404).json({
          error: "Mock file not found",
          file: filePath,
          availableFiles: await getAvailableMockFiles(endpointDir),
        });
      }

      const mock = await fs.readJson(filePath);

      // Set headers
      if (Array.isArray(mock.header)) {
        for (const h of mock.header) {
          if (h && h.key && h.value) {
            res.setHeader(h.key, h.value);
          }
        }
      }

      // Set status code
      const statusMatch = mockFile.match(/-(\d+)\.json$/);
      if (statusMatch && statusMatch[1]) {
        res.status(parseInt(statusMatch[1]));
      }

      // 读取 status.json 以获取 delayMillisecond
      const statusPath = getStatusJsonPath(MOCK_ROOT, apiPath, method);
      const status = await readStatusJson(statusPath);
      let delayMillisecond = 0;
      if (status) {
        if (typeof status.delayMillisecond === "number" && status.delayMillisecond > 0) {
          delayMillisecond = status.delayMillisecond;
        } else if (typeof status.delayMillisecond === "number" && status.delayMillisecond > 0) {
          // 兼容旧字段
          delayMillisecond = status.delayMillisecond * 1000;
        }
        if (delayMillisecond > 0) {
          console.log(`[status-manager] ${apiPath} ${method} 延迟 ${delayMillisecond}ms`);
        }
      }
      // 延迟响应
      if (delayMillisecond > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMillisecond));
      }

      return res.json(mock.body);
    } catch (error) {
      return res.status(500).json({ error: "Mock server error", detail: String(error) });
    }
  });

  // 404 handling
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}

// Function to start the server
export function startMockServer(port: number = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const app = createApp();
      const server = app.listen(port, () => {
        console.log(`Mock server running at http://localhost:${port}`);
        console.log(
          `API endpoints available at http://localhost:${port}/api/endpoints`
        );
        console.log(`Mock root directory: ${MOCK_ROOT}`);
        resolve();
      });

      server.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// If this file is run directly, start the server
if (require.main === module) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  startMockServer(PORT).catch((error) => {
    console.error("Failed to start mock server:", error);
    process.exit(1);
  });
}
