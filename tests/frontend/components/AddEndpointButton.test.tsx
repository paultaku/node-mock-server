import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AddEndpointButton } from "../../../src/frontend/components/AddEndpointButton";

describe("AddEndpointButton", () => {
  it("should render the button", () => {
    const mockOnClick = jest.fn();
    render(<AddEndpointButton onClick={mockOnClick} />);

    expect(screen.getByRole("button", { name: /add endpoint/i })).toBeInTheDocument();
  });

  it("should call onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    render(<AddEndpointButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: /add endpoint/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should have proper styling classes", () => {
    const mockOnClick = jest.fn();
    const { container } = render(<AddEndpointButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: /add endpoint/i });
    expect(button).toHaveClass("btn");
  });
});
