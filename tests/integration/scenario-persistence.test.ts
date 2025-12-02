/**
 * Integration Tests for Scenario Persistence
 *
 * Tests the full persistence flow with real file system operations.
 * Uses a temporary test directory for isolation.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/scenario-repository.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  Scenario,
  HttpMethod,
  DuplicateScenarioError,
  ScenarioNotFoundError
} from '../../src/shared/types/scenario-types';
import { ScenarioRepository } from '../../src/domains/server-runtime/scenario-repository';

describe('Scenario Persistence Integration', () => {
  let testDir: string;
  let repository: ScenarioRepository;

  // Test fixtures
  const createTestScenario = (name: string): Scenario => ({
    name,
    endpointConfigurations: [
      {
        path: '/pet/status',
        method: HttpMethod.GET,
        selectedMockFile: 'success-200.json',
        delayMillisecond: 1000
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
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scenario-test-'));
    repository = new ScenarioRepository(testDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(testDir);
  });

  describe('full CRUD lifecycle', () => {
    it('should create, read, update, and delete a scenario', async () => {
      const scenarioName = 'lifecycle-test';
      const scenario = createTestScenario(scenarioName);

      // CREATE
      await repository.save(scenario);
      expect(await repository.exists(scenarioName)).toBe(true);

      // READ
      const retrieved = await repository.findByName(scenarioName);
      expect(retrieved).toEqual(scenario);

      // UPDATE
      const updated: Scenario = {
        ...scenario,
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'error-500.json',
            delayMillisecond: 2000
          }
        ],
        metadata: {
          ...scenario.metadata,
          lastModified: '2025-11-30T11:00:00.000Z',
          version: 2
        }
      };

      await repository.update(updated);
      const afterUpdate = await repository.findByName(scenarioName);
      expect(afterUpdate).toEqual(updated);
      expect(afterUpdate?.metadata.version).toBe(2);

      // DELETE
      await repository.delete(scenarioName);
      expect(await repository.exists(scenarioName)).toBe(false);
      const afterDelete = await repository.findByName(scenarioName);
      expect(afterDelete).toBeNull();
    });
  });

  describe('concurrent operations', () => {
    it('should handle saving multiple scenarios in parallel', async () => {
      const scenarios = [
        createTestScenario('scenario-1'),
        createTestScenario('scenario-2'),
        createTestScenario('scenario-3')
      ];

      await Promise.all(scenarios.map((s) => repository.save(s)));

      const all = await repository.findAll();
      expect(all).toHaveLength(3);
      expect(all.map((s) => s.name).sort()).toEqual([
        'scenario-1',
        'scenario-2',
        'scenario-3'
      ]);
    });

    it('should handle reading multiple scenarios in parallel', async () => {
      const scenarios = [
        createTestScenario('read-1'),
        createTestScenario('read-2'),
        createTestScenario('read-3')
      ];

      for (const s of scenarios) {
        await repository.save(s);
      }

      const results = await Promise.all([
        repository.findByName('read-1'),
        repository.findByName('read-2'),
        repository.findByName('read-3')
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toEqual(scenarios[index]);
      });
    });
  });

  describe('file system integrity', () => {
    it('should create scenario directory if it does not exist', async () => {
      const newDir = path.join(testDir, 'new', 'nested', 'path');
      const newRepo = new ScenarioRepository(newDir);

      expect(await fs.pathExists(newDir)).toBe(false);

      await newRepo.save(createTestScenario('test'));

      expect(await fs.pathExists(newDir)).toBe(true);
      expect(await fs.pathExists(path.join(newDir, 'test.json'))).toBe(true);
    });

    it('should write valid JSON that can be manually read', async () => {
      const scenario = createTestScenario('manual-read');
      await repository.save(scenario);

      const filePath = path.join(testDir, 'manual-read.json');
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(rawContent);

      expect(parsed).toEqual(scenario);
    });

    it('should preserve JSON formatting with proper indentation', async () => {
      const scenario = createTestScenario('formatted');
      await repository.save(scenario);

      const filePath = path.join(testDir, 'formatted.json');
      const content = await fs.readFile(filePath, 'utf-8');

      // Check for 2-space indentation
      expect(content).toContain('\n  "name"');
      expect(content).toContain('\n  "endpointConfigurations"');
      expect(content).toContain('\n  "metadata"');
    });

    it('should only affect target scenario file on update', async () => {
      const scenario1 = createTestScenario('scenario-1');
      const scenario2 = createTestScenario('scenario-2');

      await repository.save(scenario1);
      await repository.save(scenario2);

      const updated1: Scenario = {
        ...scenario1,
        metadata: { ...scenario1.metadata, version: 2 }
      };

      await repository.update(updated1);

      const retrieved1 = await repository.findByName('scenario-1');
      const retrieved2 = await repository.findByName('scenario-2');

      expect(retrieved1?.metadata.version).toBe(2);
      expect(retrieved2?.metadata.version).toBe(1);
    });

    it('should only delete target scenario file', async () => {
      await repository.save(createTestScenario('keep-1'));
      await repository.save(createTestScenario('delete-me'));
      await repository.save(createTestScenario('keep-2'));

      await repository.delete('delete-me');

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(2);
      expect(remaining.map((s) => s.name).sort()).toEqual(['keep-1', 'keep-2']);
    });
  });

  describe('error handling', () => {
    it('should throw DuplicateScenarioError on duplicate save', async () => {
      const scenario = createTestScenario('duplicate');
      await repository.save(scenario);

      await expect(repository.save(scenario)).rejects.toThrow(
        DuplicateScenarioError
      );
    });

    it('should throw ScenarioNotFoundError on update of non-existent scenario', async () => {
      const scenario = createTestScenario('non-existent');

      await expect(repository.update(scenario)).rejects.toThrow(
        ScenarioNotFoundError
      );
    });

    it('should throw ScenarioNotFoundError on delete of non-existent scenario', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow(
        ScenarioNotFoundError
      );
    });

    it('should handle corrupted JSON files gracefully on findByName', async () => {
      const filePath = path.join(testDir, 'corrupted.json');
      await fs.writeFile(filePath, 'not valid json {]');

      await expect(repository.findByName('corrupted')).rejects.toThrow();
    });

    it('should skip corrupted files in findAll', async () => {
      await repository.save(createTestScenario('valid-1'));
      await fs.writeFile(path.join(testDir, 'corrupted.json'), 'invalid json');
      await repository.save(createTestScenario('valid-2'));

      // findAll should fail when it encounters corrupted file
      await expect(repository.findAll()).rejects.toThrow();
    });
  });

  describe('directory filtering', () => {
    it('should ignore _active.json file in findAll', async () => {
      await repository.save(createTestScenario('scenario-1'));
      await fs.writeJson(path.join(testDir, '_active.json'), {
        activeScenario: 'scenario-1',
        lastUpdated: '2025-11-30T10:00:00.000Z'
      });

      const all = await repository.findAll();

      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('scenario-1');
    });

    it('should ignore README.md and other non-JSON files', async () => {
      await repository.save(createTestScenario('scenario-1'));
      await fs.writeFile(path.join(testDir, 'README.md'), '# Documentation');
      await fs.writeFile(path.join(testDir, 'notes.txt'), 'Some notes');

      const all = await repository.findAll();

      expect(all).toHaveLength(1);
    });

    it('should ignore subdirectories', async () => {
      await repository.save(createTestScenario('scenario-1'));
      await fs.ensureDir(path.join(testDir, 'subdirectory'));
      await fs.writeJson(path.join(testDir, 'subdirectory', 'nested.json'), {
        name: 'nested'
      });

      const all = await repository.findAll();

      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('scenario-1');
    });
  });

  describe('special scenario names', () => {
    it('should handle scenario names with multiple hyphens', async () => {
      const scenario = createTestScenario('test-scenario-with-many-hyphens');
      await repository.save(scenario);

      const retrieved = await repository.findByName(
        'test-scenario-with-many-hyphens'
      );
      expect(retrieved?.name).toBe('test-scenario-with-many-hyphens');
    });

    it('should handle maximum length scenario names (50 chars)', async () => {
      const longName = 'a'.repeat(50);
      const scenario = createTestScenario(longName);
      await repository.save(scenario);

      const retrieved = await repository.findByName(longName);
      expect(retrieved?.name).toBe(longName);
    });

    it('should handle scenario names starting with numbers', async () => {
      const scenario = createTestScenario('123-test-scenario');
      await repository.save(scenario);

      const retrieved = await repository.findByName('123-test-scenario');
      expect(retrieved?.name).toBe('123-test-scenario');
    });
  });

  describe('complex scenarios', () => {
    it('should persist scenarios with multiple endpoints', async () => {
      const complexScenario: Scenario = {
        name: 'complex',
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
          },
          {
            path: '/pet/findByTag/{tag}',
            method: HttpMethod.GET,
            selectedMockFile: 'tagged-pets.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      await repository.save(complexScenario);
      const retrieved = await repository.findByName('complex');

      expect(retrieved?.endpointConfigurations).toHaveLength(3);
      expect(retrieved).toEqual(complexScenario);
    });

    it('should preserve all HTTP methods correctly', async () => {
      const allMethods: Scenario = {
        name: 'all-methods',
        endpointConfigurations: [
          {
            path: '/resource',
            method: HttpMethod.GET,
            selectedMockFile: 'get.json',
            delayMillisecond: 0
          },
          {
            path: '/resource',
            method: HttpMethod.POST,
            selectedMockFile: 'post.json',
            delayMillisecond: 0
          },
          {
            path: '/resource',
            method: HttpMethod.PUT,
            selectedMockFile: 'put.json',
            delayMillisecond: 0
          },
          {
            path: '/resource',
            method: HttpMethod.DELETE,
            selectedMockFile: 'delete.json',
            delayMillisecond: 0
          },
          {
            path: '/resource',
            method: HttpMethod.PATCH,
            selectedMockFile: 'patch.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      await repository.save(allMethods);
      const retrieved = await repository.findByName('all-methods');

      expect(retrieved?.endpointConfigurations).toHaveLength(5);
      const methods = retrieved?.endpointConfigurations.map((c) => c.method);
      expect(methods).toContain(HttpMethod.GET);
      expect(methods).toContain(HttpMethod.POST);
      expect(methods).toContain(HttpMethod.PUT);
      expect(methods).toContain(HttpMethod.DELETE);
      expect(methods).toContain(HttpMethod.PATCH);
    });
  });
});
