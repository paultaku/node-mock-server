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

### Installation

```bash
npm install
```

### Generate Mock Data

```bash
# Generate mock files from Swagger YAML
npm run generate -- -s demo/swagger.yaml -o mock/
```

### Start Server

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

The server will be available at `http://localhost:3000`

## Usage

### CLI Tool

```bash
# Generate mock files
ts-node src/cli/generate-mock.ts -s <swagger-file> -o <output-dir>

# Options
-s, --swagger <path>  Path to swagger yaml file
-o, --output <path>   Output mock root directory
-h, --help           Display help for command
```

### API Endpoints

The server automatically serves mock responses based on the file structure:

```
mock/
├── pet/
│   ├── {petId}/
│   │   ├── GET/
│   │   │   ├── successful-operation-200.json
│   │   │   └── pet-not-found-404.json
│   │   └── PUT/
│   │       └── successful-operation-200.json
│   └── POST/
│       └── successful-operation-200.json
└── user/
    └── {username}/
        └── GET/
            └── successful-operation-200.json
```

### Mock File Format

Each mock file should contain:

```json
{
  "header": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ],
  "body": {
    "id": 1,
    "name": "Sample Pet",
    "status": "available"
  }
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `MOCK_ROOT`: Mock data root directory (default: ./mock)
- `NODE_ENV`: Environment mode (development/production)

### Build Scripts

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Watch mode
npm run build:watch
```

## Project Structure

```
├── src/
│   ├── server.ts              # Express server
│   ├── mock-generator.ts      # Mock data generator
│   ├── cli/
│   │   └── generate-mock.ts   # CLI tool
│   └── types/
│       └── swagger.ts         # TypeScript types
├── mock/                      # Generated mock data
├── demo/
│   └── swagger.yaml          # Example Swagger file
└── dist/                     # Build output
```

## Development

### Prerequisites

- Node.js >= 16.0.0
- TypeScript
- npm or yarn

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build project
npm run build

# Generate mock data
npm run generate
```

### Code Standards

- Use TypeScript for all source files
- Follow ESLint configuration
- Write unit tests for new features
- Use descriptive variable and function names
- Add JSDoc comments for public APIs

## API Examples

### Pet Store API

```bash
# Get pet by ID
GET /pet/123

# Create new pet
POST /pet

# Update pet
PUT /pet/123

# Delete pet
DELETE /pet/123
```

### User Management API

```bash
# Get user by username
GET /user/johndoe

# Create user
POST /user

# Update user
PUT /user/johndoe

# Delete user
DELETE /user/johndoe
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing examples

## Changelog

### v1.0.0
- Initial release
- Swagger-based mock generation
- File-based routing system
- CLI tool for mock generation
- TypeScript support 