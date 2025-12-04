import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CreateScenarioModal } from "../../../../src/frontend/components/ScenarioManagement/CreateScenarioModal";
import { Endpoint } from "../../../../src/frontend/types";

describe("CreateScenarioModal", () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();
  const mockFetchEndpoints = jest.fn();

  const mockEndpoints: Endpoint[] = [
    {
      path: "/pet/status",
      method: "GET",
      currentMock: "success-200.json",
      availableMocks: ["success-200.json", "error-404.json", "error-500.json"],
      delayMillisecond: 0,
    },
    {
      path: "/user/login",
      method: "POST",
      currentMock: "success-200.json",
      availableMocks: ["success-200.json", "error-401.json"],
      delayMillisecond: 0,
    },
    {
      path: "/product/search",
      method: "GET",
      currentMock: "success-200.json",
      availableMocks: ["success-200.json"],
      delayMillisecond: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Modal Visibility", () => {
    it("should not render when isOpen is false", () => {
      render(
        <CreateScenarioModal
          isOpen={false}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      expect(
        screen.queryByText("Create New Scenario")
      ).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      expect(screen.getByText("Create New Scenario")).toBeInTheDocument();
      expect(screen.getByLabelText("Scenario Name")).toBeInTheDocument();
      expect(screen.getByText("Add Endpoint Configuration")).toBeInTheDocument();
    });
  });

  describe("Endpoint Fetching", () => {
    it("should fetch endpoints when modal opens with no endpoints", () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={[]}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      expect(mockFetchEndpoints).toHaveBeenCalled();
    });

    it("should not fetch endpoints when modal opens with endpoints already available", () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      expect(mockFetchEndpoints).not.toHaveBeenCalled();
    });
  });

  describe("Scenario Name Validation", () => {
    it("should show validation error for empty scenario name", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Submit button should be disabled when no endpoints added
      const submitButton = screen.getByText("Create Scenario");
      expect(submitButton).toBeDisabled();

      // Add an endpoint first
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Submit button should still be disabled when scenario name is empty
      const submitButtonWithEndpoint = screen.getByText("Create Scenario (1 endpoint)");
      expect(submitButtonWithEndpoint).toBeDisabled();
    });

    it("should show validation error for scenario name less than 3 characters", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "ab" } });

      // Add an endpoint first
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /Create Scenario \(1 endpoint\)/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Scenario name must be at least 3 characters")
        ).toBeInTheDocument();
      });

      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it("should show validation error for invalid scenario name characters", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "test scenario!" } });

      // Add an endpoint first
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /Create Scenario \(1 endpoint\)/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Scenario name can only contain letters, numbers, hyphens, and underscores"
          )
        ).toBeInTheDocument();
      });

      expect(mockOnCreate).not.toHaveBeenCalled();
    });
  });

  describe("Endpoint Configuration", () => {
    it("should show mock file selector when endpoint is selected", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(
          screen.getByLabelText("Mock Response File")
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Response Delay (ms)")).toBeInTheDocument();
    });

    it("should auto-select first mock file when endpoint is selected", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        const mockFileSelect = screen.getByLabelText(
          "Mock Response File"
        ) as HTMLSelectElement;
        expect(mockFileSelect.value).toBe("success-200.json");
      });
    });

    it("should disable add button when no endpoint is selected", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const addButton = screen.getByText("Add Endpoint");
      expect(addButton).toBeDisabled();
    });

    it("should show validation error for negative delay", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Response Delay (ms)")).toBeInTheDocument();
      });

      const delayInput = screen.getByLabelText("Response Delay (ms)");
      fireEvent.change(delayInput, { target: { value: "-100" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Delay cannot be negative")).toBeInTheDocument();
      });
    });

    it("should show validation error for delay exceeding 60000ms", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Response Delay (ms)")).toBeInTheDocument();
      });

      const delayInput = screen.getByLabelText("Response Delay (ms)");
      fireEvent.change(delayInput, { target: { value: "70000" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Delay cannot exceed 60000ms (60 seconds)")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Multi-Endpoint Functionality", () => {
    it("should add endpoint to configuration list", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
        expect(screen.getByText("GET")).toBeInTheDocument();
        expect(screen.getByText("/pet/status")).toBeInTheDocument();
      });
    });

    it("should add multiple endpoints to configuration list", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      let addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Add second endpoint
      fireEvent.change(endpointSelect, { target: { value: "1" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(2\)/)).toBeInTheDocument();
        expect(screen.getByText("/pet/status")).toBeInTheDocument();
        expect(screen.getByText("/user/login")).toBeInTheDocument();
      });
    });

    it("should remove endpoint from configuration list", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Remove endpoint
      const removeButton = screen.getByLabelText("Remove endpoint");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Endpoint Configurations/)
        ).not.toBeInTheDocument();
      });
    });

    it("should detect and prevent duplicate endpoint", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      let addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Try to add same endpoint again
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Endpoint GET /pet/status is already added")
        ).toBeInTheDocument();
      });

      // Should still have only 1 endpoint
      expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
    });

    it("should disable already-added endpoints in dropdown", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint") as HTMLSelectElement;
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Check if the added endpoint option is disabled
      const option = Array.from(endpointSelect.options).find(
        (opt) => opt.value === "0"
      );
      expect(option?.disabled).toBe(true);
      expect(option?.textContent).toContain("(already added)");
    });

    it("should reset form fields after adding endpoint", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Select endpoint and set delay
      const endpointSelect = screen.getByLabelText("Endpoint") as HTMLSelectElement;
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Response Delay (ms)")).toBeInTheDocument();
      });

      let delayInput = screen.getByLabelText("Response Delay (ms)") as HTMLInputElement;
      fireEvent.change(delayInput, { target: { value: "1000" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Check that endpoint select is reset
      expect(endpointSelect.value).toBe("");

      // Delay input field should not be visible anymore (since no endpoint is selected)
      expect(screen.queryByLabelText("Response Delay (ms)")).not.toBeInTheDocument();
    });

    it("should disable submit button when no endpoints are added", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "test-scenario" } });

      const submitButton = screen.getByText("Create Scenario");

      // Submit button should be disabled when no endpoints are added
      expect(submitButton).toBeDisabled();
    });

    it("should display endpoint count in submit button", async () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      // Initially should show just "Create Scenario"
      expect(screen.getByText("Create Scenario")).toBeInTheDocument();

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      let addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Create Scenario (1 endpoint)")).toBeInTheDocument();
      });

      // Add second endpoint
      fireEvent.change(endpointSelect, { target: { value: "1" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Create Scenario (2 endpoints)")).toBeInTheDocument();
      });
    });
  });

  describe("Scenario Creation", () => {
    it("should call onCreate with single endpoint configuration", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "test-scenario" } });

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Response Delay (ms)")).toBeInTheDocument();
      });

      const mockFileSelect = screen.getByLabelText("Mock Response File");
      fireEvent.change(mockFileSelect, { target: { value: "error-404.json" } });

      const delayInput = screen.getByLabelText("Response Delay (ms)");
      fireEvent.change(delayInput, { target: { value: "1000" } });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Scenario (1 endpoint)");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith({
          name: "test-scenario",
          endpointConfigurations: [
            {
              path: "/pet/status",
              method: "GET",
              selectedMockFile: "error-404.json",
              delayMillisecond: 1000,
            },
          ],
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onCreate with multiple endpoint configurations", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "multi-endpoint-scenario" } });

      // Add first endpoint
      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      let mockFileSelect = screen.getByLabelText("Mock Response File");
      fireEvent.change(mockFileSelect, { target: { value: "error-500.json" } });

      let delayInput = screen.getByLabelText("Response Delay (ms)");
      fireEvent.change(delayInput, { target: { value: "2000" } });

      let addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      // Add second endpoint
      fireEvent.change(endpointSelect, { target: { value: "1" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      mockFileSelect = screen.getByLabelText("Mock Response File");
      fireEvent.change(mockFileSelect, { target: { value: "error-401.json" } });

      delayInput = screen.getByLabelText("Response Delay (ms)");
      fireEvent.change(delayInput, { target: { value: "500" } });

      addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(2\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Scenario (2 endpoints)");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith({
          name: "multi-endpoint-scenario",
          endpointConfigurations: [
            {
              path: "/pet/status",
              method: "GET",
              selectedMockFile: "error-500.json",
              delayMillisecond: 2000,
            },
            {
              path: "/user/login",
              method: "POST",
              selectedMockFile: "error-401.json",
              delayMillisecond: 500,
            },
          ],
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should reset form after successful creation", async () => {
      mockOnCreate.mockResolvedValue(undefined);

      const { rerender } = render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "test-scenario" } });

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Scenario (1 endpoint)");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });

      // Reopen modal to check if form is reset
      rerender(
        <CreateScenarioModal
          isOpen={false}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      rerender(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const newNameInput = screen.getByLabelText("Scenario Name") as HTMLInputElement;
      expect(newNameInput.value).toBe("");
      expect(
        screen.queryByText(/Endpoint Configurations/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Modal Interaction", () => {
    it("should call onClose when close button is clicked", () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when cancel button is clicked", () => {
      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should disable form controls during submission", async () => {
      mockOnCreate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <CreateScenarioModal
          isOpen={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          availableEndpoints={mockEndpoints}
          fetchEndpoints={mockFetchEndpoints}
        />
      );

      const nameInput = screen.getByLabelText("Scenario Name");
      fireEvent.change(nameInput, { target: { value: "test-scenario" } });

      const endpointSelect = screen.getByLabelText("Endpoint");
      fireEvent.change(endpointSelect, { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Mock Response File")).toBeInTheDocument();
      });

      const addButton = screen.getByText("Add Endpoint");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Endpoint Configurations \(1\)/)).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Scenario (1 endpoint)");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Creating...")).toBeInTheDocument();
      });
    });
  });
});
