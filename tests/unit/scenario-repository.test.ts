/**
 * Unit Tests for ScenarioRepository
 *
 * Tests the file-based persistence layer for scenarios.
 * Following TDD red-green-refactor cycle.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/scenario-repository.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { vol } from 'memfs';
import * as path from 'path';
import {
  Scenario,
  HttpMethod,
  DuplicateScenarioError,
  ScenarioNotFoundError
} from '../../src/shared/types/scenario-types';
import { ScenarioRepository } from '../../src/domains/server-runtime/scenario-repository';

// Mock fs-extra to use memfs for testing
jest.mock('fs-extra');

describe('ScenarioRepository', () => {
  let repository: ScenarioRepository;
  const mockScenarioDir = '/mock/scenario';

  // Test fixture - valid scenario
  const validScenario: Scenario = {
    name: 'test-scenario',
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
  };

  beforeEach(() => {
    // Reset memfs before each test
    vol.reset();
    // Create mock scenario directory
    vol.mkdirSync(mockScenarioDir, { recursive: true });
    // Initialize repository with mock directory
    repository = new ScenarioRepository(mockScenarioDir);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('save()', () => {
    it('should save a scenario to a JSON file', async () => {
      await repository.save(validScenario);

      const filePath = path.join(mockScenarioDir, 'test-scenario.json');
      const fileExists = vol.existsSync(filePath);
      expect(fileExists).toBe(true);

      const fileContent = vol.readFileSync(filePath, 'utf-8') as string;
      const savedScenario = JSON.parse(fileContent);
      expect(savedScenario).toEqual(validScenario);
    });

    it('should create scenario directory if it does not exist', async () => {
      vol.reset();
      const newRepo = new ScenarioRepository('/new/scenario/path');

      await newRepo.save(validScenario);

      expect(vol.existsSync('/new/scenario/path')).toBe(true);
      expect(vol.existsSync('/new/scenario/path/test-scenario.json')).toBe(true);
    });

    it('should throw DuplicateScenarioError if scenario already exists', async () => {
      await repository.save(validScenario);

      await expect(repository.save(validScenario)).rejects.toThrow(
        DuplicateScenarioError
      );
      await expect(repository.save(validScenario)).rejects.toThrow(
        'Scenario with name "test-scenario" already exists'
      );
    });

    it('should format JSON with 2-space indentation', async () => {
      await repository.save(validScenario);

      const filePath = path.join(mockScenarioDir, 'test-scenario.json');
      const fileContent = vol.readFileSync(filePath, 'utf-8') as string;

      // Check that JSON is formatted (contains newlines and indentation)
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  ');
    });
  });

  describe('findByName()', () => {
    it('should return scenario when it exists', async () => {
      await repository.save(validScenario);

      const result = await repository.findByName('test-scenario');

      expect(result).toEqual(validScenario);
    });

    it('should return null when scenario does not exist', async () => {
      const result = await repository.findByName('non-existent');

      expect(result).toBeNull();
    });

    it('should parse JSON correctly from file', async () => {
      const filePath = path.join(mockScenarioDir, 'manual-scenario.json');
      vol.writeFileSync(filePath, JSON.stringify(validScenario, null, 2));

      const result = await repository.findByName('manual-scenario');

      expect(result).toEqual(validScenario);
    });

    it('should handle invalid JSON gracefully', async () => {
      const filePath = path.join(mockScenarioDir, 'invalid.json');
      vol.writeFileSync(filePath, 'invalid json content');

      await expect(repository.findByName('invalid')).rejects.toThrow();
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no scenarios exist', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return all scenarios from directory', async () => {
      const scenario1: Scenario = {
        ...validScenario,
        name: 'scenario-1'
      };
      const scenario2: Scenario = {
        ...validScenario,
        name: 'scenario-2'
      };

      await repository.save(scenario1);
      await repository.save(scenario2);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(scenario1);
      expect(result).toContainEqual(scenario2);
    });

    it('should ignore non-JSON files in directory', async () => {
      await repository.save(validScenario);
      vol.writeFileSync(
        path.join(mockScenarioDir, 'README.md'),
        'Documentation file'
      );
      vol.writeFileSync(
        path.join(mockScenarioDir, '_active.json'),
        JSON.stringify({ activeScenario: null })
      );

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-scenario');
    });

    it('should skip files that start with underscore', async () => {
      await repository.save(validScenario);
      const metadataPath = path.join(mockScenarioDir, '_metadata.json');
      vol.writeFileSync(metadataPath, JSON.stringify({ some: 'data' }));

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
    });

    it('should handle directory read errors gracefully', async () => {
      vol.reset(); // Remove directory

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('exists()', () => {
    it('should return true when scenario exists', async () => {
      await repository.save(validScenario);

      const result = await repository.exists('test-scenario');

      expect(result).toBe(true);
    });

    it('should return false when scenario does not exist', async () => {
      const result = await repository.exists('non-existent');

      expect(result).toBe(false);
    });

    it('should check file existence without reading content', async () => {
      const filePath = path.join(mockScenarioDir, 'test-scenario.json');
      vol.writeFileSync(filePath, 'invalid content'); // Invalid JSON

      const result = await repository.exists('test-scenario');

      expect(result).toBe(true); // Should still return true
    });
  });

  describe('update()', () => {
    it('should update an existing scenario', async () => {
      await repository.save(validScenario);

      const updatedScenario: Scenario = {
        ...validScenario,
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: HttpMethod.GET,
            selectedMockFile: 'error-500.json',
            delayMillisecond: 2000
          }
        ],
        metadata: {
          ...validScenario.metadata,
          lastModified: '2025-11-30T11:00:00.000Z',
          version: 2
        }
      };

      await repository.update(updatedScenario);

      const result = await repository.findByName('test-scenario');
      expect(result).toEqual(updatedScenario);
      expect(result?.metadata.version).toBe(2);
    });

    it('should throw ScenarioNotFoundError when scenario does not exist', async () => {
      const nonExistentScenario: Scenario = {
        ...validScenario,
        name: 'non-existent'
      };

      await expect(repository.update(nonExistentScenario)).rejects.toThrow(
        ScenarioNotFoundError
      );
      await expect(repository.update(nonExistentScenario)).rejects.toThrow(
        'Scenario "non-existent" not found'
      );
    });

    it('should preserve file format with 2-space indentation', async () => {
      await repository.save(validScenario);

      const updatedScenario: Scenario = {
        ...validScenario,
        metadata: {
          ...validScenario.metadata,
          version: 2
        }
      };

      await repository.update(updatedScenario);

      const filePath = path.join(mockScenarioDir, 'test-scenario.json');
      const fileContent = vol.readFileSync(filePath, 'utf-8') as string;
      expect(fileContent).toContain('\n');
      expect(fileContent).toContain('  ');
    });
  });

  describe('delete()', () => {
    it('should delete an existing scenario', async () => {
      await repository.save(validScenario);
      expect(await repository.exists('test-scenario')).toBe(true);

      await repository.delete('test-scenario');

      expect(await repository.exists('test-scenario')).toBe(false);
      const result = await repository.findByName('test-scenario');
      expect(result).toBeNull();
    });

    it('should throw ScenarioNotFoundError when scenario does not exist', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow(
        ScenarioNotFoundError
      );
      await expect(repository.delete('non-existent')).rejects.toThrow(
        'Scenario "non-existent" not found'
      );
    });

    it('should only delete specified scenario file', async () => {
      const scenario1: Scenario = { ...validScenario, name: 'scenario-1' };
      const scenario2: Scenario = { ...validScenario, name: 'scenario-2' };

      await repository.save(scenario1);
      await repository.save(scenario2);

      await repository.delete('scenario-1');

      expect(await repository.exists('scenario-1')).toBe(false);
      expect(await repository.exists('scenario-2')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle scenario names with hyphens', async () => {
      const hyphenatedScenario: Scenario = {
        ...validScenario,
        name: 'test-scenario-with-many-hyphens'
      };

      await repository.save(hyphenatedScenario);

      const result = await repository.findByName('test-scenario-with-many-hyphens');
      expect(result).toEqual(hyphenatedScenario);
    });

    it('should handle scenarios with maximum allowed name length', async () => {
      const longName = 'a'.repeat(50); // Max length is 50
      const longNameScenario: Scenario = {
        ...validScenario,
        name: longName
      };

      await repository.save(longNameScenario);

      const result = await repository.findByName(longName);
      expect(result).toEqual(longNameScenario);
    });

    it('should handle scenarios with multiple endpoint configurations', async () => {
      const multiEndpointScenario: Scenario = {
        ...validScenario,
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
            selectedMockFile: 'success-200.json',
            delayMillisecond: 500
          },
          {
            path: '/pet/findByTag/{tag}',
            method: HttpMethod.GET,
            selectedMockFile: 'success-200.json',
            delayMillisecond: 0
          }
        ]
      };

      await repository.save(multiEndpointScenario);

      const result = await repository.findByName('test-scenario');
      expect(result?.endpointConfigurations).toHaveLength(3);
    });
  });
});
