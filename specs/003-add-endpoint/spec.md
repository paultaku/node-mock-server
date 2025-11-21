# Feature Specification: Add Endpoint UI

**Feature Branch**: `003-add-endpoint`
**Created**: 2025-11-15
**Status**: Draft
**Input**: User description: "As a developer, I would like to add a add a new endpoint. User click the button, and user would be able add a single api end point for testing on backend and frontend."

## Clarifications

### Session 2025-11-15

- Q: What should the default JSON template files (`success-200.json`, `unexpected-error-default.json`) contain? → A: Minimal placeholder with status message - `{"status": "success", "message": "Mock response"}` for success, `{"status": "error", "message": "Unexpected error"}` for error
- Q: How should path parameters like `/pet/status/{id}` be handled in the file system and when matching requests? → A: Preserve curly braces in folder names and match any value at runtime - folder structure mirrors the path exactly
- Q: How should paths with invalid file system characters (e.g., `/api/data:export`, `/api/file|upload`) be handled? → A: Reject with error - validate path on form submission and show error message listing invalid characters
- Q: How should concurrent endpoint creation (multiple users/tabs creating the same endpoint simultaneously) be handled? → A: First write wins with locking - use file system locks/atomic operations, second request gets duplicate error
- Q: When should form validation feedback appear to the user? → A: Validation on blur (field loses focus) with final check on submit - feedback appears when user moves to next field

## User Scenarios & Testing

### User Story 1 - Manual Endpoint Creation via UI (Priority: P1)

As a developer using the mock server, I want to click a button on the dashboard to add a new API endpoint so that I can quickly create test endpoints without manually editing configuration files or using the CLI.

**Why this priority**: This is the core functionality requested. It provides immediate value by enabling visual endpoint creation, which is faster and more intuitive than manual configuration. This can be implemented and tested independently of any other enhancements.

**Independent Test**: Can be fully tested by opening the dashboard, clicking the "Add Endpoint" button, filling in endpoint details (path, method, response), and verifying the endpoint is immediately available for API calls. Delivers standalone value as a quick endpoint creation tool.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** I click the "Add Endpoint" button, **Then** a form/modal appears allowing me to input endpoint details
2. **Given** the add endpoint form is open, **When** I enter a valid path (e.g., `/api/users`), select an HTTP method (e.g., GET), and provide a response body, **Then** the endpoint is created and immediately available for testing
3. **Given** a new endpoint has been created, **When** I make an API call to that endpoint, **Then** it returns the configured response
4. **Given** the add endpoint form is open, **When** I click cancel or close, **Then** the form closes without creating an endpoint

---

### User Story 2 - Endpoint Validation and Error Handling (Priority: P2)

As a developer, I want the system to validate my endpoint configuration before creation so that I don't create invalid or duplicate endpoints that could cause confusion or errors.

**Why this priority**: Prevents common mistakes and improves user experience, but the core functionality (US1) can work without it. Users can still create endpoints; they just won't get validation feedback until this is implemented.

**Independent Test**: Can be tested by attempting to create endpoints with invalid data (empty paths, duplicate paths, invalid HTTP methods, malformed JSON responses) and verifying appropriate error messages are shown.

**Acceptance Scenarios**:

1. **Given** the add endpoint form is open, **When** I try to create an endpoint with an empty path, **Then** an error message appears indicating the path is required
2. **Given** an endpoint `/api/test` already exists, **When** I try to create another endpoint with the same path and method, **Then** an error message warns about the duplicate
3. **Given** the add endpoint form is open, **When** I enter an invalid JSON response body, **Then** an error message indicates the JSON is malformed
4. **Given** the add endpoint form is open, **When** I select an invalid HTTP method or path format, **Then** appropriate validation messages guide me to correct input

---

### User Story 3 - Endpoint Persistence and Management (Priority: P3)

As a developer, I want endpoints created through the UI to persist across server restarts so that I don't lose my test configuration when the server stops.

**Why this priority**: Enhances usability for long-term testing scenarios, but not critical for initial testing workflows. Developers can recreate endpoints quickly with US1, so persistence is a convenience feature rather than a requirement.

**Independent Test**: Can be tested by creating endpoints via the UI, restarting the mock server, and verifying the endpoints still exist and function correctly after restart.

**Acceptance Scenarios**:

