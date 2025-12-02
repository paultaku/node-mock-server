/**
 * Unit Tests for ScenarioApplicator
 *
 * Tests the scenario application logic that updates endpoint status.json files.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/scenario-applicator.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { vol } from 'memfs';
import * as path from 'path';
import {
  Scenario,
  HttpMethod,
  EndpointConfiguration
} from '../../src/shared/types/scenario-types';
import { ScenarioApplicator } from '../../src/domains/server-runtime/scenario-applicator';

// Mock fs-extra to use memfs for testing
jest.mock('fs-extra');

describe('ScenarioApplicator', () => {
  let applicator: ScenarioApplicator;
  const mockRoot = '/mock';

  // Test fixture - sample scenario
  const testScenario: Scenario = {
    name: 'test-scenario',
    endpointConfigurations: [
      {
        path: '/pet/status',
        method: HttpMethod.GET,
        selectedMockFile: 'success-200.json',
        delayMillisecond: 1000
      },
      {
        path: '/user/login',
        method: HttpMethod.POST,
        selectedMockFile: 'auth-success.json',
        delayMillisecond: 500
      }
    ],
    metadata: {
      createdAt: '2025-11-30T10:00:00.000Z',
      lastModified: '2025-11-30T10:00:00.000Z',
      version: 1
    }
  };

  beforeEach(() => {
    vol.reset();
    // Create mock directory structure
    vol.mkdirSync(mockRoot, { recursive: true });
    applicator = new ScenarioApplicator(mockRoot);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('apply()', () => {
    it('should update status.json for all endpoint configurations', async () => {
      // Setup endpoint directories
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });
      vol.mkdirSync(path.join(mockRoot, 'user', 'login', 'POST'), {
        recursive: true
      });

      // Create initial status files
      vol.writeFileSync(
        path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
        JSON.stringify({ selected: 'old.json', delayMillisecond: 0 })
      );
      vol.writeFileSync(
        path.join(mockRoot, 'user', 'login', 'POST', 'status.json'),
        JSON.stringify({ selected: 'old.json', delayMillisecond: 0 })
      );

      const result = await applicator.apply(testScenario);

      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(0);

      // Verify first endpoint
      const status1 = JSON.parse(
        vol.readFileSync(
          path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
          'utf-8'
        ) as string
      );
      expect(status1.selected).toBe('success-200.json');
      expect(status1.delayMillisecond).toBe(1000);

      // Verify second endpoint
      const status2 = JSON.parse(
        vol.readFileSync(
          path.join(mockRoot, 'user', 'login', 'POST', 'status.json'),
          'utf-8'
        ) as string
      );
      expect(status2.selected).toBe('auth-success.json');
      expect(status2.delayMillisecond).toBe(500);
    });

    it('should handle endpoint directories that do not exist', async () => {
      const result = await applicator.apply(testScenario);

      expect(result.successes).toHaveLength(0);
      expect(result.failures).toHaveLength(2);
      expect(result.failures[0].endpoint).toContain('/pet/status');
      expect(result.failures[0].error).toContain('not found');
      expect(result.failures[1].endpoint).toContain('/user/login');
    });

    it('should create status.json if it does not exist in endpoint directory', async () => {
      // Create endpoint directory without status.json
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const singleEndpointScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [testScenario.endpointConfigurations[0]]
      };

      const result = await applicator.apply(singleEndpointScenario);

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(0);

      const statusPath = path.join(mockRoot, 'pet', 'status', 'GET', 'status.json');
      expect(vol.existsSync(statusPath)).toBe(true);

      const status = JSON.parse(vol.readFileSync(statusPath, 'utf-8') as string);
      expect(status.selected).toBe('success-200.json');
      expect(status.delayMillisecond).toBe(1000);
    });

    it('should return partial success when some endpoints fail', async () => {
      // Create only first endpoint directory
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const result = await applicator.apply(testScenario);

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
      expect(result.successes[0]).toContain('GET /pet/status');
      expect(result.failures[0].endpoint).toContain('POST /user/login');
    });

    it('should format status.json with 2-space indentation', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const singleEndpointScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [testScenario.endpointConfigurations[0]]
      };

      await applicator.apply(singleEndpointScenario);

      const content = vol.readFileSync(
        path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
        'utf-8'
      ) as string;

      expect(content).toContain('\n');
      expect(content).toContain('  ');
      expect(content).toContain('"selected"');
      expect(content).toContain('"delayMillisecond"');
    });

    it('should handle zero delay correctly', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const zeroDelayScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'instant.json',
            delayMillisecond: 0
          }
        ]
      };

      await applicator.apply(zeroDelayScenario);

      const status = JSON.parse(
        vol.readFileSync(
          path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
          'utf-8'
        ) as string
      );

      expect(status.delayMillisecond).toBe(0);
    });

    it('should handle maximum delay correctly', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const maxDelayScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'slow.json',
            delayMillisecond: 60000
          }
        ]
      };

      await applicator.apply(maxDelayScenario);

      const status = JSON.parse(
        vol.readFileSync(
          path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
          'utf-8'
        ) as string
      );

      expect(status.delayMillisecond).toBe(60000);
    });
  });

  describe('applyEndpoint()', () => {
    it('should update single endpoint configuration', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const config: EndpointConfiguration = {
        path: '/pet/status',
        method: HttpMethod.GET,
        selectedMockFile: 'new-response.json',
        delayMillisecond: 2000
      };

      await applicator.applyEndpoint(config);

      const status = JSON.parse(
        vol.readFileSync(
          path.join(mockRoot, 'pet', 'status', 'GET', 'status.json'),
          'utf-8'
        ) as string
      );

      expect(status.selected).toBe('new-response.json');
      expect(status.delayMillisecond).toBe(2000);
    });

    it('should throw error when endpoint directory does not exist', async () => {
      const config: EndpointConfiguration = {
        path: '/nonexistent/endpoint',
        method: HttpMethod.GET,
        selectedMockFile: 'response.json',
        delayMillisecond: 0
      };

      await expect(applicator.applyEndpoint(config)).rejects.toThrow();
    });
  });

  describe('path resolution', () => {
    it('should handle paths with leading slash', async () => {
      vol.mkdirSync(path.join(mockRoot, 'api', 'users', 'GET'), {
        recursive: true
      });

      const config: EndpointConfiguration = {
        path: '/api/users',
        method: HttpMethod.GET,
        selectedMockFile: 'users-list.json',
        delayMillisecond: 100
      };

      await applicator.applyEndpoint(config);

      const statusPath = path.join(mockRoot, 'api', 'users', 'GET', 'status.json');
      expect(vol.existsSync(statusPath)).toBe(true);
    });

    it('should handle paths with path parameters', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', '{petId}', 'GET'), {
        recursive: true
      });

      const config: EndpointConfiguration = {
        path: '/pet/{petId}',
        method: HttpMethod.GET,
        selectedMockFile: 'pet-details.json',
        delayMillisecond: 200
      };

      await applicator.applyEndpoint(config);

      const statusPath = path.join(mockRoot, 'pet', '{petId}', 'GET', 'status.json');
      expect(vol.existsSync(statusPath)).toBe(true);
    });

    it('should handle nested paths', async () => {
      vol.mkdirSync(path.join(mockRoot, 'api', 'v1', 'users', 'profile', 'GET'), {
        recursive: true
      });

      const config: EndpointConfiguration = {
        path: '/api/v1/users/profile',
        method: HttpMethod.GET,
        selectedMockFile: 'profile.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      const statusPath = path.join(
        mockRoot,
        'api',
        'v1',
        'users',
        'profile',
        'GET',
        'status.json'
      );
      expect(vol.existsSync(statusPath)).toBe(true);
    });
  });

  describe('HTTP methods', () => {
    it('should handle GET method', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'GET'), { recursive: true });

      const config: EndpointConfiguration = {
        path: '/resource',
        method: HttpMethod.GET,
        selectedMockFile: 'get.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      expect(
        vol.existsSync(path.join(mockRoot, 'resource', 'GET', 'status.json'))
      ).toBe(true);
    });

    it('should handle POST method', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'POST'), { recursive: true });

      const config: EndpointConfiguration = {
        path: '/resource',
        method: HttpMethod.POST,
        selectedMockFile: 'post.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      expect(
        vol.existsSync(path.join(mockRoot, 'resource', 'POST', 'status.json'))
      ).toBe(true);
    });

    it('should handle PUT method', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'PUT'), { recursive: true });

      const config: EndpointConfiguration = {
        path: '/resource',
        method: HttpMethod.PUT,
        selectedMockFile: 'put.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      expect(
        vol.existsSync(path.join(mockRoot, 'resource', 'PUT', 'status.json'))
      ).toBe(true);
    });

    it('should handle DELETE method', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'DELETE'), { recursive: true });

      const config: EndpointConfiguration = {
        path: '/resource',
        method: HttpMethod.DELETE,
        selectedMockFile: 'delete.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      expect(
        vol.existsSync(path.join(mockRoot, 'resource', 'DELETE', 'status.json'))
      ).toBe(true);
    });

    it('should handle PATCH method', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'PATCH'), { recursive: true });

      const config: EndpointConfiguration = {
        path: '/resource',
        method: HttpMethod.PATCH,
        selectedMockFile: 'patch.json',
        delayMillisecond: 0
      };

      await applicator.applyEndpoint(config);

      expect(
        vol.existsSync(path.join(mockRoot, 'resource', 'PATCH', 'status.json'))
      ).toBe(true);
    });
  });

  describe('error scenarios', () => {
    it('should collect all failures when no endpoints exist', async () => {
      const multiEndpointScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [
          {
            path: '/endpoint1',
            method: HttpMethod.GET,
            selectedMockFile: 'r1.json',
            delayMillisecond: 0
          },
          {
            path: '/endpoint2',
            method: HttpMethod.POST,
            selectedMockFile: 'r2.json',
            delayMillisecond: 0
          },
          {
            path: '/endpoint3',
            method: HttpMethod.PUT,
            selectedMockFile: 'r3.json',
            delayMillisecond: 0
          }
        ]
      };

      const result = await applicator.apply(multiEndpointScenario);

      expect(result.successes).toHaveLength(0);
      expect(result.failures).toHaveLength(3);
    });

    it('should provide descriptive error messages', async () => {
      const config: EndpointConfiguration = {
        path: '/missing/endpoint',
        method: HttpMethod.GET,
        selectedMockFile: 'response.json',
        delayMillisecond: 0
      };

      const scenario: Scenario = {
        ...testScenario,
        endpointConfigurations: [config]
      };

      const result = await applicator.apply(scenario);

      expect(result.failures[0].endpoint).toBe('GET /missing/endpoint');
      expect(result.failures[0].error).toBeTruthy();
      expect(result.failures[0].error.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty scenario (no endpoints)', async () => {
      const emptyScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: []
      };

      const result = await applicator.apply(emptyScenario);

      expect(result.successes).toHaveLength(0);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle scenario with single endpoint', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), {
        recursive: true
      });

      const singleEndpoint: Scenario = {
        ...testScenario,
        endpointConfigurations: [testScenario.endpointConfigurations[0]]
      };

      const result = await applicator.apply(singleEndpoint);

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle scenario with many endpoints', async () => {
      const manyConfigs: EndpointConfiguration[] = Array.from(
        { length: 10 },
        (_, i) => ({
          path: `/endpoint-${i}`,
          method: HttpMethod.GET,
          selectedMockFile: `response-${i}.json`,
          delayMillisecond: i * 100
        })
      );

      // Create directories for all endpoints
      for (let i = 0; i < 10; i++) {
        vol.mkdirSync(path.join(mockRoot, `endpoint-${i}`, 'GET'), {
          recursive: true
        });
      }

      const manyEndpointScenario: Scenario = {
        ...testScenario,
        endpointConfigurations: manyConfigs
      };

      const result = await applicator.apply(manyEndpointScenario);

      expect(result.successes).toHaveLength(10);
      expect(result.failures).toHaveLength(0);
    });
  });
});
