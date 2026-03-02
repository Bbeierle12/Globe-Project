import { render, screen } from "@testing-library/react";
import { useAppStore } from "../../src/store/useAppStore.js";

vi.mock("../../src/CesiumGlobe.jsx", function() {
  return {
    default: function MockCesiumGlobe() {
      return <div data-testid="cesium-globe" />;
    },
    markerSize: vi.fn(),
    getEntryHeight: vi.fn(),
    getPickedEntry: vi.fn(),
  };
});

import App from "../../src/App.jsx";

describe("App", function() {
  beforeEach(function() {
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
    });
  });

  it("renders without crashing", function() {
    render(<App />);
    expect(screen.getByTestId("cesium-globe")).toBeInTheDocument();
  });

  it("renders both CesiumGlobe and Sidebar", function() {
    render(<App />);
    expect(screen.getByTestId("cesium-globe")).toBeInTheDocument();
    expect(screen.getByText("Population Globe")).toBeInTheDocument();
  });

  it("does not render Tooltip initially", function() {
    render(<App />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders search input in empty state", function() {
    render(<App />);
    var searchInput = screen.getByLabelText(/search/i);
    expect(searchInput.value).toBe("");
  });

  it("renders settings gear button", function() {
    render(<App />);
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
  });
});
