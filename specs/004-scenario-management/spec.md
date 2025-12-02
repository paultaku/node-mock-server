# Feature Specification: User Scenario Management

**Feature Branch**: `004-scenario-management`
**Created**: 2025-11-26
**Status**: Draft
**Input**: User description: "As a user, I would like to be able to create a user scenario including many api responses setup for existing mock api endpoints. For instance, I could create a scenario called "testing", which would let the api response of "/api/pet/status" return the content of the static json file "success-200.json" which located on the corresponding folder. And the api response of "/api/pet/findByTag/{tag}" return the content of the static json file "error-404.json" which located on the corresponding folder. As a user, I would like to add a new api endpoints setup on the ui by using selecting existing api endpoints, select the corresponding static file name for corresponding api response and enter the delay time by using a number input. The static file dropdown would updated as user switch the api endpoints. Don't use the CSV file import the scenario for now. And once the user save the scenario, it would create a scenario/{name}.json under the mock file folder path."

## Clarifications

### Session 2025-11-29

- Q: When a user saves a scenario with endpoint configurations (response files + delays), what should happen to the actual mock endpoints? → A: Immediately apply to live endpoints - Saving the scenario automatically updates all configured endpoints' status.json files to use the selected response files and delays
- Q: When a user tries to add the same endpoint (path + method) multiple times to a scenario, what should happen? → A: Prevent duplicates - Show an error message and prevent adding the endpoint if it already exists in the scenario
- Q: After a scenario is saved and applied to live endpoints, how should the UI indicate which scenario is currently active? → A: Visual active marker - Display an "Active" badge/indicator next to the most recently saved scenario in the scenario list
- Q: When a user tries to save a scenario that has no endpoint configurations (empty scenario), what should happen? → A: Prevent save with error - Display a validation error "Scenario must contain at least one endpoint configuration" and prevent saving
- Q: How should the system track which scenario is currently active (for displaying the "Active" badge)? → A: Separate metadata file - Create a scenario/_active.json file that stores the name of the currently active scenario

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Named Scenario (Priority: P1)

As a user, I want to create a new scenario by giving it a unique name, so I can organize and identify different testing configurations. For example, I can create a scenario called "testing" to configure specific mock responses across multiple endpoints that simulate a particular application state.

**Why this priority**: This is the foundation of the feature - users cannot create endpoint configurations without first creating a scenario. It provides the minimal viable functionality to start working with scenarios.

**Independent Test**: Can be fully tested by creating a scenario with a name, verifying the scenario appears in the UI, and checking that a `scenario/{name}.json` file is created in the mock folder. Delivers immediate value by allowing users to organize their mock configurations.

**Acceptance Scenarios**:

1. **Given** I am on the scenario management page, **When** I click "Create New Scenario" and enter "testing" as the scenario name, **Then** a new scenario named "testing" is created and appears in the scenario list
2. **Given** I have created a scenario named "testing", **When** I check the mock folder, **Then** a file `scenario/testing.json` exists in the mock directory
3. **Given** I attempt to create a scenario, **When** I enter an empty name or a name with special characters, **Then** I see a validation error message
4. **Given** I have a scenario named "testing", **When** I attempt to create another scenario with the same name, **Then** I see an error message indicating the name already exists

---

### User Story 2 - Configure Endpoint Responses in Scenario (Priority: P1)

As a user, I want to add endpoint configurations to my scenario by selecting existing endpoints, choosing their mock response files, and setting delay times, so I can define how each endpoint should behave in this specific test scenario.

**Why this priority**: This is the core functionality that makes scenarios useful. Without the ability to configure endpoint responses, a scenario is just an empty container. This provides immediate testing value.

**Independent Test**: Can be fully tested by creating a scenario, adding an endpoint configuration (selecting endpoint, response file, and delay), saving the scenario, and verifying the configuration is persisted in the JSON file. Delivers value by allowing users to define complete test scenarios.

**Acceptance Scenarios**:

