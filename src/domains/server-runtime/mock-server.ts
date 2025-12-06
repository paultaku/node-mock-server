/**
 * Mock Server
 *
 * Main Express server implementation for serving mock responses.
 * Aggregate root for the Server Runtime domain.
 */

import express, { Request, Response, Application } from "express";
import path from "path";
import { z } from "zod";
import {
  getAllMockTemplates,
  matchTemplate,
  getAvailableMockFiles,
} from "./route-matcher";
import {
  readStatusJson,
  writeStatusJson,
  getStatusJsonPath,
  StatusJson,
} from "./status-tracker";
import {
  readMockResponse,
  extractStatusCode,
  mockFileExists,
} from "./response-renderer";
import { writeJson, fileExists } from "../../shared/file-system";
import {
  CreateEndpointRequestSchema,
  formatValidationErrors,
  formatScenarioValidationErrors,
  HTTP_STATUS,
} from "../../shared/types/validation-schemas";
import { generateEndpointFiles } from "./endpoint-file-generator";
import { ScenarioManager } from "./scenario-manager";
import { ScenarioRepository } from "./scenario-repository";
import { ActiveScenarioTracker } from "./active-scenario-tracker";
import { ScenarioApplicator } from "./scenario-applicator";
import {
  CreateScenarioRequest,
  UpdateScenarioRequest,
  DuplicateScenarioError,
  EmptyScenarioError,
  ScenarioNotFoundError,
  DuplicateEndpointError,
} from "../../shared/types/scenario-types";
import {
  CreateScenarioRequestSchema,
  UpdateScenarioRequestSchema,
} from "../../shared/types/validation-schemas";

const DEFAULT_MOCK_ROOT = path.resolve(__dirname, "../../../mock");
const DEFAULT_MOCK_FILE = "successful-operation-200.json";

/**
 * Create Express application with mock server middleware
 * @param mockRoot - Root directory for mock files
 * @returns Express application
 */
