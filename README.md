# Node.js Mock Server

A TypeScript-based mock server with automatic Swagger-based mock file generation.

## Features

- **Automatic Mock Generation**: Generate mock data from Swagger/OpenAPI specifications
- **File-based Routing**: Serve mock responses based on file system structure
- **Path Parameter Support**: Handle dynamic route parameters
- **Multiple Response Types**: Support different HTTP status codes and response formats
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

## License

MIT License - see [LICENSE](LICENSE) file for details.