1. **Given** I am editing a scenario, **When** I click "Add Endpoint Configuration", **Then** I see a form with dropdowns for endpoint selection, response file selection, and a number input for delay
2. **Given** I am adding an endpoint configuration, **When** I select endpoint "/pet/status" with method "GET", **Then** the response file dropdown updates to show only the available mock files for that endpoint (e.g., "success-200.json", "error-404.json")
3. **Given** I have selected an endpoint and response file, **When** I enter a delay value of 1000ms and save the configuration, **Then** the endpoint configuration is added to the scenario
4. **Given** I am adding an endpoint configuration, **When** I switch from endpoint "/pet/status" to "/pet/findByTag/{tag}", **Then** the response file dropdown updates to show the available mock files for the newly selected endpoint
5. **Given** I enter an invalid delay value (negative number or non-numeric), **When** I attempt to save, **Then** I see a validation error message
6. **Given** I have already added an endpoint to the scenario, **When** I attempt to add the same endpoint (path + method) again, **Then** I see an error message "This endpoint is already configured in this scenario" and the duplicate is not added

---

### User Story 3 - Save and Apply Scenario Configuration (Priority: P1)

As a user, I want to save my scenario configuration, so that all endpoint settings (selected response files and delays) are persisted to a JSON file and immediately applied to the live mock endpoints, allowing me to quickly switch between different testing states.

**Why this priority**: Without persistence and automatic application, scenarios cannot effectively change the system state for testing. This completes the core scenario creation workflow and makes the feature immediately useful.

**Independent Test**: Can be fully tested by creating a scenario with multiple endpoint configurations, saving it, verifying the `scenario/{name}.json` file contains the correct data structure, checking that all configured endpoints' `status.json` files are updated with the new response files and delays, and verifying the mock server returns the expected responses.

**Acceptance Scenarios**:

1. **Given** I have created a scenario with multiple endpoint configurations, **When** I click "Save Scenario", **Then** the scenario is saved to `mock/scenario/{name}.json` AND all configured endpoints' `status.json` files are updated with the selected response files and delays
2. **Given** I have saved a scenario, **When** I open the JSON file, **Then** it contains all endpoint configurations with path, method, selected mock file, and delay values
3. **Given** I have saved a scenario, **When** I make a request to a configured endpoint, **Then** the mock server returns the response from the file specified in the scenario with the configured delay
4. **Given** I have saved a scenario, **When** I reload the page and navigate to scenarios, **Then** my saved scenario appears in the list with all configurations intact
5. **Given** I am editing an existing scenario and make changes, **When** I click "Save Scenario", **Then** the existing scenario file is updated AND all endpoint `status.json` files are updated to reflect the new configuration
6. **Given** I have created a scenario with no endpoint configurations, **When** I click "Save Scenario", **Then** I see a validation error "Scenario must contain at least one endpoint configuration" and the scenario is not saved

---

### User Story 4 - View and Manage Existing Scenarios (Priority: P2)

As a user, I want to view a list of all my saved scenarios with a clear indication of which scenario is currently active, and select one to view or edit its configuration, so I can manage multiple test scenarios and understand the current system state.

**Why this priority**: While not essential for the initial creation workflow, this provides important usability for managing multiple scenarios. The active indicator helps users understand which scenario is currently affecting mock behavior.

**Independent Test**: Can be fully tested by creating multiple scenarios, saving one to make it active, viewing the scenario list with the active badge, selecting a scenario to view its details, and verifying all endpoint configurations are displayed correctly.

**Acceptance Scenarios**:

1. **Given** I have multiple saved scenarios, **When** I navigate to the scenario management page, **Then** I see a list of all scenarios with their names and an "Active" badge next to the most recently saved scenario
2. **Given** I see a list of scenarios, **When** I click on a scenario name, **Then** I see all endpoint configurations for that scenario
3. **Given** I am viewing a scenario, **When** I click "Edit", **Then** I can modify the endpoint configurations
4. **Given** I am viewing the scenario list, **When** no scenarios exist, **Then** I see a message prompting me to create my first scenario
5. **Given** I have saved scenario "A" (which is active), **When** I save scenario "B", **Then** the "Active" badge moves from scenario "A" to scenario "B"

---

### User Story 5 - Remove Endpoint Configuration from Scenario (Priority: P2)

As a user, I want to remove endpoint configurations from a scenario, so I can adjust my test setup by removing endpoints that are no longer needed for that particular test scenario.

