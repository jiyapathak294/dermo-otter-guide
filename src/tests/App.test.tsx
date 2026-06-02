import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "@/App";
import { clearProfile, saveProfile } from "@/lib/profile";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          routine: {
            skin: { morning: [], night: [] },
            hair: { weekly: [] },
            nails: { daily: [] },
            warnings: [],
          },
        },
        error: null,
      }),
    },
  },
}));

const STUB_PROFILE = { skinType: "normal", skinGoals: ["Clear acne"] };

// Render the app and flush any async effects (e.g. supabase calls in RoutineTab)
const renderApp = async () => {
  render(<App />);
  await act(async () => {});
};

beforeEach(() => {
  clearProfile();
  localStorage.clear();
  // jsdom doesn't implement scrollTo — ChatTab calls scrollRef.current?.scrollTo
  window.HTMLElement.prototype.scrollTo = vi.fn();
  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
});

afterEach(() => {
  clearProfile();
  localStorage.clear();
  vi.useRealTimers();
});

// ── First-time user ────────────────────────────────────────────────────────

describe("First-time user flow", () => {
  it("shows brand splash — no bottom nav yet", () => {
    vi.useFakeTimers();
    render(<App />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("advances to DermaIntro after splash timeout", () => {
    vi.useFakeTimers();
    render(<App />);
    act(() => vi.advanceTimersByTime(2200));
    expect(screen.getByText("I'm Dermo, the Otter!")).toBeInTheDocument();
  });
});

// ── Returning user — home & navigation ────────────────────────────────────

describe("Returning user — home and navigation", () => {
  beforeEach(() => {
    saveProfile(STUB_PROFILE);
  });

  it("lands directly on Home with the bottom nav visible", async () => {
    await renderApp();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("shows all six tab labels in the nav", async () => {
    await renderApp();
    const nav = screen.getByRole("navigation");
    for (const label of ["Routine", "Products", "Scan", "Dermo", "Goals", "Learn"]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
  });

  it("defaults to the Routine tab — no Scan-specific buttons visible", async () => {
    await renderApp();
    expect(screen.queryByRole("button", { name: /enable camera/i })).not.toBeInTheDocument();
  });

  // ── Scan tab ──────────────────────────────────────────────────────────

  it("navigates to Scan tab and shows camera idle UX", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Scan"));
    expect(screen.getByRole("button", { name: /enable camera/i })).toBeInTheDocument();
  });

  it("Scan tab shows 'or' separator between Enable camera and From library", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Scan"));
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("Scan tab shows From library inside the camera panel", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Scan"));
    expect(screen.getByRole("button", { name: /from library/i })).toBeInTheDocument();
  });

  it("Scan tab has no Open camera button", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Scan"));
    expect(screen.queryByRole("button", { name: /open camera/i })).not.toBeInTheDocument();
  });

  // ── Other tabs ────────────────────────────────────────────────────────

  it("navigates to Dermo (chat) tab and shows the AI greeting", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Dermo"));
    expect(screen.getByText(/tell me how your skin/i)).toBeInTheDocument();
  });

  it("navigates to Goals tab and shows goal options", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Goals"));
    // "Clear acne" appears in the stub profile's active goals and the goal picker
    expect(screen.getAllByText("Clear acne").length).toBeGreaterThan(0);
  });

  it("navigates to Learn tab and shows ingredient content", async () => {
    await renderApp();
    fireEvent.click(within(screen.getByRole("navigation")).getByText("Learn"));
    expect(screen.getByText("Retinol")).toBeInTheDocument();
  });

  it("can navigate back from Scan to Routine", async () => {
    await renderApp();
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByText("Scan"));
    expect(screen.getByRole("button", { name: /enable camera/i })).toBeInTheDocument();
    fireEvent.click(within(nav).getByText("Routine"));
    expect(screen.queryByRole("button", { name: /enable camera/i })).not.toBeInTheDocument();
  });
});
