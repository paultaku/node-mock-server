/**
 * Unit Tests for ScenarioManager
 *
 * Tests the scenario CRUD operations and business logic.
 * Following TDD red-green-refactor cycle.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/scenario-manager.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { vol } from 'memfs';
import * as path from 'path';
import {
  Scenario,
  HttpMethod,
  DuplicateScenarioError,
  DuplicateEndpointError,
  EmptyScenarioError,
  ScenarioNotFoundError,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  IScenarioRepository,
  IActiveScenarioTracker
} from '../../src/shared/types/scenario-types';
import { ScenarioRepository } from '../../src/domains/server-runtime/scenario-repository';
import { ActiveScenarioTracker } from '../../src/domains/server-runtime/active-scenario-tracker';
import { ScenarioApplicator } from '../../src/domains/server-runtime/scenario-applicator';
import { ScenarioManager } from '../../src/domains/server-runtime/scenario-manager';

// Mock fs-extra to use memfs for testing
jest.mock('fs-extra');

describe('ScenarioManager', () => {
  let manager: ScenarioManager;
  let repository: IScenarioRepository;
  let tracker: IActiveScenarioTracker;
  let applicator: ScenarioApplicator;
  const mockScenarioDir = '/mock/scenario';
  const mockRoot = '/mock';

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

  const createCreateRequest = (name: string = 'test-scenario'): CreateScenarioRequest => ({
    name,
    endpointConfigurations: [
      {
        path: '/pet/status',
        method: HttpMethod.GET,
        selectedMockFile: 'success-200.json',
        delayMillisecond: 1000
      }
    ]
  });

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(mockScenarioDir, { recursive: true });
    vol.mkdirSync(mockRoot, { recursive: true });

    repository = new ScenarioRepository(mockScenarioDir);
    tracker = new ActiveScenarioTracker(mockScenarioDir);
    applicator = new ScenarioApplicator(mockRoot);
    manager = new ScenarioManager(repository, tracker, applicator);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('create()', () => {
    it('should create and save a new scenario', async () => {
      const request = createCreateRequest('new-scenario');

      const scenario = await manager.create(request);

      expect(scenario.name).toBe('new-scenario');
      expect(scenario.endpointConfigurations).toHaveLength(1);
      expect(scenario.metadata.version).toBe(1);
      expect(scenario.metadata.createdAt).toBeDefined();
      expect(scenario.metadata.lastModified).toBeDefined();
      expect(new Date(scenario.metadata.createdAt).getTime()).toBeGreaterThan(0);
    });

    it('should auto-generate metadata with timestamps', async () => {
      const request = createCreateRequest('metadata-test');
      const beforeCreate = new Date();

      const scenario = await manager.create(request);

      const createdAt = new Date(scenario.metadata.createdAt);
      const lastModified = new Date(scenario.metadata.lastModified);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(lastModified.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(scenario.metadata.version).toBe(1);
    });

    it('should throw DuplicateScenarioError if scenario name already exists', async () => {
      const request = createCreateRequest('duplicate');
      await manager.create(request);

      await expect(manager.create(request)).rejects.toThrow(DuplicateScenarioError);
      await expect(manager.create(request)).rejects.toThrow(
        'Scenario with name "duplicate" already exists'
      );
    });

    it('should throw EmptyScenarioError if no endpoint configurations provided', async () => {
      const request: CreateScenarioRequest = {
        name: 'empty',
        endpointConfigurations: []
      };

      await expect(manager.create(request)).rejects.toThrow(EmptyScenarioError);
      await expect(manager.create(request)).rejects.toThrow(
        'Scenario must contain at least one endpoint configuration'
      );
    });

    it('should throw DuplicateEndpointError if duplicate endpoints in request', async () => {
      const request: CreateScenarioRequest = {
        name: 'duplicate-endpoints',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          }
        ]
      };

      await expect(manager.create(request)).rejects.toThrow(DuplicateEndpointError);
      await expect(manager.create(request)).rejects.toThrow(
        'Endpoint GET /pet/status is already configured in this scenario'
      );
    });

    it('should apply scenario to endpoints after saving', async () => {
      // Setup endpoint directory
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      const request = createCreateRequest('apply-test');
      const scenario = await manager.create(request);

      // Verify scenario was saved
      const saved = await repository.findByName('apply-test');
      expect(saved).toEqual(scenario);

      // Verify status.json was updated
      const statusPath = path.join(mockRoot, 'pet', 'status', 'GET', 'status.json');
      expect(vol.existsSync(statusPath)).toBe(true);
      const status = JSON.parse(vol.readFileSync(statusPath, 'utf-8') as string);
      expect(status.selected).toBe('success-200.json');
      expect(status.delayMillisecond).toBe(1000);
    });

    it('should set scenario as active after successful creation', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      const request = createCreateRequest('active-test');
      await manager.create(request);

      const active = await tracker.getActive();
      expect(active).toBe('active-test');
    });

    it('should handle multiple endpoint configurations', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });
      vol.mkdirSync(path.join(mockRoot, 'user', 'login', 'POST'), { recursive: true });

      const request: CreateScenarioRequest = {
        name: 'multi-endpoint',
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
        ]
      };

      const scenario = await manager.create(request);

      expect(scenario.endpointConfigurations).toHaveLength(2);
      expect(scenario.metadata.version).toBe(1);
    });
  });

  describe('update()', () => {
    it('should update an existing scenario', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      const created = await manager.create(createCreateRequest('update-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'error-500.json',
            delayMillisecond: 2000
          }
        ]
      };

      const updated = await manager.update('update-test', updateRequest);

      expect(updated.name).toBe('update-test');
      expect(updated.metadata.version).toBe(2);
      expect(updated.metadata.lastModified).not.toBe(created.metadata.lastModified);
      expect(updated.endpointConfigurations[0]?.selectedMockFile).toBe('error-500.json');
      expect(updated.endpointConfigurations[0]?.delayMillisecond).toBe(2000);
    });

    it('should preserve createdAt timestamp on update', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      const created = await manager.create(createCreateRequest('preserve-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'updated.json',
            delayMillisecond: 0
          }
        ]
      };

      const updated = await manager.update('preserve-test', updateRequest);

      expect(updated.metadata.createdAt).toBe(created.metadata.createdAt);
      expect(updated.metadata.version).toBe(2);
    });

    it('should increment version number on update', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('version-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'v2.json',
            delayMillisecond: 0
          }
        ]
      };

      const updated1 = await manager.update('version-test', updateRequest);
      expect(updated1.metadata.version).toBe(2);

      const updated2 = await manager.update('version-test', updateRequest);
      expect(updated2.metadata.version).toBe(3);
    });

    it('should throw ScenarioNotFoundError if scenario does not exist', async () => {
      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ]
      };

      await expect(manager.update('non-existent', updateRequest)).rejects.toThrow(
        ScenarioNotFoundError
      );
    });

    it('should throw EmptyScenarioError if update removes all endpoints', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('empty-update-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: []
      };

      await expect(manager.update('empty-update-test', updateRequest)).rejects.toThrow(
        EmptyScenarioError
      );
    });

    it('should throw DuplicateEndpointError if update adds duplicate endpoints', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('duplicate-update-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          }
        ]
      };

      await expect(manager.update('duplicate-update-test', updateRequest)).rejects.toThrow(
        DuplicateEndpointError
      );
    });

    it('should apply updated scenario to endpoints', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('apply-update-test'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'updated-file.json',
            delayMillisecond: 3000
          }
        ]
      };

      await manager.update('apply-update-test', updateRequest);

      const statusPath = path.join(mockRoot, 'pet', 'status', 'GET', 'status.json');
      const status = JSON.parse(vol.readFileSync(statusPath, 'utf-8') as string);
      expect(status.selected).toBe('updated-file.json');
      expect(status.delayMillisecond).toBe(3000);
    });

    it('should set scenario as active after successful update', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('active-update-test'));
      await manager.create(createCreateRequest('other-scenario'));

      const updateRequest: UpdateScenarioRequest = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ]
      };

      await manager.update('active-update-test', updateRequest);

      const active = await tracker.getActive();
      expect(active).toBe('active-update-test');
    });
  });

  describe('delete()', () => {
    it('should delete an existing scenario', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('delete-test'));

      await manager.delete('delete-test');

      const exists = await repository.exists('delete-test');
      expect(exists).toBe(false);
    });

    it('should throw ScenarioNotFoundError if scenario does not exist', async () => {
      await expect(manager.delete('non-existent')).rejects.toThrow(ScenarioNotFoundError);
    });

    it('should clear active scenario if deleted scenario was active', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('active-delete-test'));
      expect(await tracker.getActive()).toBe('active-delete-test');

      await manager.delete('active-delete-test');

      const active = await tracker.getActive();
      expect(active).toBeNull();
    });

    it('should not clear active scenario if deleted scenario was not active', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('active-scenario'));
      await manager.create(createCreateRequest('inactive-scenario'));

      expect(await tracker.getActive()).toBe('inactive-scenario');

      await manager.delete('active-scenario');

      const active = await tracker.getActive();
      expect(active).toBe('inactive-scenario');
    });
  });

  describe('list()', () => {
    it('should return all scenarios with active scenario name', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('scenario-1'));
      await manager.create(createCreateRequest('scenario-2'));

      const result = await manager.list();

      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios.map((s) => s.name).sort()).toEqual(['scenario-1', 'scenario-2']);
      expect(result.activeScenario).toBe('scenario-2'); // Last created is active
    });

    it('should return empty array when no scenarios exist', async () => {
      const result = await manager.list();

      expect(result.scenarios).toHaveLength(0);
      expect(result.activeScenario).toBeNull();
    });

    it('should return null activeScenario when no scenario is active', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      await manager.create(createCreateRequest('scenario-1'));
      await manager.delete('scenario-1'); // This clears active

      const result = await manager.list();

      expect(result.scenarios).toHaveLength(0);
      expect(result.activeScenario).toBeNull();
    });
  });

  describe('get()', () => {
    it('should return scenario by name', async () => {
      vol.mkdirSync(path.join(mockRoot, 'pet', 'status', 'GET'), { recursive: true });

      const created = await manager.create(createCreateRequest('get-test'));

      const result = await manager.get('get-test');

      expect(result).toEqual(created);
    });

    it('should throw ScenarioNotFoundError if scenario does not exist', async () => {
      await expect(manager.get('non-existent')).rejects.toThrow(ScenarioNotFoundError);
    });
  });

  describe('duplicate endpoint prevention', () => {
    it('should prevent duplicate endpoints using Map-based lookup', async () => {
      const request: CreateScenarioRequest = {
        name: 'duplicate-prevention',
        endpointConfigurations: [
          {
            path: '/endpoint1',
            method: HttpMethod.GET,
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/endpoint2',
            method: HttpMethod.POST,
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          },
          {
            path: '/endpoint1', // Duplicate path
            method: HttpMethod.GET, // Duplicate method
            selectedMockFile: 'file3.json',
            delayMillisecond: 0
          }
        ]
      };

      await expect(manager.create(request)).rejects.toThrow(DuplicateEndpointError);
    });

    it('should allow same path with different methods', async () => {
      vol.mkdirSync(path.join(mockRoot, 'resource', 'GET'), { recursive: true });
      vol.mkdirSync(path.join(mockRoot, 'resource', 'POST'), { recursive: true });

      const request: CreateScenarioRequest = {
        name: 'same-path-different-methods',
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
          }
        ]
      };

      const scenario = await manager.create(request);

      expect(scenario.endpointConfigurations).toHaveLength(2);
    });
  });
});