**Why this priority**: This is a secondary management feature that improves usability but isn't critical for the initial workflow. Users can work around this by creating new scenarios or manually editing the JSON file.

**Independent Test**: Can be fully tested by creating a scenario with multiple endpoint configurations, removing one configuration, saving the scenario, and verifying the removed configuration no longer appears in the scenario or the JSON file.

**Acceptance Scenarios**:

1. **Given** I am editing a scenario with multiple endpoint configurations, **When** I click the "Remove" button next to an endpoint configuration, **Then** that configuration is removed from the scenario
2. **Given** I have removed an endpoint configuration, **When** I save the scenario, **Then** the removed configuration is not present in the saved JSON file
3. **Given** I am editing a scenario with one endpoint configuration, **When** I click "Remove", **Then** the configuration is removed and the scenario becomes empty

---

### User Story 6 - Delete Scenario (Priority: P3)

As a user, I want to delete entire scenarios that I no longer need, so I can keep my workspace organized and remove outdated test configurations.

**Why this priority**: This is a cleanup feature that's nice to have but not essential for core functionality. Users can manually delete scenario files if needed, and this doesn't block any primary workflows.

**Independent Test**: Can be fully tested by creating a scenario, deleting it from the UI, verifying it's removed from the scenario list, and confirming the JSON file is deleted from the mock folder.

**Acceptance Scenarios**:

1. **Given** I am viewing the scenario list, **When** I click "Delete" on a scenario and confirm the action, **Then** the scenario is removed from the list
2. **Given** I have deleted a scenario, **When** I check the mock folder, **Then** the `scenario/{name}.json` file no longer exists
3. **Given** I am about to delete a scenario, **When** the delete confirmation dialog appears, **Then** I can cancel the action to keep the scenario

---

### Edge Cases

- What happens when a user tries to add the same endpoint multiple times to a scenario? (System prevents duplicates and displays an error message: "This endpoint is already configured in this scenario")
- What happens when a user tries to save an empty scenario with no endpoint configurations? (System prevents save and displays validation error: "Scenario must contain at least one endpoint configuration")
- What happens when a user selects an endpoint that has no available mock response files? (Expected: Display a message indicating no response files are available and prevent adding the configuration)
- What happens when the scenario folder doesn't exist in the mock directory? (Expected: System should create the `scenario/` directory automatically when saving the first scenario)
- What happens when the `_active.json` file doesn't exist or is corrupted? (Expected: No scenario is marked as active, or system handles gracefully by showing no active indicator)
- What happens when a user tries to load a scenario file that has been manually corrupted or deleted? (Expected: Display an error message and remove the scenario from the list or mark it as invalid)
- What happens when a user enters a delay value exceeding the maximum allowed (60000ms)? (Expected: Show validation error or automatically cap the value at the maximum)
- What happens when a user saves a scenario while an endpoint has been deleted from the mock directory? (Expected: Either show a warning or automatically remove invalid endpoint configurations)
- What happens when two users try to create a scenario with the same name simultaneously? (Expected: File system will handle this atomically; second save will overwrite or fail depending on implementation)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to create a new scenario by providing a unique name
- **FR-002**: System MUST validate scenario names to ensure they are non-empty and do not contain invalid filename characters
- **FR-003**: System MUST prevent creating scenarios with duplicate names
- **FR-004**: System MUST provide a UI form to add endpoint configurations to a scenario
- **FR-005**: System MUST display a dropdown of all existing mock endpoints (path + method combinations) for selection
- **FR-006**: System MUST dynamically update the response file dropdown when a user selects a different endpoint
- **FR-007**: System MUST display only the available mock response files for the selected endpoint
- **FR-008**: System MUST provide a number input field for specifying response delay in milliseconds
- **FR-009**: System MUST validate delay values to ensure they are non-negative numbers within the allowed range (0-60000ms)
- **FR-010**: System MUST allow users to add multiple endpoint configurations to a single scenario
- **FR-025**: System MUST prevent duplicate endpoint configurations (same path + method) within a single scenario
- **FR-026**: System MUST display an error message when a user attempts to add a duplicate endpoint to a scenario
- **FR-011**: System MUST persist scenario configurations to a JSON file at `mock/scenario/{name}.json`
- **FR-030**: System MUST validate that a scenario contains at least one endpoint configuration before allowing it to be saved
- **FR-031**: System MUST display a validation error when attempting to save an empty scenario
- **FR-012**: System MUST create the `scenario/` directory within the mock folder if it doesn't exist
- **FR-013**: System MUST store each endpoint configuration with path, method, selected mock file, and delay value
- **FR-022**: System MUST automatically apply scenario configurations to live endpoints by updating each endpoint's `status.json` file when a scenario is saved
- **FR-023**: System MUST update the `selected` field in each endpoint's `status.json` to the mock file specified in the scenario
- **FR-024**: System MUST update the `delayMillisecond` field in each endpoint's `status.json` to the delay value specified in the scenario
- **FR-014**: System MUST display a list of all saved scenarios
- **FR-027**: System MUST display an "Active" badge or visual indicator next to the currently active scenario in the scenario list
- **FR-028**: System MUST track which scenario was most recently saved and mark it as the active scenario
- **FR-029**: System MUST update the active scenario indicator when a different scenario is saved
- **FR-032**: System MUST maintain a metadata file at `mock/scenario/_active.json` to track the currently active scenario name
- **FR-033**: System MUST update the `_active.json` file whenever a scenario is saved
- **FR-034**: System MUST read the `_active.json` file on application startup to determine which scenario is active
- **FR-015**: System MUST allow users to view the details of a saved scenario
- **FR-016**: System MUST allow users to edit existing scenarios
- **FR-017**: System MUST allow users to remove endpoint configurations from a scenario
- **FR-018**: System MUST allow users to delete entire scenarios
- **FR-019**: System MUST delete the corresponding JSON file when a scenario is deleted
- **FR-020**: System MUST load scenarios from JSON files when the application starts
- **FR-021**: System MUST handle scenarios that reference non-existent endpoints gracefully

