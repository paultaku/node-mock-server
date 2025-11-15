/**
 * Component Contract: StatsComponent
 * Feature: 002-independent-methods
 * Type: TypeScript Interface Definition
 *
 * This contract defines the props interface and rendering expectations
 * for the StatsComponent that displays HTTP method statistics.
 */

/**
 * Statistics data aggregated by HTTP method
 *
 * All counts MUST be non-negative integers.
 * The 'total' SHOULD equal the sum of all method counts.
 */
export interface Stats {
  /** Total count of all endpoints across all methods */
  total: number;

  /** Count of GET method endpoints */
  get: number;

  /** Count of POST method endpoints */
  post: number;

  /** Count of PUT method endpoints */
  put: number;

  /** Count of DELETE method endpoints */
  delete: number;
}

/**
 * Props accepted by StatsComponent
 */
export interface StatsProps {
  /** Aggregated statistics to display */
  stats: Stats;
}

/**
 * StatsComponent Rendering Contract
 *
 * MUST render exactly 6 statistic cards (in order):
 * 1. Total Endpoints - displays stats.total
 * 2. GET Requests - displays stats.get
 * 3. POST Requests - displays stats.post
 * 4. PUT Requests - displays stats.put (SEPARATE CARD - FR-001)
 * 5. DELETE Requests - displays stats.delete (SEPARATE CARD - FR-002)
 * 6. (Reserved for future methods like PATCH, OPTIONS)
 *
 * Requirements:
 * - FR-001: PUT count MUST be displayed in a separate card
 * - FR-002: DELETE count MUST be displayed in a separate card
 * - FR-005: PUT and DELETE MUST NOT be combined or aggregated
 * - FR-006: PUT card MUST be visually consistent with GET/POST cards
 * - FR-007: DELETE card MUST be visually consistent with GET/POST cards
 * - FR-010: Each card MUST clearly label the HTTP method it represents
 *
 * Visual Specifications:
 * - Layout: Responsive grid (grid-cols-2 md:grid-cols-6)
 * - Card structure: White background, rounded corners, padding, shadow
 * - Number: Large (text-3xl), bold, colored by method type
 * - Label: Small (text-sm), gray text
 *
 * Color Scheme:
 * - Total: text-primary-600 (blue)
 * - GET: text-success-600 (green)
 * - POST: text-warning-600 (amber/yellow)
 * - PUT: text-warning-600 (amber/yellow)
 * - DELETE: text-error-600 (red)
 *
 * Performance Contract:
 * - SC-001: PUT card MUST render within 1 second of component mount
 * - SC-002: DELETE card MUST render within 1 second of component mount
 * - SC-007: Updates MUST render within 500ms when stats prop changes
 *
 * Accessibility:
 * - Text contrast MUST meet WCAG AA standards
 * - Labels MUST be descriptive for screen readers
 */
export type StatsComponent = React.FC<StatsProps>;

/**
 * Test Data Contracts
 *
 * These interfaces define test scenarios for validating the component.
 */

/** Typical statistics distribution */
export const TYPICAL_STATS: Stats = {
  total: 10,
  get: 4,
  post: 3,
  put: 2,
  delete: 1,
};

/** Edge case: No PUT endpoints */
export const NO_PUT_STATS: Stats = {
  total: 5,
  get: 2,
  post: 2,
  put: 0,
  delete: 1,
};

/** Edge case: No DELETE endpoints */
export const NO_DELETE_STATS: Stats = {
  total: 6,
  get: 2,
  post: 3,
  put: 1,
  delete: 0,
};

/** Edge case: No endpoints at all */
export const EMPTY_STATS: Stats = {
  total: 0,
  get: 0,
  post: 0,
  put: 0,
  delete: 0,
};

/** Edge case: Large numbers */
export const LARGE_STATS: Stats = {
  total: 1523,
  get: 500,
  post: 400,
  put: 423,
  delete: 200,
};

/**
 * Validation Functions
 */

/** Validates that Stats object has all required properties with non-negative values */
export function isValidStats(stats: unknown): stats is Stats {
  if (typeof stats !== 'object' || stats === null) return false;

  const s = stats as Partial<Stats>;

  return (
    typeof s.total === 'number' && s.total >= 0 &&
    typeof s.get === 'number' && s.get >= 0 &&
    typeof s.post === 'number' && s.post >= 0 &&
    typeof s.put === 'number' && s.put >= 0 &&
    typeof s.delete === 'number' && s.delete >= 0
  );
}

/** Validates that total equals sum of method counts (within 1% tolerance for floating point) */
export function isConsistentStats(stats: Stats): boolean {
  const sum = stats.get + stats.post + stats.put + stats.delete;
  const tolerance = Math.max(1, stats.total * 0.01);
  return Math.abs(stats.total - sum) <= tolerance;
}
