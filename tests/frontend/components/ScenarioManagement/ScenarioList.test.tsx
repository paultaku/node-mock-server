import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScenarioList } from "../../../../src/frontend/components/ScenarioManagement/ScenarioList";
import { Scenario, HttpMethod } from "../../../../src/shared/types/scenario-types";

describe("ScenarioList", () => {
  const mockScenarios: Scenario[] = [
    {
      name: "scenario-1",
      endpointConfigurations: [
        {
          path: "/pet/status",
          method: HttpMethod.GET,
          selectedMockFile: "success-200.json",
          delayMillisecond: 1000,
        },
      ],
      metadata: {
        createdAt: "2025-11-29T10:00:00.000Z",
        lastModified: "2025-11-29T10:15:00.000Z",
        version: 1,
      },
    },
    {
      name: "scenario-2",
      endpointConfigurations: [
        {
          path: "/pet/findByTag",
          method: HttpMethod.GET,
          selectedMockFile: "error-404.json",
          delayMillisecond: 0,
        },
      ],
      metadata: {
        createdAt: "2025-11-29T09:00:00.000Z",
        lastModified: "2025-11-29T09:00:00.000Z",
        version: 1,
      },
    },
  ];

  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all scenario cards", () => {
    render(
      <ScenarioList
        scenarios={mockScenarios}
        activeScenario="scenario-1"
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText("scenario-1")).toBeInTheDocument();
    expect(screen.getByText("scenario-2")).toBeInTheDocument();
  });

  it("should render empty state when no scenarios", () => {
    render(
      <ScenarioList
        scenarios={[]}
        activeScenario={null}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText(/no scenarios found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/create your first scenario to get started/i)
    ).toBeInTheDocument();
  });

  it("should pass isActive prop correctly to cards", () => {
    render(
      <ScenarioList
        scenarios={mockScenarios}
        activeScenario="scenario-1"
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    // scenario-1 should have active badge
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should not show active badge when activeScenario is null", () => {
    render(
      <ScenarioList
        scenarios={mockScenarios}
        activeScenario={null}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("should render scenarios in a grid layout", () => {
    const { container } = render(
      <ScenarioList
        scenarios={mockScenarios}
        activeScenario={null}
        onView={mockOnView}
        onEdit={mockOnEdit}
      />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("gap-6");
  });
});