### Key Entities _(include if feature involves data)_

- **Scenario**: Represents a named collection of endpoint configurations for testing purposes. Contains: scenario name, list of endpoint configurations, creation/modification metadata
- **Endpoint Configuration**: Represents a single endpoint's response behavior within a scenario. Contains: endpoint path, HTTP method, selected mock response file name, response delay in milliseconds
- **Mock Endpoint**: Represents an existing mock endpoint available in the system. Contains: endpoint path, HTTP method, list of available mock response files
- **Scenario File**: JSON file persisted to disk at `mock/scenario/{name}.json`. Contains: scenario name, array of endpoint configurations, and metadata (creation timestamp, last saved timestamp)
- **Active Scenario**: The scenario that was most recently saved and whose configuration is currently applied to the live mock endpoints
- **Active Scenario Metadata File**: JSON file at `mock/scenario/_active.json` that stores the name of the currently active scenario

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create and save a complete scenario with at least 5 endpoint configurations in under 3 minutes
- **SC-002**: The response file dropdown updates within 200ms when switching between endpoints
- **SC-003**: Scenario files are successfully persisted to the file system with correct JSON structure 100% of the time
- **SC-004**: Users can view and edit existing scenarios without data loss
- **SC-005**: All form validations provide clear error messages within 100ms of invalid input
- **SC-006**: Users can successfully load and display scenarios containing 20+ endpoint configurations without performance degradation
- **SC-007**: The scenario list displays all saved scenarios with 100% accuracy on page load
- **SC-008**: 95% of users can successfully create their first scenario without external help or documentation

## Assumptions

- The mock folder path is accessible and writable by the application
- Users are familiar with the existing endpoint management UI and understand endpoint paths and HTTP methods
- The existing endpoint structure (file system based with `status.json` files) remains unchanged
- Saving a scenario immediately applies its configuration to live endpoints by updating their `status.json` files
- Users understand that saving a scenario will change the current mock server behavior
- JSON file operations are synchronous and file system performance is acceptable for the number of scenarios expected (< 100)
- Browser local storage is not required; all data is persisted server-side as JSON files
- The feature does not require authentication or user-specific scenario isolation (all scenarios are shared)
- Only endpoints explicitly configured in a scenario are modified; other endpoints remain unchanged
