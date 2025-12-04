import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScenarioCard } from "../../../../src/frontend/components/ScenarioManagement/ScenarioCard";
import {
  Scenario,
  HttpMethod,
} from "../../../../src/shared/types/scenario-types";

describe("ScenarioCard", () => {
  const mockScenario: Scenario = {
    name: "test-scenario",
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
  };

  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render scenario name", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("test-scenario")).toBeInTheDocument();
  });

  it("should render active badge when scenario is active", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={true}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should not render active badge when scenario is not active", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("should render view button", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const viewButton = screen.getByRole("button", { name: /view/i });
    expect(viewButton).toBeInTheDocument();
  });

  it("should render edit button", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it("should call onView when view button is clicked", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const viewButton = screen.getByRole("button", { name: /view/i });
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith("test-scenario");
  });

  it("should call onEdit when edit button is clicked", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith("test-scenario");
  });

  it("should display endpoint count", () => {
    render(
      <ScenarioCard
        scenario={mockScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/1 endpoint/i)).toBeInTheDocument();
  });

  it("should display multiple endpoints count correctly", () => {
    const multiEndpointScenario: Scenario = {
      ...mockScenario,
      endpointConfigurations: [
        ...mockScenario.endpointConfigurations,
        {
          path: "/pet/findByTag",
          method: HttpMethod.GET,
          selectedMockFile: "error-404.json",
          delayMillisecond: 0,
        },
      ],
    };

    render(
      <ScenarioCard
        scenario={multiEndpointScenario}
        isActive={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/2 endpoints/i)).toBeInTheDocument();
  });
});
