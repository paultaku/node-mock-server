import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as path from "path";
import * as fs from "fs-extra";
import { generateEndpointFiles } from "../../src/domains/server-runtime/endpoint-file-generator";

describe("EndpointFileGenerator", () => {
  const testMockRoot = path.join(__dirname, "../fixtures/test-mock");

  beforeEach(async () => {
    await fs.ensureDir(testMockRoot);
  });

  afterEach(async () => {
    await fs.remove(testMockRoot);
  });

  describe("Directory Structure", () => {
    it("should create correct folder structure for simple path", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const expectedDir = path.join(testMockRoot, "users", "GET");
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });

    it("should create nested folders for complex paths", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/pet/status/{id}",
        method: "POST",
      });

      const expectedDir = path.join(testMockRoot, "pet", "status", "{id}", "POST");
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });

    it("should preserve path parameters in folder names", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/api/users/{userId}/posts/{postId}",
        method: "DELETE",
      });

      const expectedDir = path.join(
        testMockRoot,
        "api",
        "users",
        "{userId}",
        "posts",
        "{postId}",
        "DELETE"
      );
      expect(await fs.pathExists(expectedDir)).toBe(true);
    });
  });

  describe("JSON Template Generation", () => {
    it("should create success-200.json with correct structure", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const successFile = path.join(testMockRoot, "users", "GET", "success-200.json");
      const content = await fs.readJson(successFile);

      expect(content).toEqual({
        header: [],
        body: {
          status: "success",
          message: "Mock response",
        },
      });
    });

    it("should create unexpected-error-default.json", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const errorFile = path.join(
        testMockRoot,
        "users",
        "GET",
        "unexpected-error-default.json"
      );
      const content = await fs.readJson(errorFile);

      expect(content).toEqual({
        header: [],
        body: {
          status: "error",
          message: "Unexpected error",
        },
      });
    });

    it("should create status.json with default configuration", async () => {
      await generateEndpointFiles({
        mockRoot: testMockRoot,
        path: "/users",
        method: "GET",
      });

      const statusFile = path.join(testMockRoot, "users", "GET", "status.json");
      const content = await fs.readJson(statusFile);

      expect(content).toEqual({
        selected: "success-200.json",
        delayMillisecond: 0,
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error if mockRoot doesn't exist and can't be created", async () => {
      await expect(
        generateEndpointFiles({
          mockRoot: "/invalid/path/that/cannot/be/created",
          path: "/users",
          method: "GET",
        })
      ).rejects.toThrow();
    });
  });
});
