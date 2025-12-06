# User Scenarios Directory

This directory contains user-defined test scenarios for the mock server. Each scenario is a collection of endpoint configurations that define specific mock response behaviors.

## Directory Structure

```
mock/scenario/
├── README.md                 # This file
├── _active.json             # Tracks the currently active scenario
└── {scenario-name}.json     # Individual scenario configuration files
```

## Scenario Files

Each scenario is stored as a JSON file with the following structure:

```json
{
  "name": "scenario-name",
  "endpointConfigurations": [
    {
      "path": "/pet/status",
      "method": "GET",
      "selectedMockFile": "success-200.json",
      "delayMillisecond": 1000
    }
  ],
  "metadata": {
    "createdAt": "2025-11-29T10:00:00.000Z",
    "lastModified": "2025-11-29T10:15:00.000Z",
    "version": 1
  }
}
```

### Scenario Fields

- **name**: Unique identifier for the scenario (alphanumeric + hyphens, 1-50 characters)
- **endpointConfigurations**: Array of endpoint configurations (minimum 1 required)
  - **path**: API endpoint path (e.g., `/pet/status`)
  - **method**: HTTP method (GET, POST, PUT, DELETE, PATCH)
  - **selectedMockFile**: Name of the mock response file (must exist in endpoint's mock directory)
  - **delayMillisecond**: Response delay in milliseconds (0-60000)
- **metadata**: Auto-generated tracking information
  - **createdAt**: ISO 8601 timestamp of scenario creation
  - **lastModified**: ISO 8601 timestamp of last modification
  - **version**: Incremental version number (starts at 1)

## Active Scenario Tracking

The `_active.json` file tracks which scenario is currently active:

```json
{
  "activeScenario": "testing",
  "lastUpdated": "2025-11-29T10:15:00.000Z"
}
```

- **activeScenario**: Name of the currently active scenario (or `null` if none)
- **lastUpdated**: ISO 8601 timestamp of when the active scenario was last changed

## How Scenarios Work

1. **Create**: Users create scenarios via the UI or API, defining endpoint configurations
2. **Save**: When saved, the scenario is persisted to `{name}.json`
3. **Apply**: The scenario's configurations are immediately applied to each endpoint's `status.json` file
4. **Activate**: The scenario becomes active and `_active.json` is updated
5. **Mock Behavior**: Configured endpoints return responses according to the active scenario

## File Management

- **Manual Editing**: Scenario files can be manually edited, but must follow the JSON schema
- **Version Control**: Scenario files should be committed to version control for team collaboration
- **Validation**: The system validates scenario files on load and reports errors
- **Conflicts**: If multiple scenarios are saved simultaneously, the last write wins

## Validation Rules

- Scenario names must be unique
- At least one endpoint configuration required per scenario
- No duplicate endpoints (same path + method) within a scenario
- All referenced mock files must exist in the endpoint's directory
- Delay values must be between 0 and 60000 milliseconds

## Examples

### Simple Scenario
```json
{
  "name": "happy-path",
  "endpointConfigurations": [
    {
      "path": "/pet/status",
      "method": "GET",
      "selectedMockFile": "success-200.json",
      "delayMillisecond": 0
    }
  ],
  "metadata": {
    "createdAt": "2025-11-29T10:00:00.000Z",
    "lastModified": "2025-11-29T10:00:00.000Z",
    "version": 1
  }
}
```

### Complex Scenario
```json
{
  "name": "error-testing",
  "endpointConfigurations": [
    {
      "path": "/pet/status",
      "method": "GET",
      "selectedMockFile": "error-500.json",
      "delayMillisecond": 2000
    },
    {
      "path": "/pet/findByTag/{tag}",
      "method": "GET",
      "selectedMockFile": "error-404.json",
      "delayMillisecond": 500
    },
    {
      "path": "/user/login",
      "method": "POST",
      "selectedMockFile": "invalid-credentials-401.json",
      "delayMillisecond": 1000
    }
  ],
  "metadata": {
    "createdAt": "2025-11-29T09:00:00.000Z",
    "lastModified": "2025-11-29T10:30:00.000Z",
    "version": 3
  }
}
```

## API Endpoints

Scenarios can be managed via the following API endpoints:

- `GET /_mock/scenarios` - List all scenarios
- `POST /_mock/scenarios` - Create new scenario
- `GET /_mock/scenarios/{name}` - Get specific scenario
- `PUT /_mock/scenarios/{name}` - Update scenario
- `DELETE /_mock/scenarios/{name}` - Delete scenario
- `GET /_mock/scenarios/active` - Get currently active scenario

See the OpenAPI specification at `specs/004-scenario-management/contracts/scenario-api.yaml` for complete API documentation.

## Troubleshooting

### Scenario Not Loading
- Verify JSON syntax is valid
- Check that all required fields are present
- Ensure scenario name matches filename (without .json extension)

### Mock Responses Not Applied
- Verify the scenario was saved successfully
- Check that `_active.json` points to the correct scenario
- Ensure referenced mock files exist in endpoint directories
- Verify endpoint `status.json` files were updated

### Validation Errors
- Check for duplicate endpoint configurations
- Verify delay values are within 0-60000 range
- Ensure scenario name uses only alphanumeric characters and hyphens
- Confirm at least one endpoint configuration exists

## References

- Feature Specification: `specs/004-scenario-management/spec.md`
- Data Model: `specs/004-scenario-management/data-model.md`
- API Contract: `specs/004-scenario-management/contracts/scenario-api.yaml`
- Implementation Guide: `specs/004-scenario-management/quickstart.md`
