/**
 * Unit Tests for Scenario Validation
 *
 * Tests Zod schema validation for scenarios and endpoint configurations.
 * Following TDD red-green-refactor cycle.
 *
 * @see specs/004-scenario-management/data-model.md
 * @see src/shared/types/validation-schemas.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  EndpointConfigurationSchema,
  ScenarioSchema,
  CreateScenarioRequestSchema,
  UpdateScenarioRequestSchema,
  validateCreateScenarioRequest,
  validateUpdateScenarioRequest,
  validateScenario,
  formatScenarioValidationErrors
} from '../../src/shared/types/validation-schemas';

describe('Scenario Validation', () => {
  describe('EndpointConfigurationSchema', () => {
    it('should validate valid endpoint configuration', () => {
      const valid = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'success-200.json',
        delayMillisecond: 1000
      };

      const result = EndpointConfigurationSchema.safeParse(valid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.path).toBe('/pet/status');
        expect(result.data.method).toBe('GET');
        expect(result.data.selectedMockFile).toBe('success-200.json');
        expect(result.data.delayMillisecond).toBe(1000);
      }
    });

    it('should require path to start with /', () => {
      const invalid = {
        path: 'pet/status', // Missing leading slash
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 0
      };

      const result = EndpointConfigurationSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('start with /');
      }
    });

    it('should reject invalid HTTP methods', () => {
      const invalid = {
        path: '/pet/status',
        method: 'INVALID',
        selectedMockFile: 'file.json',
        delayMillisecond: 0
      };

      const result = EndpointConfigurationSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should require mock file to end with .json', () => {
      const invalid = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.txt', // Wrong extension
        delayMillisecond: 0
      };

      const result = EndpointConfigurationSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('.json');
      }
    });

    it('should validate delay range (0-60000)', () => {
      const validMin = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 0
      };

      const validMax = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 60000
      };

      const invalidNegative = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: -1
      };

      const invalidTooLarge = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 60001
      };

      expect(EndpointConfigurationSchema.safeParse(validMin).success).toBe(true);
      expect(EndpointConfigurationSchema.safeParse(validMax).success).toBe(true);
      expect(EndpointConfigurationSchema.safeParse(invalidNegative).success).toBe(false);
      expect(EndpointConfigurationSchema.safeParse(invalidTooLarge).success).toBe(false);
    });

    it('should default delayMillisecond to 0 if not provided', () => {
      const withoutDelay = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json'
      };

      const result = EndpointConfigurationSchema.safeParse(withoutDelay);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.delayMillisecond).toBe(0);
      }
    });

    it('should reject non-integer delay values', () => {
      const invalid = {
        path: '/pet/status',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 1.5
      };

      const result = EndpointConfigurationSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('integer');
      }
    });

    it('should accept all valid HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const config = {
          path: '/resource',
          method,
          selectedMockFile: 'file.json',
          delayMillisecond: 0
        };

        const result = EndpointConfigurationSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });

    it('should accept paths with parameters', () => {
      const config = {
        path: '/pet/{petId}',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 0
      };

      const result = EndpointConfigurationSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should accept paths with hyphens and underscores', () => {
      const config = {
        path: '/api/v1/user-profile',
        method: 'GET',
        selectedMockFile: 'file.json',
        delayMillisecond: 0
      };

      const result = EndpointConfigurationSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  describe('ScenarioSchema', () => {
    it('should validate valid scenario', () => {
      const valid = {
        name: 'test-scenario',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
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

      const result = ScenarioSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require scenario name (1-50 chars, alphanumeric + hyphens)', () => {
      const emptyName = {
        name: '',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const tooLong = {
        name: 'a'.repeat(51), // 51 characters
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const invalidChars = {
        name: 'test scenario', // Contains space
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      expect(ScenarioSchema.safeParse(emptyName).success).toBe(false);
      expect(ScenarioSchema.safeParse(tooLong).success).toBe(false);
      expect(ScenarioSchema.safeParse(invalidChars).success).toBe(false);
    });

    it('should require at least one endpoint configuration', () => {
      const empty = {
        name: 'empty-scenario',
        endpointConfigurations: [],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = ScenarioSchema.safeParse(empty);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('at least one');
      }
    });

    it('should reject duplicate endpoint configurations', () => {
      const duplicate = {
        name: 'duplicate-endpoints',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = ScenarioSchema.safeParse(duplicate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('Duplicate');
      }
    });

    it('should allow same path with different methods', () => {
      const valid = {
        name: 'same-path-different-methods',
        endpointConfigurations: [
          {
            path: '/resource',
            method: 'GET',
            selectedMockFile: 'get.json',
            delayMillisecond: 0
          },
          {
            path: '/resource',
            method: 'POST',
            selectedMockFile: 'post.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = ScenarioSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should validate metadata structure', () => {
      const invalidMetadata = {
        name: 'test',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: 'invalid-date',
          lastModified: 'invalid-date',
          version: 'not-a-number'
        }
      };

      const result = ScenarioSchema.safeParse(invalidMetadata);

      expect(result.success).toBe(false);
    });

    it('should accept maximum length scenario name (50 chars)', () => {
      const maxLength = {
        name: 'a'.repeat(50),
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file.json',
            delayMillisecond: 0
          }
        ],
        metadata: {
          createdAt: '2025-11-30T10:00:00.000Z',
          lastModified: '2025-11-30T10:00:00.000Z',
          version: 1
        }
      };

      const result = ScenarioSchema.safeParse(maxLength);

      expect(result.success).toBe(true);
    });
  });

  describe('CreateScenarioRequestSchema', () => {
    it('should validate valid create request', () => {
      const valid = {
        name: 'new-scenario',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'success-200.json',
            delayMillisecond: 1000
          }
        ]
      };

      const result = CreateScenarioRequestSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should reject duplicate endpoints in request', () => {
      const duplicate = {
        name: 'duplicate',
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          }
        ]
      };

      const result = CreateScenarioRequestSchema.safeParse(duplicate);

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateScenarioRequestSchema', () => {
    it('should validate valid update request', () => {
      const valid = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'updated.json',
            delayMillisecond: 2000
          }
        ]
      };

      const result = UpdateScenarioRequestSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should require at least one endpoint configuration', () => {
      const empty = {
        endpointConfigurations: []
      };

      const result = UpdateScenarioRequestSchema.safeParse(empty);

      expect(result.success).toBe(false);
    });

    it('should reject duplicate endpoints in update request', () => {
      const duplicate = {
        endpointConfigurations: [
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file1.json',
            delayMillisecond: 0
          },
          {
            path: '/pet/status',
            method: 'GET',
            selectedMockFile: 'file2.json',
            delayMillisecond: 0
          }
        ]
      };

      const result = UpdateScenarioRequestSchema.safeParse(duplicate);

      expect(result.success).toBe(false);
    });
  });

  describe('Validation Helpers', () => {
    describe('validateCreateScenarioRequest', () => {
      it('should return success for valid request', () => {
        const valid = {
          name: 'test',
          endpointConfigurations: [
            {
              path: '/pet/status',
              method: 'GET',
              selectedMockFile: 'file.json',
              delayMillisecond: 0
            }
          ]
        };

        const result = validateCreateScenarioRequest(valid);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('test');
        }
      });

      it('should return errors for invalid request', () => {
        const invalid = {
          name: '',
          endpointConfigurations: []
        };

        const result = validateCreateScenarioRequest(invalid);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.errors.length).toBeGreaterThan(0);
        }
      });
    });

    describe('validateUpdateScenarioRequest', () => {
      it('should return success for valid request', () => {
        const valid = {
          endpointConfigurations: [
            {
              path: '/pet/status',
              method: 'GET',
              selectedMockFile: 'file.json',
              delayMillisecond: 0
            }
          ]
        };

        const result = validateUpdateScenarioRequest(valid);

        expect(result.success).toBe(true);
      });

      it('should return errors for invalid request', () => {
        const invalid = {
          endpointConfigurations: []
        };

        const result = validateUpdateScenarioRequest(invalid);

        expect(result.success).toBe(false);
      });
    });

    describe('validateScenario', () => {
      it('should return success for valid scenario', () => {
        const valid = {
          name: 'test',
          endpointConfigurations: [
            {
              path: '/pet/status',
              method: 'GET',
              selectedMockFile: 'file.json',
              delayMillisecond: 0
            }
          ],
          metadata: {
            createdAt: '2025-11-30T10:00:00.000Z',
            lastModified: '2025-11-30T10:00:00.000Z',
            version: 1
          }
        };

        const result = validateScenario(valid);

        expect(result.success).toBe(true);
      });

      it('should return errors for invalid scenario', () => {
        const invalid = {
          name: '',
          endpointConfigurations: [],
          metadata: {}
        };

        const result = validateScenario(invalid);

        expect(result.success).toBe(false);
      });
    });

    describe('formatScenarioValidationErrors', () => {
      it('should format Zod errors for API response', () => {
        const invalid = {
          name: '',
          endpointConfigurations: []
        };

        const validation = validateCreateScenarioRequest(invalid);

        if (!validation.success) {
          const formatted = formatScenarioValidationErrors(validation.errors);

          expect(formatted.error).toContain('Validation failed');
          expect(formatted.field).toBeDefined();
          expect(formatted.constraint).toBeDefined();
        }
      });
    });
  });
});