export function createApp(mockRoot: string = DEFAULT_MOCK_ROOT): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../../../public")));

  // API endpoint: get all available endpoints
  app.get("/_mock/endpoints", async (req: Request, res: Response) => {
    try {
      console.log("Getting all mock templates...");
      const templates = await getAllMockTemplates(mockRoot);
      console.log("Templates found:", templates);
      const endpoints = [];

      for (const template of templates) {
        const method = template[template.length - 1] || "";
        const pathParts = template.slice(0, -1);
        const apiPath = "/" + pathParts.join("/");

        // Read status.json to get currentMock and delayMillisecond
        const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
        let currentMock = DEFAULT_MOCK_FILE;
        let delayMillisecond = undefined;
        try {
          const status = await readStatusJson(statusPath);
          if (status) {
            if (status.selected) {
              currentMock = status.selected;
            }
            if (typeof status.delayMillisecond === "number") {
              delayMillisecond = status.delayMillisecond;
            }
          }
        } catch {}

        endpoints.push({
          path: apiPath,
          method: method,
          currentMock: currentMock,
          availableMocks: [] as string[], // Explicit type
          delayMillisecond,
        });
      }

      // Get available mock files for each endpoint
      for (const endpoint of endpoints) {
        const endpointDir = path.join(
          mockRoot,
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

  // API endpoint: create new mock endpoint
  app.post("/_mock/endpoints", async (req: Request, res: Response) => {
    try {
      // Validate request with Zod
      const validationResult = CreateEndpointRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(formatValidationErrors(validationResult.error));
      }

      const { path: apiPath, method } = validationResult.data;

      // Check for duplicates
      const pathSegments = apiPath.substring(1).split("/");
      const endpointDir = path.join(
        mockRoot,
        ...pathSegments,
        method.toUpperCase()
      );

      if (await fileExists(endpointDir)) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: "Endpoint already exists",
          existingEndpoint: {
            path: apiPath,
            method,
            mockDirectory: endpointDir,
          },
        });
      }

      // Generate files
      const result = await generateEndpointFiles({
        mockRoot,
        path: apiPath,
        method,
      });

      // Return success
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Endpoint created successfully",
        endpoint: {
          path: apiPath,
          method,
          filesCreated: result.filesCreated,
          availableAt: `http://localhost:3000${apiPath.replace(
            /{[^}]+}/g,
            "123"
          )}`,
          mockDirectory: result.mockDirectory,
        },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: "Failed to create endpoint",
        detail: String(error),
      });
    }
  });

  // API endpoint: update mock status via /_mock URL segment
  app.post("/_mock/update", async (req: Request, res: Response) => {
    try {
      const { path: apiPath, method, mockFile, delayMillisecond } = req.body;

      if (!apiPath || !method) {
        return res
          .status(400)
          .json({ error: "Missing required parameters: path and method" });
      }

      const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
      let status = await readStatusJson(statusPath);
      if (!status) status = { selected: DEFAULT_MOCK_FILE };

      // Update mock file if provided
      if (mockFile) {
        // Validate if the mock file exists
        const endpointDir = path.join(
          mockRoot,
          ...apiPath.replace(/^\//, "").split("/"),
          method.toUpperCase()
        );
        const mockFilePath = path.join(endpointDir, mockFile);

        if (!(await fileExists(mockFilePath))) {
          return res
            .status(400)
            .json({ error: "Mock file not found", file: mockFilePath });
        }

        status.selected = mockFile;
      }

      // Update delay if provided
      if (typeof delayMillisecond === "number") {
        if (delayMillisecond < 0 || delayMillisecond > 60000) {
          return res
            .status(400)
            .json({ error: "Delay must be between 0 and 60000 milliseconds" });
        }
        status.delayMillisecond = delayMillisecond;
      }

      // Write updated status
      await writeJson(statusPath, status, { spaces: 2 });
      console.log(`[status-manager] Updated ${statusPath} via /_mock/update`);

      return res.json({
        success: true,
        message: "Mock status updated successfully",
        status: {
          selected: status.selected,
          delayMillisecond: status.delayMillisecond,
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to update mock status", detail: String(error) });
    }
  });

  // API endpoint: get mock status via /_mock URL segment
  app.get("/_mock/status", async (req: Request, res: Response) => {
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

      const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
      const status = await readStatusJson(statusPath);

      return res.json({
        path: apiPath,
        method: method,
        currentMock: status?.selected || DEFAULT_MOCK_FILE,
        delayMillisecond: status?.delayMillisecond || 0,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to get mock status", detail: String(error) });
    }
  });

  // API endpoint: set delay for an endpoint
  const SetDelayRequestSchema = z.object({
    path: z.string(),
    method: z.string(),
    delayMillisecond: z.number().min(0).max(60000),
  });

  app.post("/_mock/set-delay", async (req: Request, res: Response) => {
    try {
      const {
        path: apiPath,
        method,
        delayMillisecond,
      } = SetDelayRequestSchema.parse(req.body);
      const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
      let status = await readStatusJson(statusPath);
      if (!status) status = { selected: DEFAULT_MOCK_FILE };
      await writeJson(
        statusPath,
        { ...status, delayMillisecond },
        { spaces: 2 }
      );
      console.log(
        `[status-manager] Set delay ${delayMillisecond}ms for ${statusPath}`
      );
      return res.json({
        success: true,
        message: `Delay set to ${delayMillisecond}ms`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid request data", details: error.errors });
      } else {
        return res
          .status(500)
          .json({ error: "Failed to set delay", detail: String(error) });
      }
    }
  });

  // ============================================================================
  // Scenario Management API Endpoints
  // Feature: 004-scenario-management
  // ============================================================================

  // Initialize scenario manager
  const scenarioDir = path.join(mockRoot, "scenario");
  const scenarioRepository = new ScenarioRepository(scenarioDir);
  const activeScenarioTracker = new ActiveScenarioTracker(scenarioDir);
  const scenarioApplicator = new ScenarioApplicator(mockRoot);
  const scenarioManager = new ScenarioManager(
    scenarioRepository,
    activeScenarioTracker,
    scenarioApplicator
  );

  // API endpoint: create a new scenario
  app.post("/_mock/scenarios", async (req: Request, res: Response) => {
    try {
      // Validate request with Zod
      const validationResult = CreateScenarioRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(formatScenarioValidationErrors(validationResult.error));
      }

      const createRequest = validationResult.data as CreateScenarioRequest;

      // Create scenario using scenario manager
      const scenario = await scenarioManager.create(createRequest);

      return res.status(HTTP_STATUS.CREATED).json({
        scenario,
        message: `Scenario '${scenario.name}' created successfully`,
      });
    } catch (error) {
      if (error instanceof DuplicateScenarioError) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: error.message,
        });
      } else if (error instanceof EmptyScenarioError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: error.message,
        });
      } else if (error instanceof DuplicateEndpointError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: error.message,
        });
      } else if (error instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(formatScenarioValidationErrors(error));
      } else {
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
          error: "Failed to create scenario",
          detail: String(error),
        });
      }
    }
  });

  // API endpoint: list all scenarios with active indicator
  app.get("/_mock/scenarios", async (req: Request, res: Response) => {
    try {
      const result = await scenarioManager.list();

      return res.json({
        scenarios: result.scenarios,
        activeScenario: result.activeScenario,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: "Failed to list scenarios",
        detail: String(error),
      });
    }
  });

  // API endpoint: get active scenario
  app.get("/_mock/scenarios/active", async (req: Request, res: Response) => {
    try {
      const activeScenario = await activeScenarioTracker.getActive();

      return res.json({
        activeScenario,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: "Failed to get active scenario",
        detail: String(error),
      });
    }
  });

  // API endpoint: apply scenario (update status.json files)
  app.put(
    "/_mock/scenarios/:name/activate",
    async (req: Request, res: Response) => {
      try {
        const { name } = req.params;

        if (!name) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Scenario name is required",
          });
        }

        // Verify scenario exists
        const scenarioExists = await scenarioRepository.exists(name);
        if (!scenarioExists) {
          return res.status(404).json({
            error: `Scenario "${name}" not found`,
          });
        }

        // Get the scenario and apply it (updates status.json files only)
        const scenario = await scenarioManager.get(name);
        const applicationResult = await scenarioApplicator.apply(scenario);

        // Set the scenario as active
        await activeScenarioTracker.setActive(name);

        return res.json({
          success: true,
          message: `Scenario "${name}" applied successfully. Status.json files updated.`,
          applicationResult,
        });
      } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
          error: "Failed to apply scenario",
          detail: String(error),
        });
      }
    }
  );

  // API endpoint: get scenario by name
  app.get("/_mock/scenarios/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Scenario name is required",
        });
      }

      const scenario = await scenarioManager.get(name);

      return res.json({
        scenario,
      });
    } catch (error) {
      if (error instanceof ScenarioNotFoundError) {
        return res.status(404).json({
          error: error.message,
        });
      } else {
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
          error: "Failed to get scenario",
          detail: String(error),
        });
      }
    }
  });

  // API endpoint: update an existing scenario
  app.put("/_mock/scenarios/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Scenario name is required",
        });
      }

      // Validate request with Zod
      const validationResult = UpdateScenarioRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(formatScenarioValidationErrors(validationResult.error));
      }

      const updateRequest = validationResult.data as UpdateScenarioRequest;

      // Update scenario using scenario manager
      const scenario = await scenarioManager.update(name, updateRequest);

      return res.json({
        scenario,
        message: `Scenario '${scenario.name}' updated successfully`,
      });
    } catch (error) {
      if (error instanceof ScenarioNotFoundError) {
        return res.status(404).json({
          error: error.message,
        });
      } else if (error instanceof EmptyScenarioError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: error.message,
        });
      } else if (error instanceof DuplicateEndpointError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: error.message,
        });
      } else if (error instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(formatScenarioValidationErrors(error));
      } else {
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
          error: "Failed to update scenario",
          detail: String(error),
        });
      }
    }
  });

  // API endpoint: delete a scenario
  app.delete("/_mock/scenarios/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Scenario name is required",
        });
      }

      // Delete scenario using scenario manager
      await scenarioManager.delete(name);

      return res.json({
        success: true,
        message: `Scenario '${name}' deleted successfully`,
      });
    } catch (error) {
      if (error instanceof ScenarioNotFoundError) {
        return res.status(404).json({
          error: error.message,
        });
      } else {
        return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
          error: "Failed to delete scenario",
          detail: String(error),
        });
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

      const templates = await getAllMockTemplates(mockRoot);
      const match = matchTemplate(requestParts, templates, method);

      let endpointDir: string;
      let apiPath: string;

      if (match) {
        endpointDir = path.join(mockRoot, ...match.template);
        apiPath = "/" + match.template.slice(0, -1).join("/");
      } else {
        // fallback: exact path
        endpointDir = path.join(mockRoot, ...requestParts, method);
        apiPath = "/" + requestParts.join("/");
      }

      // Read mock response file from status.json
      const statusPath = getStatusJsonPath(mockRoot, apiPath, method);
      const status = await readStatusJson(statusPath);

      let mockFile: string;
      if (status && status.selected) {
        mockFile = status.selected;
      } else {
        mockFile = DEFAULT_MOCK_FILE;
      }

      const filePath = path.join(endpointDir, mockFile);

      if (!(await mockFileExists(filePath))) {
        return res.status(404).json({
          error: "Mock file not found",
          file: filePath,
          availableFiles: await getAvailableMockFiles(endpointDir),
        });
      }

      const mock = await readMockResponse(filePath);

      // Set headers
      if (Array.isArray(mock.header)) {
        for (const h of mock.header) {
          if (h && h.key && h.value) {
            res.setHeader(h.key, h.value);
          }
        }
      }

      // Set status code
      const statusCode = extractStatusCode(mockFile);
      if (statusCode) {
        res.status(statusCode);
      }

      // Get delayMillisecond from status (already read above)
      let delayMillisecond = 0;
      if (status) {
        if (
          typeof status.delayMillisecond === "number" &&
          status.delayMillisecond > 0
        ) {
          delayMillisecond = status.delayMillisecond;
        }
        if (delayMillisecond > 0) {
          console.log(
            `[status-manager] ${apiPath} ${method} delay ${delayMillisecond}ms`
          );
        }
      }

      // Delay response
      if (delayMillisecond > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMillisecond));
      }

      return res.json(mock.body);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Mock server error", detail: String(error) });
    }
  });

  // 404 handling
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return app;
}

/**
 * Start the mock server
 * @param port - Port number to listen on
 * @param mockRoot - Root directory for mock files
 * @returns Promise that resolves when server starts
 */
export function startMockServer(
  port: number = 3001,
  mockRoot?: string
): Promise<void> {
  const resolvedMockRoot = mockRoot
    ? path.resolve(mockRoot)
    : DEFAULT_MOCK_ROOT;

  return new Promise((resolve, reject) => {
    try {
      const app = createApp(resolvedMockRoot);
      const server = app.listen(port, () => {
        console.log(`Mock server running at http://localhost:${port}`);
        console.log(
          `API endpoints available at http://localhost:${port}/_mock/endpoints`
        );
        console.log(`Mock root directory: ${resolvedMockRoot}`);
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
