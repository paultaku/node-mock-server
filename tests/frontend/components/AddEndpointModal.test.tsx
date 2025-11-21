import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AddEndpointModal } from "../../../src/frontend/components/AddEndpointModal";

describe("AddEndpointModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when open", () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByText(/add endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endpoint path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/http method/i)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <AddEndpointModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.queryByText(/add endpoint/i)).not.toBeInTheDocument();
  });

  it("should validate path on blur", async () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const pathInput = screen.getByLabelText(/endpoint path/i);

    // Enter invalid path
    fireEvent.change(pathInput, { target: { value: "invalid" } });
    fireEvent.blur(pathInput);

    await waitFor(() => {
      expect(screen.getByText(/must start with \//i)).toBeInTheDocument();
    });
  });

  it("should show error for invalid characters", async () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const pathInput = screen.getByLabelText(/endpoint path/i);

    fireEvent.change(pathInput, { target: { value: "/api/data:export" } });
    fireEvent.blur(pathInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*character/i)).toBeInTheDocument();
    });
  });

  it("should submit valid form", async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        endpoint: { path: "/users", method: "GET" },
      }),
    });

    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/endpoint path/i), {
      target: { value: "/users" },
    });
    fireEvent.change(screen.getByLabelText(/http method/i), {
      target: { value: "GET" },
    });

    // Submit
    fireEvent.click(screen.getByText(/create endpoint/i));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should allow closing the modal", () => {
    render(
      <AddEndpointModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
