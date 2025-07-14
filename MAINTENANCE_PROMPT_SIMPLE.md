# **Role**

Senior software developer, responsible for maintaining and extending a clean, well-organized, and maintainable mock server codebase.

---

## **User Scenarios**

1. **Automatic Static Mock File System Generation**

- Users want to automatically generate a static mock directory structure based on a Swagger (OpenAPI 3.0, YAML) API definition.
- For example, the `/user/login` endpoint with the GET method will generate a folder like `mock/user/login/GET` under a specified root (e.g., mock/), and inside it, files such as `successful-operation-200.json`, `invalid-username-password-supplied-400.json`, etc.
- Example response file content:

```json
{
  "header": [],
  "body": { "token": "abc123", "user": { "id": 1, "name": "John Doe" } }
}
```

2. **Switching API Responses via UI**

- Users can switch the active mock response for each API endpoint via a React-based frontend UI (e.g., select `successful-operation-200.json` or `invalid-username-password-supplied-400.json`).
- The backend Express server returns the selected mock response according to the UI selection.

3. **Multi-Server Management**

- Users can start and manage multiple mock server instances simultaneously
- Support for environment isolation (dev, test, staging, production)
- Load testing capabilities with multiple servers
- Health monitoring and automatic recovery

---

## **Technical Architecture**

- **Language:** TypeScript
- **Type Validation:** zod
- **Backend:** Express
- **Frontend:** React (embedded in HTML with CDN)
- **Mock Directory Generation:** CLI tool, supports YAML Swagger parsing, auto-generates multi-level paths
- **Unit Testing:** Jest (configured but tests removed due to complexity)
- **Multi-Server Management:** MockServerManager and MultiServerManager classes

---

## **Detailed Features & Implementation**

**1. Automatic Mock Directory Generation**

- Use a CLI tool (e.g., `npm run generate -- --swagger ./demo/swagger.yaml --output ./mock`) to parse Swagger YAML and auto-generate the mock directory and response files.
- Response file naming is fixed (e.g., `successful-operation-200.json`, `invalid-username-password-supplied-400.json`), and content is auto-generated based on the Swagger response schema, prioritizing the example field.
- Supports multi-level paths and path parameters (e.g., `/user/{username}`).
- **Security:** Only allows letters, numbers, -, \*, {} in mock directory and file names; skips invalid names to avoid routing conflicts and path-to-regexp errors.

**2. Mock Server**

- Express server with automatic routing, supporting multi-level and path parameter matching (e.g., `/user/jack` matches `/user/{username}`).
- Returns both header and body from the mock file.
- **API Endpoints:**
  - GET /api/endpoints - Get all available API endpoints with their current mock states
  - POST /api/set-mock - Set mock response for an endpoint
  - GET /api/mock-state - Get current mock state for an endpoint
- **Defensive handling:** Validates file existence, handles missing responses gracefully, sets appropriate HTTP status codes.

**3. UI (Implemented)**

- React frontend displays all endpoints and methods, allowing users to switch the current mock response.
- Uses API to get and set the current response.
- **Features:**
  - Real-time endpoint listing with statistics
  - Dropdown selection for each endpoint's available mock files
  - Visual status indicators (success/error/warning)
  - Responsive design with modern UI

**4. Multi-Server Management**

- **MockServerManager:** Single server management with start, stop, restart, and status monitoring
- **MultiServerManager:** Multiple server management with environment isolation and load balancing
- **Features:**
  - Environment-specific configurations (dev, test, staging, production)
  - Load testing with multiple concurrent servers
  - Health monitoring and automatic recovery
  - Graceful shutdown and resource cleanup

**5. Type Safety**

- Uses zod to define Swagger structure, mock response structure, and API types for switching responses.
- Comprehensive TypeScript configuration with strict mode enabled.

**6. Unit Testing**

- Uses Jest configuration ready for testing Swagger parsing, mock directory generation, response switching, etc.

---

## **Recommended Dependencies**

- yaml: YAML parsing
- zod: Type validation
- fs-extra: File operations
- commander: CLI tool
- express, @types/express: API server
- jest, ts-jest: Unit testing
- ts-node, typescript: Development environment

