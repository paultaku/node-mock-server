/**
 * Unit Tests for ActiveScenarioTracker
 *
 * Tests the active scenario tracking functionality using memfs.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/domains/server-runtime/active-scenario-tracker.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { vol } from 'memfs';
import * as path from 'path';
import { ActiveScenarioTracker } from '../../src/domains/server-runtime/active-scenario-tracker';

// Mock fs-extra to use memfs for testing
jest.mock('fs-extra');

describe('ActiveScenarioTracker', () => {
  let tracker: ActiveScenarioTracker;
  const mockScenarioDir = '/mock/scenario';
  const activeFilePath = path.join(mockScenarioDir, '_active.json');

  beforeEach(() => {
    // Reset memfs before each test
    vol.reset();
    // Create mock scenario directory
    vol.mkdirSync(mockScenarioDir, { recursive: true });
    // Initialize tracker with mock directory
    tracker = new ActiveScenarioTracker(mockScenarioDir);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('getActive()', () => {
    it('should return null when _active.json does not exist', async () => {
      const result = await tracker.getActive();

      expect(result).toBeNull();
    });

    it('should return scenario name when active scenario is set', async () => {
      vol.writeFileSync(
        activeFilePath,
        JSON.stringify({
          activeScenario: 'test-scenario',
          lastUpdated: '2025-11-30T10:00:00.000Z'
        })
      );

      const result = await tracker.getActive();

      expect(result).toBe('test-scenario');
    });

    it('should return null when activeScenario is null', async () => {
      vol.writeFileSync(
        activeFilePath,
        JSON.stringify({
          activeScenario: null,
          lastUpdated: '2025-11-30T10:00:00.000Z'
        })
      );

      const result = await tracker.getActive();

      expect(result).toBeNull();
    });

    it('should return null on corrupted JSON', async () => {
      vol.writeFileSync(activeFilePath, 'invalid json content');

      const result = await tracker.getActive();

      expect(result).toBeNull();
    });

    it('should return null on file read errors', async () => {
      vol.mkdirSync(activeFilePath as any); // Create directory instead of file

      const result = await tracker.getActive();

      expect(result).toBeNull();
    });
  });

  describe('setActive()', () => {
    it('should create _active.json with scenario name', async () => {
      await tracker.setActive('my-scenario');

      expect(vol.existsSync(activeFilePath)).toBe(true);

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed = JSON.parse(content);

      expect(parsed.activeScenario).toBe('my-scenario');
      expect(parsed.lastUpdated).toBeDefined();
      expect(new Date(parsed.lastUpdated).getTime()).toBeGreaterThan(0);
    });

    it('should update existing _active.json', async () => {
      await tracker.setActive('scenario-1');
      const firstUpdate = await tracker.getActive();
      expect(firstUpdate).toBe('scenario-1');

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await tracker.setActive('scenario-2');
      const secondUpdate = await tracker.getActive();
      expect(secondUpdate).toBe('scenario-2');
    });

    it('should create directory if it does not exist', async () => {
      vol.reset();
      const newTracker = new ActiveScenarioTracker('/new/scenario/path');

      await newTracker.setActive('test-scenario');

      expect(vol.existsSync('/new/scenario/path')).toBe(true);
      expect(vol.existsSync('/new/scenario/path/_active.json')).toBe(true);
    });

    it('should format JSON with 2-space indentation', async () => {
      await tracker.setActive('formatted-scenario');

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;

      expect(content).toContain('\n');
      expect(content).toContain('  ');
      expect(content).toContain('"activeScenario"');
    });

    it('should set ISO 8601 timestamp', async () => {
      await tracker.setActive('timestamped-scenario');

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed = JSON.parse(content);

      // Validate ISO 8601 format
      expect(parsed.lastUpdated).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      const timestamp = new Date(parsed.lastUpdated);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('clearActive()', () => {
    it('should set activeScenario to null', async () => {
      await tracker.setActive('scenario-to-clear');
      expect(await tracker.getActive()).toBe('scenario-to-clear');

      await tracker.clearActive();

      const result = await tracker.getActive();
      expect(result).toBeNull();
    });

    it('should update lastUpdated timestamp', async () => {
      await tracker.setActive('scenario');
      const content1 = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed1 = JSON.parse(content1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await tracker.clearActive();
      const content2 = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed2 = JSON.parse(content2);

      expect(parsed2.activeScenario).toBeNull();
      expect(parsed2.lastUpdated).not.toBe(parsed1.lastUpdated);
    });

    it('should create _active.json if it does not exist', async () => {
      expect(vol.existsSync(activeFilePath)).toBe(false);

      await tracker.clearActive();

      expect(vol.existsSync(activeFilePath)).toBe(true);
      const result = await tracker.getActive();
      expect(result).toBeNull();
    });

    it('should format JSON with 2-space indentation', async () => {
      await tracker.clearActive();

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;

      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });

  describe('getActiveReference()', () => {
    it('should return full reference when active scenario is set', async () => {
      await tracker.setActive('reference-scenario');

      const reference = await tracker.getActiveReference();

      expect(reference.activeScenario).toBe('reference-scenario');
      expect(reference.lastUpdated).toBeDefined();
      expect(new Date(reference.lastUpdated).getTime()).toBeGreaterThan(0);
    });

    it('should return default reference when file does not exist', async () => {
      const reference = await tracker.getActiveReference();

      expect(reference.activeScenario).toBeNull();
      expect(reference.lastUpdated).toBeDefined();
    });

    it('should return reference with null when cleared', async () => {
      await tracker.setActive('scenario');
      await tracker.clearActive();

      const reference = await tracker.getActiveReference();

      expect(reference.activeScenario).toBeNull();
      expect(reference.lastUpdated).toBeDefined();
    });

    it('should return default reference on corrupted JSON', async () => {
      vol.writeFileSync(activeFilePath, 'corrupted content');

      const reference = await tracker.getActiveReference();

      expect(reference.activeScenario).toBeNull();
      expect(reference.lastUpdated).toBeDefined();
    });
  });

  describe('lifecycle scenarios', () => {
    it('should handle set -> get -> clear -> get cycle', async () => {
      // Initially null
      expect(await tracker.getActive()).toBeNull();

      // Set active
      await tracker.setActive('cycle-scenario');
      expect(await tracker.getActive()).toBe('cycle-scenario');

      // Clear active
      await tracker.clearActive();
      expect(await tracker.getActive()).toBeNull();

      // Set again
      await tracker.setActive('new-scenario');
      expect(await tracker.getActive()).toBe('new-scenario');
    });

    it('should handle multiple consecutive setActive calls', async () => {
      await tracker.setActive('scenario-1');
      await tracker.setActive('scenario-2');
      await tracker.setActive('scenario-3');

      const result = await tracker.getActive();
      expect(result).toBe('scenario-3');
    });

    it('should handle multiple consecutive clearActive calls', async () => {
      await tracker.setActive('scenario');
      await tracker.clearActive();
      await tracker.clearActive();
      await tracker.clearActive();

      const result = await tracker.getActive();
      expect(result).toBeNull();
    });
  });

  describe('special scenario names', () => {
    it('should handle scenario names with hyphens', async () => {
      await tracker.setActive('test-scenario-with-hyphens');

      const result = await tracker.getActive();
      expect(result).toBe('test-scenario-with-hyphens');
    });

    it('should handle scenario names with numbers', async () => {
      await tracker.setActive('scenario-123');

      const result = await tracker.getActive();
      expect(result).toBe('scenario-123');
    });

    it('should handle maximum length scenario names', async () => {
      const longName = 'a'.repeat(50);
      await tracker.setActive(longName);

      const result = await tracker.getActive();
      expect(result).toBe(longName);
    });
  });

  describe('file integrity', () => {
    it('should create valid JSON that can be manually parsed', async () => {
      await tracker.setActive('manual-parse');

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('activeScenario');
      expect(parsed).toHaveProperty('lastUpdated');
    });

    it('should overwrite existing file completely', async () => {
      vol.writeFileSync(
        activeFilePath,
        JSON.stringify({
          activeScenario: 'old',
          lastUpdated: '2025-01-01T00:00:00.000Z',
          extraField: 'should be removed'
        })
      );

      await tracker.setActive('new');

      const content = vol.readFileSync(activeFilePath, 'utf-8') as string;
      const parsed = JSON.parse(content);

      expect(parsed.activeScenario).toBe('new');
      expect(parsed).not.toHaveProperty('extraField');
    });
  });
});
