import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "../../src/components/Sidebar.jsx";
import { useAppStore } from "../../src/store/useAppStore.js";

function resetStore(overrides) {
  useAppStore.setState({
    search: "",
    sel: null,
    hov: null,
    expanded: {},
    expandedStates: {},
    countyLoading: {},
    loadedCounties: {},
    autoR: true,
    isSettingsOpen: false,
    ...overrides,
  });
}

describe("Sidebar", function() {
  beforeEach(function() { resetStore(); });

  it("renders the Population Globe title", function() {
    render(<Sidebar />);
    expect(screen.getByText("Population Globe")).toBeInTheDocument();
  });

  it("renders search input with aria-label", function() {
    render(<Sidebar />);
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  });

  it("calls setSearch on input change", async function() {
    render(<Sidebar />);
    await userEvent.type(screen.getByLabelText(/search/i), "i");
    expect(useAppStore.getState().search).toBe("i");
  });

  it("displays entries count", function() {
    render(<Sidebar />);
    expect(screen.getByText(/entries$/)).toBeInTheDocument();
  });

  it("renders selection detail panel for country", function() {
    resetStore({
      sel: { t: "c", n: "Brazil", p: 211000000, la: -14, lo: -51, iso: "BRA", subdivisions: [], al: ["Brazil"] },
    });
    render(<Sidebar />);
    expect(screen.getAllByText("Brazil").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("COUNTRY")).toBeInTheDocument();
    expect(screen.getByText("211,000,000")).toBeInTheDocument();
  });

  it("shows tier badge for subdivision selection", function() {
    resetStore({
      sel: { t: "s", n: "Texas", p: 30503301, parentIso: "USA", rg: "South", cp: "Austin" },
    });
    render(<Sidebar />);
    expect(screen.getByText("Texas")).toBeInTheDocument();
    expect(screen.getByText("Mega")).toBeInTheDocument();
  });

  it("renders color legend bar", function() {
    render(<Sidebar />);
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("has correct nav aria-label", function() {
    render(<Sidebar />);
    expect(screen.getByRole("navigation", { name: /population data sidebar/i })).toBeInTheDocument();
  });

  it("renders settings gear button", function() {
    render(<Sidebar />);
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
  });

  it("clicking settings button opens settings modal", async function() {
    render(<Sidebar />);
    await userEvent.click(screen.getByTitle("Settings"));
    expect(useAppStore.getState().isSettingsOpen).toBe(true);
  });

  it("search input starts empty by default", function() {
    render(<Sidebar />);
    expect(screen.getByLabelText(/search/i).value).toBe("");
  });
});
