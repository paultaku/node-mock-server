# Node.js Mock Server

A TypeScript-based mock server with automatic Swagger-based mock file generation.

## Features

- **Automatic Mock Generation**: Generate mock data from Swagger/OpenAPI specifications
- **File-based Routing**: Serve mock responses based on file system structure
- **Path Parameter Support**: Handle dynamic route parameters
- **Multiple Response Types**: Support different HTTP status codes and response formats
- **Scenario Management**: Create, manage, and activate test scenarios with predefined endpoint configurations. Scenarios allow you to quickly switch between different mock response setups for testing various application states
- **CLI Tool**: Command-line interface for generating mock files
- **TypeScript Support**: Full TypeScript implementation with type safety

## Quick Start

### Generate Statice File Data from swagger.yml

```bash
# Generate mock files from Swagger YAML
npx @paultaku/node-mock-server -s demo/swagger.yaml -o mock/
```

List support flag for further configuration

```bash
# Generate mock files from Swagger YAML
npx @paultaku/node-mock-server -h
```

```bash
# Options
-s, --swagger <path>  Path to swagger yaml file
-o, --output <path>   Output mock root directory
-h, --help           Display help for command
```

### How to run a local mock server

```javascript
import pkg from "@paultaku/node-mock-server";
import path from "path";
const { startMockServer } = pkg;

const mockRoot = path.resolve("./mock");
console.log(mockRoot);

startMockServer(8888, mockRoot);
```

## Scenario Management

The mock server includes a scenario management system that allows you to create, manage, and activate predefined endpoint configurations for different testing scenarios. Scenarios enable you to quickly switch between different mock response behaviors without manually updating individual endpoint configurations.

### Creating Scenarios

Scenarios can be created via the REST API:

```bash
# Create a new scenario
curl -X POST http://localhost:8888/_mock/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "error-scenario",
    "endpointConfigurations": [
      {
        "path": "/pet/status",
        "method": "GET",
        "selectedMockFile": "error-500.json",
        "delayMillisecond": 1000
      }
    ]
  }'
```

### Managing Scenarios

```bash
# List all scenarios
curl http://localhost:8888/_mock/scenarios

# Get a specific scenario
curl http://localhost:8888/_mock/scenarios/error-scenario

# Get the active scenario
curl http://localhost:8888/_mock/scenarios/active

# Update a scenario
curl -X PUT http://localhost:8888/_mock/scenarios/error-scenario \
  -H "Content-Type: application/json" \
  -d '{
    "endpointConfigurations": [
      {
        "path": "/pet/status",
        "method": "GET",
        "selectedMockFile": "error-404.json",
        "delayMillisecond": 500
      }
    ]
  }'

# Delete a scenario
curl -X DELETE http://localhost:8888/_mock/scenarios/error-scenario
```

### Activating Scenarios

To apply a scenario's configurations to the mock endpoints, activate it:


When a scenario is activated:
- All endpoint `status.json` files are updated with the scenario's configurations
- The scenario is marked as active in `_active.json`
- Subsequent API requests will use the configured mock files and delays

### Scenario Features

- **Named Scenarios**: Organize different test configurations with descriptive names (e.g., "error-scenario", "success-flow")
- **Endpoint Configurations**: Configure which mock file and delay to use for each endpoint in a scenario
- **One-Click Activation**: Activate a scenario to instantly apply all its configurations to live endpoints
- **Active Scenario Tracking**: Automatically tracks which scenario is currently active via `_active.json`
- **File Persistence**: Scenarios are saved as JSON files in the `mock/scenario/` directory for easy version control
- **Validation**: Prevents duplicate scenarios, empty scenarios, and duplicate endpoints within a scenario
- **Response Delays**: Configure response delays (0-60000ms) per endpoint to simulate network latency
- **Real-time Updates**: Changes to scenarios are immediately reflected in API responses when activated

### Use Cases

- **Testing Error Scenarios**: Create scenarios that return error responses for specific endpoints
- **Simulating Different States**: Switch between scenarios representing different application states (e.g., "logged-in", "logged-out")
- **Performance Testing**: Use delay configurations to test how your application handles slow API responses
- **Integration Testing**: Quickly switch between different mock data sets for comprehensive integration testing


## License

MIT License - see [LICENSE](LICENSE) file for details.
