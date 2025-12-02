/**
 * Integration Tests for Scenario Application
 *
 * Tests the full flow of applying scenarios to endpoint status files
 * using real file system operations.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/scenario-applicator.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  Scenario,
  HttpMethod,
  EndpointConfiguration
} from '../../src/shared/types/scenario-types';
import { ScenarioApplicator } from '../../src/domains/server-runtime/scenario-applicator';

describe('Scenario Application Integration', () => {
  let testDir: string;
  let applicator: ScenarioApplicator;

  const createTestScenario = (name: string): Scenario => ({
    name,
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
  });

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scenario-app-test-'));
    applicator = new ScenarioApplicator(testDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(testDir);
  });

  describe('full scenario application', () => {
    it('should apply scenario to all configured endpoints', async () => {
      // Setup endpoint directories
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));
      await fs.ensureDir(path.join(testDir, 'user', 'login', 'POST'));

      const scenario = createTestScenario('integration-test');
      const result = await applicator.apply(scenario);

      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(0);

      // Verify status files were created
      const status1 = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json')
      );
      expect(status1.selected).toBe('success-200.json');
      expect(status1.delayMillisecond).toBe(1000);

      const status2 = await fs.readJson(
        path.join(testDir, 'user', 'login', 'POST', 'status.json')
      );
      expect(status2.selected).toBe('auth-success.json');
      expect(status2.delayMillisecond).toBe(500);
    });

    it('should overwrite existing status files', async () => {
      // Create endpoint directories with existing status files
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));
      await fs.writeJson(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json'),
        { selected: 'old-response.json', delayMillisecond: 9999 }
      );

      const scenario: Scenario = {
        ...createTestScenario('overwrite-test'),
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'new-response.json',
            delayMillisecond: 2000
          }
        ]
      };

      await applicator.apply(scenario);

      const status = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json')
      );

      expect(status.selected).toBe('new-response.json');
      expect(status.delayMillisecond).toBe(2000);
    });
  });

  describe('realistic mock directory structure', () => {
    it('should handle actual mock server directory layout', async () => {
      // Create realistic directory structure
      await fs.ensureDir(path.join(testDir, 'pet', '{petId}', 'GET'));
      await fs.ensureDir(path.join(testDir, 'pet', '{petId}', 'POST'));
      await fs.ensureDir(path.join(testDir, 'pet', 'findByStatus', 'GET'));
      await fs.ensureDir(path.join(testDir, 'user', 'login', 'POST'));

      // Create existing mock response files (for reference)
      await fs.writeJson(
        path.join(testDir, 'pet', '{petId}', 'GET', 'success-200.json'),
        { id: 1, name: 'Fluffy' }
      );

      const scenario: Scenario = {
        name: 'realistic-test',
        endpointConfigurations: [
          {
            path: '/pet/{petId}',
            method: HttpMethod.GET,
            selectedMockFile: 'success-200.json',
            delayMillisecond: 100
          },
          {
            path: '/pet/findByStatus',
            method: HttpMethod.GET,
            selectedMockFile: 'available-pets.json',
            delayMillisecond: 200
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = await applicator.apply(scenario);

      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(0);

      // Verify status files
      const status1 = await fs.readJson(
        path.join(testDir, 'pet', '{petId}', 'GET', 'status.json')
      );
      expect(status1.selected).toBe('success-200.json');

      const status2 = await fs.readJson(
        path.join(testDir, 'pet', 'findByStatus', 'GET', 'status.json')
      );
      expect(status2.selected).toBe('available-pets.json');
    });

    it('should preserve existing mock response files', async () => {
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));
      await fs.writeJson(
        path.join(testDir, 'pet', 'status', 'GET', 'success-200.json'),
        { status: 'available' }
      );
      await fs.writeJson(
        path.join(testDir, 'pet', 'status', 'GET', 'error-500.json'),
        { error: 'Internal Server Error' }
      );

      const scenario: Scenario = {
        ...createTestScenario('preserve-test'),
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'error-500.json',
            delayMillisecond: 0
          }
        ]
      };

      await applicator.apply(scenario);

      // Verify mock files still exist
      const successFile = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'success-200.json')
      );
      expect(successFile.status).toBe('available');

      const errorFile = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'error-500.json')
      );
      expect(errorFile.error).toBe('Internal Server Error');

      // Verify status was updated
      const status = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json')
      );
      expect(status.selected).toBe('error-500.json');
    });
  });

  describe('error handling and partial success', () => {
    it('should report failures for missing endpoints', async () => {
      // Create only one of two required directories
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));

      const scenario = createTestScenario('partial-fail');
      const result = await applicator.apply(scenario);

      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
      expect(result.successes[0]).toBe('GET /pet/status');
      expect(result.failures[0].endpoint).toBe('POST /user/login');
      expect(result.failures[0].error).toContain('not found');
    });

    it('should successfully apply to available endpoints despite some failures', async () => {
      await fs.ensureDir(path.join(testDir, 'endpoint1', 'GET'));
      await fs.ensureDir(path.join(testDir, 'endpoint3', 'GET'));
      // endpoint2 missing

      const scenario: Scenario = {
        name: 'mixed-results',
        endpointConfigurations: [
          {
            path: '/endpoint1',
            method: HttpMethod.GET,
            selectedMockFile: 'r1.json',
            delayMillisecond: 100
          },
          {
            path: '/endpoint2',
            method: HttpMethod.GET,
            selectedMockFile: 'r2.json',
            delayMillisecond: 200
          },
          {
            path: '/endpoint3',
            method: HttpMethod.GET,
            selectedMockFile: 'r3.json',
            delayMillisecond: 300
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = await applicator.apply(scenario);

      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(1);

      // Verify successful applications
      const status1 = await fs.readJson(
        path.join(testDir, 'endpoint1', 'GET', 'status.json')
      );
      expect(status1.selected).toBe('r1.json');

      const status3 = await fs.readJson(
        path.join(testDir, 'endpoint3', 'GET', 'status.json')
      );
      expect(status3.selected).toBe('r3.json');
    });
  });

  describe('concurrent scenario applications', () => {
    it('should handle multiple scenarios applied to different endpoints', async () => {
      // Setup directories
      await fs.ensureDir(path.join(testDir, 'endpoint1', 'GET'));
      await fs.ensureDir(path.join(testDir, 'endpoint2', 'POST'));

      const scenario1: Scenario = {
        name: 'scenario-1',
        endpointConfigurations: [
          {
            path: '/endpoint1',
            method: HttpMethod.GET,
            selectedMockFile: 'response-a.json',
            delayMillisecond: 100
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const scenario2: Scenario = {
        name: 'scenario-2',
        endpointConfigurations: [
          {
            path: '/endpoint2',
            method: HttpMethod.POST,
            selectedMockFile: 'response-b.json',
            delayMillisecond: 200
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      await Promise.all([applicator.apply(scenario1), applicator.apply(scenario2)]);

      const status1 = await fs.readJson(
        path.join(testDir, 'endpoint1', 'GET', 'status.json')
      );
      expect(status1.selected).toBe('response-a.json');

      const status2 = await fs.readJson(
        path.join(testDir, 'endpoint2', 'POST', 'status.json')
      );
      expect(status2.selected).toBe('response-b.json');
    });

    it('should handle sequential scenario applications (last write wins)', async () => {
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));

      const createScenarioWithFile = (name: string, mockFile: string): Scenario => ({
        name,
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: mockFile,
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      });

      await applicator.apply(createScenarioWithFile('s1', 'response-1.json'));
      await applicator.apply(createScenarioWithFile('s2', 'response-2.json'));
      await applicator.apply(createScenarioWithFile('s3', 'response-3.json'));

      const status = await fs.readJson(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json')
      );

      expect(status.selected).toBe('response-3.json');
    });
  });

  describe('file formatting and integrity', () => {
    it('should write properly formatted JSON', async () => {
      await fs.ensureDir(path.join(testDir, 'pet', 'status', 'GET'));

      const scenario: Scenario = {
        ...createTestScenario('format-test'),
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'formatted.json',
            delayMillisecond: 1500
          }
        ]
      };

      await applicator.apply(scenario);

      const rawContent = await fs.readFile(
        path.join(testDir, 'pet', 'status', 'GET', 'status.json'),
        'utf-8'
      );

      // Check formatting
      expect(rawContent).toContain('\n');
      expect(rawContent).toContain('  ');
      expect(rawContent).toContain('"selected"');
      expect(rawContent).toContain('"delayMillisecond"');

      // Verify parseable
      const parsed = JSON.parse(rawContent);
      expect(parsed.selected).toBe('formatted.json');
      expect(parsed.delayMillisecond).toBe(1500);
    });
  });

  describe('all HTTP methods', () => {
    it('should apply configurations for all HTTP methods', async () => {
      const methods = [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.DELETE,
        HttpMethod.PATCH
      ];

      // Create directories for all methods
      for (const method of methods) {
        await fs.ensureDir(path.join(testDir, 'resource', method));
      }

      const configs: EndpointConfiguration[] = methods.map((method) => ({
        path: '/resource',
        method,
        selectedMockFile: `${method.toLowerCase()}.json`,
        delayMillisecond: 0
      }));

      const scenario: Scenario = {
        name: 'all-methods',
        endpointConfigurations: configs,
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = await applicator.apply(scenario);

      expect(result.successes).toHaveLength(5);
      expect(result.failures).toHaveLength(0);

      // Verify each method
      for (const method of methods) {
        const status = await fs.readJson(
          path.join(testDir, 'resource', method, 'status.json')
        );
        expect(status.selected).toBe(`${method.toLowerCase()}.json`);
      }
    });
  });

  describe('delay configurations', () => {
    it('should apply zero delay correctly', async () => {
      await fs.ensureDir(path.join(testDir, 'endpoint', 'GET'));

      const scenario: Scenario = {
        name: 'zero-delay',
        endpointConfigurations: [
          {
            path: '/endpoint',
            method: HttpMethod.GET,
            selectedMockFile: 'instant.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      await applicator.apply(scenario);

      const status = await fs.readJson(
        path.join(testDir, 'endpoint', 'GET', 'status.json')
      );

      expect(status.delayMillisecond).toBe(0);
    });

    it('should apply maximum delay correctly', async () => {
      await fs.ensureDir(path.join(testDir, 'endpoint', 'GET'));

      const scenario: Scenario = {
        name: 'max-delay',
        endpointConfigurations: [
          {
            path: '/endpoint',
            method: HttpMethod.GET,
            selectedMockFile: 'slow.json',
            delayMillisecond: 60000
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      await applicator.apply(scenario);

      const status = await fs.readJson(
        path.join(testDir, 'endpoint', 'GET', 'status.json')
      );

      expect(status.delayMillisecond).toBe(60000);
    });
  });
});
