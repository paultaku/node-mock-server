import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import * as path from "path";
import * as fs from "fs-extra";
import { createApp } from "../../src/domains/server-runtime/mock-server";

describe("POST /_mock/endpoints", () => {
  const testMockRoot = path.join(__dirname, "../fixtures/test-mock-integration");
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await fs.ensureDir(testMockRoot);
    // Create app with test mock root
    app = createApp(testMockRoot);
  });

  beforeEach(async () => {
    // Clean up before each test
    await fs.emptyDir(testMockRoot);
  });

  afterAll(async () => {
    await fs.remove(testMockRoot);
  });

  describe("Success Cases (201)", () => {
    it("should create a simple endpoint", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/users", method: "GET" })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        endpoint: {
          path: "/users",
          method: "GET",
          filesCreated: expect.arrayContaining([
            "success-200.json",
            "unexpected-error-default.json",
            "status.json",
          ]),
        },
      });

      // Verify files were created
      const endpointDir = path.join(testMockRoot, "users", "GET");
      expect(await fs.pathExists(endpointDir)).toBe(true);
    });

    it("should create endpoint with path parameters", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/pet/status/{id}", method: "POST" })
        .expect(201);

      expect(response.body.endpoint.path).toBe("/pet/status/{id}");

      // Verify folder structure preserves {id}
      const endpointDir = path.join(testMockRoot, "pet", "status", "{id}", "POST");
      expect(await fs.pathExists(endpointDir)).toBe(true);
    });
  });

  describe("Validation Errors (400)", () => {
    it("should reject missing path", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ method: "GET" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        details: expect.arrayContaining([
          expect.objectContaining({
            field: "path",
            message: "Required",
          }),
        ]),
      });
    });

    it("should reject invalid file system characters", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/api/data:export", method: "GET" })
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toBeDefined();
      expect(response.body.details[0].message).toContain("Path must start with / and can only contain");
    });

    it("should reject _mock prefix", async () => {
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/_mock/test", method: "GET" })
        .expect(400);

      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toBeDefined();
      expect(response.body.details[0].message).toContain("Path must start with / and can only contain");
    });
  });

  describe("Duplicate Endpoints (409)", () => {
    it("should reject duplicate path and method", async () => {
      // Create first endpoint
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/products", method: "GET" })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/products", method: "GET" })
        .expect(409);

      expect(response.body.error).toContain("already exists");
    });

    it("should allow same path with different method", async () => {
      // Create GET endpoint
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/items", method: "GET" })
        .expect(201);

      // Create POST endpoint (should succeed)
      await request(app)
        .post("/_mock/endpoints")
        .send({ path: "/items", method: "POST" })
        .expect(201);
    });
  });
});