1. **Given** I have created 3 endpoints via the UI, **When** I restart the mock server, **Then** all 3 endpoints are still available and functional
2. **Given** endpoints are persisted to storage, **When** I view the dashboard after restart, **Then** all previously created endpoints are displayed in the endpoint list
3. **Given** the server is running, **When** I create a new endpoint, **Then** it is immediately saved to persistent storage (configuration file or database)

---

### Edge Cases

- **Path parameters**: Endpoints with path parameters (e.g., `/pet/status/{id}`) are supported - the folder structure preserves curly braces literally (e.g., `<mock-root>/pet/status/{id}/GET/`), and the server matches any value at runtime for the parameterized segment
- How does the system handle creating an endpoint with query parameters in the path (e.g., `/api/search?query=test`)?
- What happens if the file system directory creation fails due to insufficient permissions or disk space?
- **Concurrent creation**: When multiple users/tabs attempt to create the same endpoint simultaneously, the system uses file system locks or atomic operations to ensure only the first request succeeds; subsequent requests receive a duplicate endpoint error
- What happens if the default JSON template files (`success-200.json`, `unexpected-error-default.json`) fail to generate?
- How does the system behave if the `status.json` file cannot be written or read?
- **Invalid file system characters**: Paths containing characters invalid for file system folder names (e.g., `:`, `|`, `<`, `>`, `"`, `*`, `?`) are rejected during validation with a clear error message listing the invalid characters found
- How does the system handle very deep endpoint paths (e.g., `/level1/level2/level3/.../level20`)?
- What happens when an endpoint path conflicts with existing static routes or system endpoints?
- What happens if a user tries to create a mock endpoint with a path starting with `/_mock/` (which is reserved for mock server management)?
- How does the system handle endpoint creation when the mock server is restarting or in maintenance mode?
- What happens if a user tries to create an endpoint with an extremely long path (exceeding file system path length limits)?
- What happens if the mock root directory doesn't exist or is misconfigured?

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a visible "Add Endpoint" button on the dashboard UI
- **FR-002**: System MUST display a form or modal when the "Add Endpoint" button is clicked
- **FR-003**: Form MUST provide a text input field for users to specify the endpoint path (e.g., `/pet/status/{id}`)
- **FR-004**: Form MUST provide a dropdown or selection input for users to select an HTTP method (GET, POST, PUT, DELETE, PATCH)
- **FR-005**: Backend MUST automatically generate default JSON response templates when an endpoint is created:
  - A success response file named `success-200.json` containing `{"status": "success", "message": "Mock response"}`
  - An error response file named `unexpected-error-default.json` containing `{"status": "error", "message": "Unexpected error"}`
- **FR-006**: System MUST store all mock endpoint files under a specific root folder that the mock server reads from (the mock endpoint storage directory)
- **FR-007**: System MUST create a folder structure within the mock root directory that mirrors the endpoint path and HTTP method exactly, including preserving curly braces for path parameters (e.g., `<mock-root>/pet/status/{id}/GET/` for endpoint `/pet/status/{id}`)
- **FR-008**: System MUST generate a `status.json` file in each endpoint folder to track the current status of the endpoint
- **FR-009**: System MUST expose a backend API endpoint with the `/_mock/` prefix for creating new mock endpoints (e.g., `/_mock/endpoints/create` or `/_mock/create-endpoint`)
- **FR-010**: The `/_mock/` API endpoint MUST accept endpoint creation requests from the dashboard form
- **FR-011**: System MUST create the endpoint on the backend server immediately upon form submission
- **FR-012**: System MUST make the newly created endpoint available for API calls within 1 second of creation
- **FR-013**: Form MUST perform validation on field blur events (when user moves to next field) and display feedback within 500ms, with final validation performed on form submission
- **FR-014**: System MUST validate that the endpoint path is not empty
- **FR-015**: System MUST validate that the endpoint path starts with a forward slash (/)
- **FR-016**: System MUST validate that the endpoint path does not contain characters invalid for file system folder names (reject paths containing `:`, `|`, `<`, `>`, `"`, `*`, `?` and display specific error message)
- **FR-017**: System MUST prevent duplicate endpoints (same path and method combination) using atomic file system operations or locking mechanisms to handle concurrent creation attempts
- **FR-018**: System MUST display success feedback when an endpoint is successfully created
- **FR-019**: System MUST display error feedback when endpoint creation fails
- **FR-020**: System MUST refresh the endpoint list on the dashboard to show the newly created endpoint
- **FR-021**: Backend MUST read the `status.json` file to determine the current operational status of each endpoint
- **FR-022**: System MUST persist all created endpoints as static files and folders in the file system, ensuring they survive server restarts
- **FR-023**: Form MUST provide a cancel/close option that dismisses the form without creating an endpoint

