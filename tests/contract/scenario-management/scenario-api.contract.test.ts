/**
 * Contract Tests for Scenario Management API
 *
 * Tests API endpoints against OpenAPI specification.
 * Following contract-first development approach.
 *
 * @see specs/004-scenario-management/contracts/scenario-api.yaml
 * @see src/domains/server-runtime/mock-server.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import { Application } from "express";
import { vol } from "memfs";
import * as path from "path";
import { createApp } from "../../../src/domains/server-runtime/mock-server";
import { HttpMethod } from "../../../src/shared/types/scenario-types";

// Mock fs-extra to use memfs for testing
jest.mock("fs-extra");

describe("Scenario API Contract Tests", () => {
  let app: Application;
  const mockRoot = "/mock";
  const mockScenarioDir = path.join(mockRoot, "scenario");

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(mockScenarioDir, { recursive: true });
    vol.mkdirSync(path.join(mockRoot, "pet", "status", "GET"), {
      recursive: true,
    });
    app = createApp(mockRoot);
  });

  afterEach(() => {
    vol.reset();
  });

  describe("POST /_mock/scenarios", () => {
    it("should create a new scenario and return 201 Created", async () => {
      const createRequest = {
        name: "testing-scenario",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 1000,
          },
        ],
      };

      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("scenario");
      expect(response.body.scenario).toHaveProperty("name", "testing-scenario");
      expect(response.body.scenario).toHaveProperty("endpointConfigurations");
      expect(response.body.scenario).toHaveProperty("metadata");
      expect(response.body.scenario.metadata).toHaveProperty("createdAt");
      expect(response.body.scenario.metadata).toHaveProperty("lastModified");
      expect(response.body.scenario.metadata).toHaveProperty("version", 1);
      expect(response.body.scenario.endpointConfigurations).toHaveLength(1);
    });

    it("should return 400 Bad Request for invalid scenario name", async () => {
      const createRequest = {
        name: "", // Invalid: empty name
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("name");
    });

    it("should return 400 Bad Request for empty endpoint configurations", async () => {
      const createRequest = {
        name: "empty-scenario",
        endpointConfigurations: [],
      };

      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("at least one endpoint");
    });

    it("should return 400 Bad Request for duplicate endpoints in request", async () => {
      const createRequest = {
        name: "duplicate-endpoints",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "file1.json",
            delayMillisecond: 0,
          },
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "file2.json",
            delayMillisecond: 0,
          },
        ],
      };

      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error.toLowerCase()).toContain("duplicate");
    });

    it("should return 409 Conflict when scenario name already exists", async () => {
      const createRequest = {
        name: "duplicate-name",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      // Create first scenario
      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("already exists");
    });

    it("should validate delay is within 0-60000ms range", async () => {
      const createRequest = {
        name: "invalid-delay",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 70000, // Exceeds max
          },
        ],
      };

      const response = await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error.toLowerCase()).toContain("delay");
    });
  });

  describe("GET /_mock/scenarios", () => {
    it("should return list of all scenarios with active indicator", async () => {
      // Create multiple scenarios
      const scenario1 = {
        name: "scenario-1",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      const scenario2 = {
        name: "scenario-2",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "error-404.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app).post("/_mock/scenarios").send(scenario1).expect(201);
      await request(app).post("/_mock/scenarios").send(scenario2).expect(201);

      const response = await request(app)
        .get("/_mock/scenarios")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("scenarios");
      expect(response.body).toHaveProperty("activeScenario");
      expect(response.body.scenarios).toHaveLength(2);
      expect(response.body.activeScenario).toBe("scenario-2"); // Last created is active
    });

    it("should return empty array when no scenarios exist", async () => {
      const response = await request(app)
        .get("/_mock/scenarios")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.scenarios).toEqual([]);
      expect(response.body.activeScenario).toBeNull();
    });
  });

  describe("GET /_mock/scenarios/:name", () => {
    it("should return scenario by name", async () => {
      const createRequest = {
        name: "get-test",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 500,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      const response = await request(app)
        .get("/_mock/scenarios/get-test")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("scenario");
      expect(response.body.scenario.name).toBe("get-test");
      expect(response.body.scenario.endpointConfigurations).toHaveLength(1);
    });

    it("should return 404 Not Found for non-existent scenario", async () => {
      const response = await request(app)
        .get("/_mock/scenarios/non-existent")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not found");
    });
  });

  describe("GET /_mock/scenarios/active", () => {
    it("should return active scenario name", async () => {
      const createRequest = {
        name: "active-test",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      const response = await request(app)
        .get("/_mock/scenarios/active")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("activeScenario", "active-test");
    });

    it("should return null when no active scenario", async () => {
      const response = await request(app)
        .get("/_mock/scenarios/active")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("activeScenario", null);
    });
  });

  describe("PUT /_mock/scenarios/:name", () => {
    it("should update existing scenario and return 200 OK", async () => {
      const createRequest = {
        name: "update-test",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      const updateRequest = {
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "error-500.json",
            delayMillisecond: 2000,
          },
        ],
      };

      const response = await request(app)
        .put("/_mock/scenarios/update-test")
        .send(updateRequest)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("scenario");
      expect(response.body.scenario.name).toBe("update-test");
      expect(response.body.scenario.metadata.version).toBe(2);
      expect(
        response.body.scenario.endpointConfigurations[0].selectedMockFile
      ).toBe("error-500.json");
    });

    it("should return 404 Not Found for non-existent scenario", async () => {
      const updateRequest = {
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "file.json",
            delayMillisecond: 0,
          },
        ],
      };

      const response = await request(app)
        .put("/_mock/scenarios/non-existent")
        .send(updateRequest)
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 Bad Request when removing all endpoints", async () => {
      const createRequest = {
        name: "empty-update",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      const updateRequest = {
        endpointConfigurations: [],
      };

      const response = await request(app)
        .put("/_mock/scenarios/empty-update")
        .send(updateRequest)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("at least one endpoint");
    });

    it("should allow removing endpoint configurations (reducing from multiple to fewer)", async () => {
      const createRequest = {
        name: "reduce-test",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
          {
            path: "/pet/findByTag",
            method: "GET",
            selectedMockFile: "error-404.json",
            delayMillisecond: 0,
          },
          {
            path: "/user/login",
            method: "POST",
            selectedMockFile: "success-200.json",
            delayMillisecond: 1000,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      // Update with reduced configurations (remove one endpoint)
      const updateRequest = {
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
          {
            path: "/user/login",
            method: "POST",
            selectedMockFile: "success-200.json",
            delayMillisecond: 1000,
          },
        ],
      };

      const response = await request(app)
        .put("/_mock/scenarios/reduce-test")
        .send(updateRequest)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("scenario");
      expect(response.body.scenario.name).toBe("reduce-test");
      expect(response.body.scenario.endpointConfigurations).toHaveLength(2);
      expect(response.body.scenario.metadata.version).toBe(2);

      // Verify the remaining endpoints
      const paths = response.body.scenario.endpointConfigurations.map(
        (c: any) => c.path
      );
      expect(paths).toContain("/pet/status");
      expect(paths).toContain("/user/login");
      expect(paths).not.toContain("/pet/findByTag");
    });
  });

  describe("DELETE /_mock/scenarios/:name", () => {
    it("should delete scenario and return 200 OK", async () => {
      const createRequest = {
        name: "delete-test",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      const response = await request(app)
        .delete("/_mock/scenarios/delete-test")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");

      // Verify scenario no longer exists
      await request(app).get("/_mock/scenarios/delete-test").expect(404);
    });

    it("should return 404 Not Found for non-existent scenario", async () => {
      const response = await request(app)
        .delete("/_mock/scenarios/non-existent")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should clear active scenario if deleted scenario was active", async () => {
      const createRequest = {
        name: "active-delete",
        endpointConfigurations: [
          {
            path: "/pet/status",
            method: "GET",
            selectedMockFile: "success-200.json",
            delayMillisecond: 0,
          },
        ],
      };

      await request(app)
        .post("/_mock/scenarios")
        .send(createRequest)
        .expect(201);

      // Verify it's active
      let response = await request(app)
        .get("/_mock/scenarios/active")
        .expect(200);
      expect(response.body.activeScenario).toBe("active-delete");

      // Delete the scenario
      await request(app).delete("/_mock/scenarios/active-delete").expect(200);

      // Verify active scenario is cleared
      response = await request(app).get("/_mock/scenarios/active").expect(200);
      expect(response.body.activeScenario).toBeNull();
    });
  });

  describe("GET /_mock/endpoints", () => {
    it("should return list of all available endpoints", async () => {
      // Create a mock file for the existing endpoint
      vol.writeFileSync(
        "/mock/pet/status/GET/success-200.json",
        JSON.stringify({ status: "ok" })
      );

      const response = await request(app)
        .get("/_mock/endpoints")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      const endpoint = response.body[0];
      expect(endpoint).toHaveProperty("path");
      expect(endpoint).toHaveProperty("method");
      expect(endpoint).toHaveProperty("currentMock");
      expect(endpoint).toHaveProperty("availableMocks");
      expect(endpoint.availableMocks).toBeInstanceOf(Array);
    });

    it("should include available mock files for endpoint", async () => {
      // Add mock files to the existing pet/status endpoint
      vol.writeFileSync(
        "/mock/pet/status/GET/error-404.json",
        '{"error": "Not found"}'
      );
      vol.writeFileSync(
        "/mock/pet/status/GET/error-500.json",
        '{"error": "Internal error"}'
      );

      const response = await request(app).get("/_mock/endpoints").expect(200);

      const endpoint = response.body.find((e: any) => e.path === "/pet/status");
      expect(endpoint).toBeDefined();
      if (endpoint) {
        expect(endpoint.availableMocks).toBeInstanceOf(Array);
        expect(endpoint.availableMocks.length).toBeGreaterThanOrEqual(2);
        // Should not include status.json in available mocks
        expect(endpoint.availableMocks).not.toContain("status.json");
      }
    });
  });
});
