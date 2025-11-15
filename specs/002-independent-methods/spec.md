# Feature Specification: Independent PUT and DELETE Method Statistics

**Feature Branch**: `002-independent-methods`
**Created**: 2025-11-15
**Status**: Draft
**Input**: User description: "I would like the PUT and DELETE method would be calcluated independently."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Separate PUT Statistics (Priority: P1)

As a developer using the mock server, I want to see how many PUT endpoints I have configured separately from other methods, so I can quickly understand the distribution of my REST API operations.

**Why this priority**: This is the core value proposition - developers need visibility into their API composition. PUT operations often represent update operations, and seeing this metric separately helps with API design decisions.

**Independent Test**: Can be fully tested by creating mock endpoints with PUT methods and verifying the statistics dashboard displays a dedicated "PUT Requests" card with the correct count, independent of other method counts.

**Acceptance Scenarios**:

1. **Given** a mock server with 2 GET, 3 POST, 1 PUT, and 0 DELETE endpoints, **When** I view the statistics dashboard, **Then** I see a card showing "1" PUT request with appropriate label
2. **Given** a mock server with multiple PUT endpoints (e.g., 5), **When** I view the statistics dashboard, **Then** the PUT count accurately reflects 5, not combined with any other method
3. **Given** a mock server with no PUT endpoints, **When** I view the statistics dashboard, **Then** I see a PUT card showing "0"

---

### User Story 2 - View Separate DELETE Statistics (Priority: P1)

As a developer using the mock server, I want to see how many DELETE endpoints I have configured separately from other methods, so I can verify my API includes proper deletion capabilities.

**Why this priority**: Equal priority to PUT since both are required for complete independence. DELETE operations are critical for CRUD completeness, and having separate visibility ensures developers don't overlook deletion endpoints.

**Independent Test**: Can be fully tested by creating mock endpoints with DELETE methods and verifying the statistics dashboard displays a dedicated "DELETE Requests" card with the correct count, independent of other method counts.

**Acceptance Scenarios**:

1. **Given** a mock server with 2 GET, 3 POST, 0 PUT, and 2 DELETE endpoints, **When** I view the statistics dashboard, **Then** I see a card showing "2" DELETE requests with appropriate label
2. **Given** a mock server with multiple DELETE endpoints (e.g., 7), **When** I view the statistics dashboard, **Then** the DELETE count accurately reflects 7, not combined with any other method
3. **Given** a mock server with no DELETE endpoints, **When** I view the statistics dashboard, **Then** I see a DELETE card showing "0"

---

### User Story 3 - Compare Method Distribution (Priority: P2)

As a developer reviewing my mock API design, I want to see all HTTP methods displayed as separate statistics cards in a consistent layout, so I can quickly compare the distribution of different operation types across my API.

**Why this priority**: Enhances the value of independent display by providing a holistic view. Helps developers identify API design patterns and potential gaps (e.g., "I have lots of GETs but no DELETEs").

**Independent Test**: Can be fully tested by creating a diverse set of endpoints (GET, POST, PUT, DELETE, PATCH) and verifying all methods are displayed consistently with clear visual hierarchy and equal prominence.

**Acceptance Scenarios**:

1. **Given** a mock server with endpoints using GET, POST, PUT, DELETE, and PATCH methods, **When** I view the statistics dashboard, **Then** each method has its own card with consistent styling and layout
2. **Given** a statistics dashboard displaying all method types, **When** I scan the cards visually, **Then** PUT and DELETE cards have the same visual weight and prominence as GET and POST cards
3. **Given** multiple method statistics displayed, **When** I add or remove endpoints, **Then** only the affected method card(s) update their counts

---

### Edge Cases

- What happens when a mock server has zero endpoints of any type? (All method cards should show "0")
- How does the dashboard handle a very large number of endpoints for a single method (e.g., 999+ PUT requests)? (Display should not break or overflow)
- What happens if new HTTP methods are added in the future (e.g., CONNECT, TRACE)? (System should gracefully handle additional methods without breaking PUT/DELETE display)
- How does the UI adapt when there are more method types than can fit in a single row? (Cards should wrap or scroll appropriately)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display PUT request count as a separate statistic card on the dashboard
- **FR-002**: System MUST display DELETE request count as a separate statistic card on the dashboard
- **FR-003**: System MUST calculate PUT statistics by counting only endpoints with method type "PUT"
- **FR-004**: System MUST calculate DELETE statistics by counting only endpoints with method type "DELETE"
- **FR-005**: PUT and DELETE statistics MUST NOT be combined or aggregated together in any display
- **FR-006**: PUT statistic card MUST be visually consistent with other method statistic cards (GET, POST)
- **FR-007**: DELETE statistic card MUST be visually consistent with other method statistic cards (GET, POST)
- **FR-008**: System MUST update PUT count in real-time when PUT endpoints are added or removed
- **FR-009**: System MUST update DELETE count in real-time when DELETE endpoints are added or removed
- **FR-010**: Each method statistic card MUST clearly label which HTTP method it represents

### Key Entities

- **Statistic Card**: Visual component displaying a single HTTP method's endpoint count, including the numeric count, method label, and consistent styling
- **Method Statistics**: Collection of endpoint counts grouped by HTTP method (GET, POST, PUT, DELETE, PATCH, etc.), where each method has an independent count

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view PUT endpoint count as a separate statistic within 1 second of loading the dashboard
- **SC-002**: Users can view DELETE endpoint count as a separate statistic within 1 second of loading the dashboard
- **SC-003**: Dashboard displays at least 5 separate method statistic cards (GET, POST, PUT, DELETE, and at least one other method like PATCH)
- **SC-004**: 100% of PUT endpoints are counted only in the PUT statistic (no double-counting or omissions)
- **SC-005**: 100% of DELETE endpoints are counted only in the DELETE statistic (no double-counting or omissions)
- **SC-006**: Users can distinguish between PUT and DELETE counts without reading labels (through consistent visual hierarchy and separation)
- **SC-007**: Statistics update within 500ms when mock endpoints are added or removed

## Assumptions *(optional)*

- The existing `Stats` interface already has separate `put` and `delete` properties, so the data layer supports independent tracking
- Backend systems already treat PUT and DELETE as independent HTTP methods (confirmed in codebase analysis)
- The primary change required is in the frontend statistics display component
- Users expect statistics dashboard to follow standard web dashboard conventions (card-based layout, numeric emphasis)
- The frontend framework (React/TypeScript based on codebase) supports component-based architecture for creating separate statistic cards

## Dependencies *(optional)*

- Existing Stats component must be refactored to display separate cards instead of combined PUT/DELETE card
- Stats data structure already provides independent `put` and `delete` counts (no backend changes needed)
- No external library or API dependencies required for this feature

## Out of Scope

- Historical tracking or trending of method statistics over time
- Advanced analytics or reporting features for endpoint usage
- Changing how methods are processed or handled in the backend (already independent)
- Adding new HTTP methods beyond those already supported
- Filtering or sorting endpoints by method type in other views
- Exporting statistics data to external formats
