import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScenarioForm } from "../../../../src/frontend/components/ScenarioManagement/ScenarioForm";
import { Scenario, HttpMethod } from "../../../../src/shared/types/scenario-types";

describe("ScenarioForm", () => {
  const mockScenario: Scenario = {
    name: "test-scenario",
    endpointConfigurations: [
      {
        path: "/pet/status",
        method: HttpMethod.GET,
        selectedMockFile: "success-200.json",
        delayMillisecond: 1000,
      },
      {
        path: "/pet/findByTag",
        method: HttpMethod.GET,
        selectedMockFile: "error-404.json",
        delayMillisecond: 0,
      },
    ],
    metadata: {
      createdAt: "2025-11-29T10:00:00.000Z",
      lastModified: "2025-11-29T10:15:00.000Z",
      version: 1,
    },
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should render scenario name in view mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("test-scenario")).toBeInTheDocument();
    });

    it("should display endpoint configurations in read-only mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("/pet/status")).toBeInTheDocument();
      expect(screen.getByText("/pet/findByTag")).toBeInTheDocument();
      expect(screen.getByText("success-200.json")).toBeInTheDocument();
      expect(screen.getByText("error-404.json")).toBeInTheDocument();
    });

    it("should not show edit button in view mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    });

    it("should show close button in view mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("should call onCancel when close button is clicked", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edit Mode", () => {
    it("should render scenario name in edit mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("test-scenario")).toBeInTheDocument();
    });

    it("should show save and cancel buttons in edit mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should call onSave when save button is clicked", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when cancel button is clicked", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mode Toggle", () => {
    it("should allow switching from view to edit mode", () => {
      const { rerender } = render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();

      rerender(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  describe("Endpoint Configuration Display", () => {
    it("should display HTTP method for each endpoint", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const getMethods = screen.getAllByText("GET");
      expect(getMethods.length).toBeGreaterThanOrEqual(1);
    });

    it("should display delay for each endpoint", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Delay is formatted as "1.0 s" for >= 1000ms, or "X ms" for < 1000ms
      // Delay appears twice (in header and in details), so use getAllByText
      const delay1s = screen.getAllByText(/1\.0 s/i);
      expect(delay1s.length).toBeGreaterThanOrEqual(1);
      
      const delay0ms = screen.getAllByText(/0 ms/i);
      expect(delay0ms.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Remove Endpoint Configuration", () => {
    const mockOnRemove = jest.fn();

    it("should show remove button in edit mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("should not show remove button in view mode", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="view"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });

    it("should show confirmation dialog when remove button is clicked", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBeGreaterThan(0);
      fireEvent.click(removeButtons[0]!);

      expect(screen.getByText(/confirm removal/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it("should call onRemoveEndpoint when confirmed", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBeGreaterThan(0);
      fireEvent.click(removeButtons[0]!);

      // Find the Remove button in the dialog (should have bg-red-600 class)
      const allRemoveButtons = screen.getAllByRole("button", { name: /remove/i });
      const dialogRemoveButton = allRemoveButtons.find(btn => 
        btn.classList.contains('bg-red-600')
      );
      expect(dialogRemoveButton).toBeDefined();
      fireEvent.click(dialogRemoveButton!);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith("/pet/status", HttpMethod.GET);
    });

    it("should show warning when removing last endpoint", () => {
      const firstConfig = mockScenario.endpointConfigurations[0];
      expect(firstConfig).toBeDefined();
      const singleEndpointScenario: Scenario = {
        ...mockScenario,
        endpointConfigurations: [firstConfig!],
      };

      render(
        <ScenarioForm
          scenario={singleEndpointScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      const removeButton = screen.getByText("Remove");
      fireEvent.click(removeButton);

      expect(screen.getByText(/warning.*last endpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/scenario empty/i)).toBeInTheDocument();
      // Should not show remove button in dialog when it's the last endpoint
      // (only Cancel button should be present)
      const removeButtonsInDialog = screen.getAllByRole("button", { name: /remove/i });
      // Should only have the Remove button from the form, not from dialog
      expect(removeButtonsInDialog.length).toBe(1);
    });

    it("should close dialog when cancel is clicked", () => {
      render(
        <ScenarioForm
          scenario={mockScenario}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onRemoveEndpoint={mockOnRemove}
        />
      );

      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons.length).toBeGreaterThan(0);
      fireEvent.click(removeButtons[0]!);

      // Find the Cancel button in the dialog (should be in the dialog container)
      const dialog = screen.getByText(/confirm removal/i).closest('.bg-white');
      expect(dialog).toBeDefined();
      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      // Click the first Cancel button (in the dialog)
      fireEvent.click(cancelButtons[0]!);

      expect(screen.queryByText(/confirm removal/i)).not.toBeInTheDocument();
      expect(mockOnRemove).not.toHaveBeenCalled();
    });
  });
});

