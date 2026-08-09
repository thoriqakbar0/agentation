import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, describe, expect, it, vi } from "vitest";
import { ComponentPicker } from "./palette";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
afterAll(() => vi.unstubAllGlobals());

const EXPECTED_COMPONENT_COUNT = 66;

function renderComponentPicker(onKeyDown?: () => void) {
  return render(
    <div onKeyDown={onKeyDown}>
      <ComponentPicker
        activeType={null}
        onSelect={vi.fn()}
        onDragStart={vi.fn()}
      />
    </div>
  );
}

describe("ComponentPicker search", () => {
  it("filters components by label while preserving matching sections", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "card" } });

    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Product Card")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Blocks")).toBeTruthy();
    expect(screen.queryByText("Text")).toBeNull();
    expect(screen.queryByText("Feature")).toBeNull();
    expect(screen.queryByText("Navigation")).toBeNull();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("matches category names without flattening their components", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "layout" } });

    expect(screen.getByText("Layout")).toBeTruthy();
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(screen.getByText("Sidebar")).toBeTruthy();
    expect(screen.queryByText("Controls")).toBeNull();
  });

  it("does not expose internal component type aliases as search terms", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "productcard" } });

    expect(screen.queryByText("Product Card")).toBeNull();
    expect(screen.getByText(/No components found for/)).toBeTruthy();
  });

  it("reports total, filtered, singular, and empty result counts", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    expect(screen.getByText(String(EXPECTED_COMPONENT_COUNT))).toBeTruthy();

    fireEvent.change(search, { target: { value: "card" } });
    expect(screen.getByText(`2 of ${EXPECTED_COMPONENT_COUNT}`)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("2 components found");

    fireEvent.change(search, { target: { value: "hero" } });
    expect(screen.getByText(`1 of ${EXPECTED_COMPONENT_COUNT}`)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("1 component found");

    fireEvent.change(search, { target: { value: "nonexistent component" } });
    expect(screen.getByText(`0 of ${EXPECTED_COMPONENT_COUNT}`)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 components found");
  });

  it("clears the query with the search field clear button", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "hero" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear component search" }));

    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText(String(EXPECTED_COMPONENT_COUNT))).toBeTruthy();
    expect(document.activeElement).toBe(search);
  });

  it("shows a recoverable empty state", () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "nonexistent component" } });

    expect(screen.getByText(/No components found for/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(document.activeElement).toBe(search);
  });

  it("clears the query with Escape before the event reaches Layout Mode", () => {
    const onKeyDown = vi.fn();
    renderComponentPicker(onKeyDown);

    const search = screen.getByRole("searchbox", { name: "Search components" });
    fireEvent.change(search, { target: { value: "button" } });
    fireEvent.keyDown(search, { key: "Escape" });

    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(document.activeElement).toBe(search);
    expect(onKeyDown).not.toHaveBeenCalled();

    fireEvent.keyDown(search, { key: "Escape" });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("resets a scrolled result list and its fade state when filtering", async () => {
    renderComponentPicker();

    const search = screen.getByRole("searchbox", { name: "Search components" });
    const results = screen.getByRole("region", { name: "Components" });
    const baseClassName = results.className;
    let scrollHeight = 500;

    Object.defineProperty(results, "clientHeight", { configurable: true, value: 100 });
    Object.defineProperty(results, "scrollHeight", {
      configurable: true,
      get: () => scrollHeight,
    });

    results.scrollTop = 120;
    fireEvent.scroll(results);
    expect(results.className).not.toBe(baseClassName);

    scrollHeight = 20;
    fireEvent.change(search, { target: { value: "hero" } });

    expect(results.scrollTop).toBe(0);
    await waitFor(() => expect(results.className).toBe(baseClassName));
  });
});
