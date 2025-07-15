import fs from "fs-extra";
import path from "path";

export interface StatusJson {
  selected: string;
  delayMillisecond?: number; // 可选延迟字段，单位毫秒
}

const DEFAULT_MOCK_FILE = "successful-operation-200.json";

/**
 * 获取 status.json 路径
 * @param mockRoot mock 根目录
 * @param endpointPath 形如 /pet/{petId}
 * @param method HTTP 方法（GET/POST/...）
 */
export function getStatusJsonPath(mockRoot: string, endpointPath: string, method: string): string {
  return path.join(mockRoot, ...endpointPath.replace(/^\//, "").split("/"), method.toUpperCase(), "status.json");
}

/**
 * 读取 status.json
 * @param statusPath status.json 文件路径
 * @returns StatusJson 对象或 null
 */
export async function readStatusJson(statusPath: string): Promise<StatusJson | null> {
  try {
    const data = await fs.readJson(statusPath);
    if (typeof data.selected === "string" && data.selected.endsWith(".json")) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 写入 status.json（原子写入）
 * @param statusPath status.json 文件路径
 * @param selected 选中的 mock 文件名
 */
export async function writeStatusJson(statusPath: string, selected: string): Promise<void> {
  await fs.writeJson(statusPath, { selected }, { spaces: 2 });
}

/**
 * 初始化所有 endpoint 的 mock 选择状态
 * @param mockRoot mock 根目录
 * @param templates 所有 endpoint 模板数组
 * @returns Map<stateKey, selectedMockFile>
 */
export async function loadAllStatusJson(mockRoot: string, templates: string[][]): Promise<Map<string, string>> {
  const stateMap = new Map<string, string>();
  for (const template of templates) {
    const method = template[template.length - 1] || "";
    const endpointPath = "/" + template.slice(0, -1).join("/");
    if (!method) continue; // 跳过无效 method
    const statusPath = getStatusJsonPath(mockRoot, endpointPath, method);
    const status = await readStatusJson(statusPath);
    if (status && status.selected) {
      stateMap.set(`${method.toUpperCase()}:${endpointPath}`, status.selected);
    } else {
      // fallback
      stateMap.set(`${method.toUpperCase()}:${endpointPath}`, DEFAULT_MOCK_FILE);
    }
  }
  return stateMap;
} 