### Key Entities

- **Endpoint**: Represents a mock API endpoint with attributes:
  - Path (e.g., `/pet/status/{id}`)
  - HTTP method (GET, POST, PUT, DELETE, PATCH)
  - File system location (folder path mirroring the endpoint structure)
  - Status tracking (via `status.json` file)
  - Response templates (default `success-200.json` and `unexpected-error-default.json`)

- **Endpoint Folder Structure**: Represents the physical file organization for an endpoint:
  - Base path matching the API path (e.g., `/pet/status/{id}/`)
  - HTTP method subfolder (e.g., `GET/`, `POST/`)
  - Response files:
    - `success-200.json` - Default successful response
    - `unexpected-error-default.json` - Default error response
    - `status.json` - Endpoint operational status and configuration

- **Endpoint Configuration Form**: Represents the user input for creating an endpoint:
  - Endpoint path (text input)
  - HTTP method (dropdown selection)
  - No response body input required (auto-generated default templates)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developers can create a new endpoint in under 30 seconds from clicking the button to having a functional API endpoint
- **SC-002**: The newly created endpoint responds to API calls within 1 second of creation
- **SC-003**: The endpoint creation form validates input and provides feedback within 500ms when a field loses focus (blur event), with final validation on form submission
- **SC-004**: 95% of endpoint creation attempts complete successfully without errors (assuming valid input)
- **SC-005**: Developers can create at least 50 endpoints without performance degradation on the dashboard
- **SC-006**: The endpoint creation workflow requires no more than 3 clicks (open form, fill form, submit)
- **SC-007**: Error messages are clear and actionable, reducing user confusion by providing specific guidance on how to fix validation errors

## Assumptions

- **Assumption 1**: The dashboard already has infrastructure for displaying buttons and forms (based on existing Stats component and UI structure)
- **Assumption 2**: The backend server has a pre-configured root directory for storing all mock endpoint files and folders (the mock storage root)
- **Assumption 3**: All mock endpoint files and folders are created within this designated root directory, not elsewhere in the file system
- **Assumption 4**: The backend server can dynamically create folders and files within the mock root directory at runtime
- **Assumption 5**: The backend server supports dynamic endpoint registration by reading the file system structure from the mock root directory
- **Assumption 6**: The `/_mock/` API endpoint prefix is reserved for mock server management operations and will not conflict with user-created mock endpoints
- **Assumption 7**: Users creating endpoints through the UI are authenticated developers with appropriate permissions
- **Assumption 8**: Endpoints created are intended for testing/development purposes, not production use
- **Assumption 9**: The system already has a mechanism for tracking and displaying existing endpoints (endpoint list on dashboard)
- **Assumption 10**: Default JSON templates use minimal placeholder structure with status and message fields, allowing easy customization for specific test scenarios
- **Assumption 11**: The `status.json` file format is already defined in the existing system (or will follow existing patterns)
- **Assumption 12**: The file system has sufficient permissions to create directories and files in the mock root storage location

## Out of Scope

The following are explicitly NOT part of this feature:

- **Bulk endpoint creation**: Creating multiple endpoints at once from a file or batch input
- **Endpoint editing**: Modifying existing endpoints (separate feature)
- **Endpoint deletion**: Removing endpoints through the UI (separate feature)
- **Advanced endpoint features**: Request validation, dynamic responses based on request parameters, response delays, error simulation
- **Endpoint templates**: Pre-defined endpoint templates for common use cases
- **Import/Export**: Importing endpoints from Swagger/OpenAPI specs or exporting endpoint configurations
- **Endpoint versioning**: Tracking changes to endpoint configurations over time
- **Access control**: Role-based permissions for endpoint creation
- **Endpoint testing tools**: Built-in tools to test the endpoint directly from the UI (can use external tools like Postman)
