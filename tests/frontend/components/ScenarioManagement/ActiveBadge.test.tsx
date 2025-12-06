import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ActiveBadge } from "../../../../src/frontend/components/ScenarioManagement/ActiveBadge";

describe("ActiveBadge", () => {
  it("should render the active badge with 'Active' text", () => {
    render(<ActiveBadge />);

    const badge = screen.getByText("Active");
    expect(badge).toBeInTheDocument();
  });

  it("should have green background color styling", () => {
    const { container } = render(<ActiveBadge />);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("bg-green-500");
  });

  it("should have proper text styling", () => {
    const { container } = render(<ActiveBadge />);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("text-white");
    expect(badge).toHaveClass("text-xs");
    expect(badge).toHaveClass("font-semibold");
  });

  it("should have rounded corners", () => {
    const { container } = render(<ActiveBadge />);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("rounded-full");
  });
});