---

## **Current Directory Structure**

```
node-mock-server/
├── src/
│   ├── server.ts                    # Core server logic
│   ├── mock-server-manager.ts       # Server management classes
│   ├── example-usage.ts            # Basic usage examples
│   ├── manager-example.ts          # Manager usage examples
│   ├── multi-server-demo.ts        # Multi-server demonstrations
│   ├── simple-multi-server.ts      # Simplified multi-server examples
│   ├── cli/
│   │   └── generate-mock.ts        # CLI tool entry
│   ├── mock-generator.ts           # Mock directory and file generation logic
│   └── types/
│       └── swagger.ts              # Zod type definitions
├── public/
│   └── index.html                  # React frontend (CDN-based)
├── mock/                           # Auto-generated mock directory
├── demo/
│   └── swagger.yaml                # Example Swagger file
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

---

## **Usage Examples**

**1. Generate Mock**

```bash
npm run generate -- --swagger ./demo/swagger.yaml --output ./mock
```

**2. Start Single Server**

```bash
npm run dev
```

**3. Start Multiple Servers**

```typescript
import { createMultiServerManager } from "./src/mock-server-manager";

const multiManager = createMultiServerManager();
const server1 = await multiManager.createServer(3000);
const server2 = await multiManager.createServer(3001);
const server3 = await multiManager.createServer(3002);
```

**4. Access Management UI**
Open browser to `http://localhost:3000`

**5. API Testing**

```bash
# Get all endpoints
curl http://localhost:3000/api/endpoints

# Set mock response
curl -X POST http://localhost:3000/api/set-mock \
  -H "Content-Type: application/json" \
  -d '{"path": "/user/login", "method": "GET", "mockFile": "successful-operation-200.json"}'

# Test mock API
curl http://localhost:3000/user/login
```

---

## **Available Scripts**

```bash
# Basic commands
npm run dev                    # Start default server
npm run generate              # Generate mock files
npm run build                 # Build project
npm start                     # Start production server

# Examples and demonstrations
npm run example               # Run basic examples
npm run manager               # Run manager examples
npm run multi-demo            # Run complete multi-server demo
npm run simple-multi          # Run simplified multi-server examples

# Testing
npm test                      # Run tests
npm run test:watch            # Watch mode for tests
```

---

## **Key Features Implemented**

- ✅ **Automatic mock file generation** from Swagger YAML
- ✅ **Smart path matching** with parameter support
- ✅ **React-based management UI** with real-time switching
- ✅ **Type-safe implementation** with Zod validation
- ✅ **Defensive error handling** and security measures
- ✅ **Comprehensive CLI tool** for mock generation
- ✅ **API endpoints** for programmatic control
- ✅ **Modern UI design** with status indicators
- ✅ **Multi-server management** with environment isolation
- ✅ **Load testing capabilities** with multiple servers
- ✅ **Health monitoring** and automatic recovery

---

## **Use Cases**

1. **Multi-Environment Development**

   - Simultaneously run development, testing, and staging environments
   - Each environment can have different mock data configurations

2. **Load Testing**

   - Start multiple servers for performance testing
   - Distribute requests across multiple server instances

3. **A/B Testing**

   - Run different server configurations for version comparison
   - Randomly distribute users to different versions

4. **Microservice Simulation**
   - Simulate microservice architecture
   - Independent services with separate mock data

---

## **Notes**

- Do not use special characters like : _ ? ( ) [ ] in mock directory or file names; only use letters, numbers, -, _, {}.
- Path parameters are supported in format {paramName}.
- Default mock file is successful-operation-200.json.
- Supports temporary response switching via query parameter: ?mock=error-404.json.
- The system is production-ready and can be extended for advanced features (e.g., hot switching of mock responses, UI interaction, auto-refresh of mock files) as needed.
- Multi-server management supports up to 10 concurrent servers for optimal performance.
- Each server instance uses approximately 50-100MB of memory.
- Recommended port range: 3000-3999.
- Always implement proper resource cleanup when stopping servers.
