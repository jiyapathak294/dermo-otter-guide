import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ScanTab } from "@/components/tabs/ScanTab";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock("@/lib/profile", () => ({
  loadProfile: vi.fn(() => ({})),
}));

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
});

describe("ScanTab idle state", () => {
  it("shows Enable camera button inside the camera panel", () => {
    render(<ScanTab />);
    expect(screen.getByRole("button", { name: /enable camera/i })).toBeInTheDocument();
  });

  it("shows From library button inside the camera panel", () => {
    render(<ScanTab />);
    expect(screen.getByRole("button", { name: /from library/i })).toBeInTheDocument();
  });

  it("shows an 'or' separator between the two buttons", () => {
    render(<ScanTab />);
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("does not show an Open camera button", () => {
    render(<ScanTab />);
    expect(screen.queryByRole("button", { name: /open camera/i })).not.toBeInTheDocument();
  });

  it("renders From library exactly once — not duplicated in a bottom row", () => {
    render(<ScanTab />);
    expect(screen.getAllByRole("button", { name: /from library/i })).toHaveLength(1);
  });
});
