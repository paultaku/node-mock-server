import * as fs from "fs-extra";
import * as yaml from "yaml";
import * as path from "path";
import { z } from "zod";
import { SwaggerDocSchema, SwaggerDoc } from "./types/swagger";

// 安全的文件名生成
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // 空格转为 -
    .replace(/[^a-z0-9\-_]/g, "-") // 非法字符全部转为 -
    .replace(/-+/g, "-") // 连续 - 合并
    .replace(/^-|-$/g, "") // 去除首尾 -
    .substring(0, 100); // 限制长度
}

// 递归生成 mock 数据
function generateMockDataFromSchema(schema: any, components: any): any {
  if (!schema) return null;

  // 处理 $ref
  if (schema.$ref) {
    const refPath = schema.$ref.replace(/^#\//, "").split("/");
    let ref = components;
    for (const seg of refPath.slice(1)) {
      if (ref && ref[seg]) {
        ref = ref[seg];
      } else {
        console.warn(`Warning: Could not resolve $ref: ${schema.$ref}`);
        return null;
      }
    }
    return generateMockDataFromSchema(ref, components);
  }

  // 优先 example
  if (schema.example !== undefined) return schema.example;

  // type: object
  if (schema.type === "object" || schema.properties) {
    const obj: any = {};
    const props = schema.properties || {};
    for (const [key, propSchema] of Object.entries(props)) {
      obj[key] = generateMockDataFromSchema(propSchema, components);
    }
    return obj;
  }

  // type: array
  if (schema.type === "array" && schema.items) {
    const item = generateMockDataFromSchema(schema.items, components);
    return [item];
  }

  // type: string
  if (schema.type === "string") {
    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0];
    }
    if (schema.format === "date-time") return "2023-01-01T00:00:00Z";
    if (schema.format === "date") return "2023-01-01";
    if (schema.format === "email") return "user@example.com";
    if (schema.format === "uri") return "https://example.com";
    if (schema.format === "uuid") return "123e4567-e89b-12d3-a456-426614174000";
    return "string";
  }

  // type: integer/number
  if (schema.type === "integer" || schema.type === "number") {
    if (schema.minimum !== undefined) return schema.minimum;
    if (schema.maximum !== undefined) return Math.floor(schema.maximum / 2);
    return 0;
  }

  // type: boolean
  if (schema.type === "boolean") {
    return true;
  }

  // fallback
  return null;
}

// 生成默认的响应文件
function generateDefaultResponses(): Record<string, any> {
  return {
    "200": {
      description: "Successful operation",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    "400": {
      description: "Bad request",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    "404": {
      description: "Not found",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    "500": {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
  };
}

export async function generateMockFromSwagger(
  swaggerPath: string,
  outputPath: string
): Promise<void> {
  try {
    console.log(`Reading Swagger file: ${swaggerPath}`);

    // 读取 swagger yaml
    const raw = await fs.readFile(swaggerPath, "utf-8");
    const doc = yaml.parse(raw);

    // 类型校验
    const swagger: SwaggerDoc = SwaggerDocSchema.parse(doc);
    const components = swagger.components || {};

    console.log(`Processing ${Object.keys(swagger.paths).length} paths...`);

    // 遍历 paths
    for (const [apiPath, methods] of Object.entries(swagger.paths)) {
      for (const [method, operation] of Object.entries<any>(
        methods as Record<string, any>
      )) {
        const methodUpper = method.toUpperCase();

        // 跳过非HTTP方法
        if (
          ![
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "HEAD",
            "OPTIONS",
          ].includes(methodUpper)
        ) {
          continue;
        }

        // 构建目录路径
        const pathParts = apiPath.replace(/^\//, "").split("/");
        const safePathParts = pathParts.map((part) => {
          // 保持路径参数格式 {paramName}
          if (part.startsWith("{") && part.endsWith("}")) {
            return part;
          }
          // 其他部分进行安全处理
          return sanitizeFileName(part);
        });

        const endpointDir = path.join(
          outputPath,
          ...safePathParts,
          methodUpper
        );
        await fs.ensureDir(endpointDir);

        console.log(`Generated directory: ${endpointDir}`);

        // 处理响应
        const responses = operation.responses || generateDefaultResponses();

        for (const [status, resp] of Object.entries<any>(responses)) {
          const desc = resp.description
            ? sanitizeFileName(resp.description)
            : "response";

          const fileName = `${desc}-${status}.json`;
          const filePath = path.join(endpointDir, fileName);

          // 生成 mock 数据
          let mockBody = {};

          // 只处理 application/json
          const content = resp.content?.["application/json"];
          if (content && content.schema) {
            mockBody = generateMockDataFromSchema(content.schema, components);
          } else {
            // 如果没有schema，生成默认响应
            mockBody = {
              success: status === "200",
              message: resp.description || "Response",
              status: parseInt(status),
            };
          }

          const mock = {
            header: [],
            body: mockBody,
          };

          await fs.writeJson(filePath, mock, { spaces: 2 });
          console.log(`Generated mock file: ${filePath}`);
        }
      }
    }

    console.log("Mock generation completed successfully!");
  } catch (error) {
    console.error("Error generating mock files:", error);
    throw error;
  }
}

// 为了兼容性保留 CommonJS 导出
module.exports = { generateMockFromSwagger };
