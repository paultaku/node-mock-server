# Node.js Mock Server

A TypeScript-based mock server with automatic Swagger-based mock file generation.

## Features

- **Automatic Mock Generation**: Generate mock data from Swagger/OpenAPI specifications
- **File-based Routing**: Serve mock responses based on file system structure
- **Path Parameter Support**: Handle dynamic route parameters
- **Multiple Response Types**: Support different HTTP status codes and response formats
- **Scenario Management**: Create and manage test scenarios with predefined endpoint configurations
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

The mock server includes a scenario management system that allows you to create and apply predefined endpoint configurations for different testing scenarios.

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

### Scenario Features

- **Named Scenarios**: Organize different test configurations with descriptive names
- **Endpoint Configurations**: Configure which mock file and delay to use for each endpoint
- **Active Scenario Tracking**: Automatically tracks which scenario is currently active
- **File Persistence**: Scenarios are saved as JSON files in the `mock/scenario/` directory
- **Validation**: Prevents duplicate scenarios, empty scenarios, and duplicate endpoints within a scenario
- **Delay Configuration**: Add response delays (0-60000ms) to simulate network latency

For more details, see the [scenario management specification](specs/004-scenario-management/spec.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.
