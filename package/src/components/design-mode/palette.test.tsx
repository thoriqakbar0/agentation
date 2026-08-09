import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComponentGrid } from "./palette";

function renderComponentGrid() {
  return render(
    <ComponentGrid
      activeType={null}
      onSelect={vi.fn()}
      onDragStart={vi.fn()}
    />
  );
}

describe("ComponentGrid search", () => {
  it("filters components by label while preserving matching sections", () => {
    renderComponentGrid();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "card" } });

    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Product Card")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Blocks")).toBeTruthy();
    expect(screen.queryByText("Navigation")).toBeNull();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("matches category names without flattening their components", () => {
    renderComponentGrid();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "layout" } });

    expect(screen.getByText("Layout")).toBeTruthy();
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(screen.getByText("Sidebar")).toBeTruthy();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("shows a recoverable empty state", () => {
    renderComponentGrid();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "nonexistent component" } });

    expect(screen.getByText(/No components found for/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(document.activeElement).toBe(search);
  });

  it("clears the query with Escape before the event reaches Layout Mode", () => {
    renderComponentGrid();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "button" } });
    fireEvent.keyDown(search, { key: "Escape" });

    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(document.activeElement).toBe(search);
  });
});
