/**
 * Server Runtime Context - Public Interface Contract
 *
 * This defines the bounded context interface for the Server Runtime domain.
 * External domains (CLI Tools, library consumers) should only depend on these types and interfaces.
 *
 * @module ServerRuntimeContext
 */

export interface MockServerService {
  /**
   * Start the mock server on the specified port
   *
   * @param port - Port number to listen on
   * @param mockRoot - Root directory containing mock response files
   * @throws Error if port is already in use or mockRoot doesn't exist
   */
  start(port: number, mockRoot: string): Promise<void>;

  /**
   * Stop the running mock server
   */
  stop(): Promise<void>;

  /**
   * Get current server status
   * @returns Current status snapshot
   */
  getStatus(): ServerStatus;

  /**
   * Check if server is currently running
   */
  isRunning(): boolean;
}

export interface ServerStatus {
  /** Current server state */
  state: ServerState;

  /** Port number (only when running) */
  port?: number;

  /** Root directory for mock files */
  mockRoot?: string;

  /** Number of requests handled since start */
  requestCount: number;

  /** Time server has been running (milliseconds) */
  uptime?: number;

  /** Timestamp when server started */
  startTime?: Date;

  /** Last error message (if state is 'error') */
  errorMessage?: string;
}

export type ServerState = 'stopped' | 'starting' | 'running' | 'error';

/**
 * Configuration options for mock server
 */
export interface MockServerOptions {
  /** Port to listen on (default: 8080) */
  port?: number;

  /** Root directory for mock files */
  mockRoot: string;

  /** Enable CORS (default: true) */
  cors?: boolean;

  /** Enable request logging (default: true) */
  logging?: boolean;
}

/**
 * Factory function to create a MockServerService instance
 * This is the primary entry point for this domain
 */
export type CreateMockServerService = (options?: Partial<MockServerOptions>) => MockServerService;

/**
 * Event emitted when a request is handled
 */
export interface RequestEvent {
  method: string;
  path: string;
  status: number;
  timestamp: Date;
  duration: number; // milliseconds
}
