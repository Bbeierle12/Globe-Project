var EARTHQUAKE_CONFIG = {
  feedUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
  refreshIntervalMs: 300000,
  magnitudeThresholds: { low: 4.5, high: 6.5 },
  colors: {
    low: "#f1c40f",
    medium: "#e67e22",
    high: "#e74c3c",
  },
  markerSizes: {
    low: 6,
    medium: 10,
    high: 16,
  },
};

export { EARTHQUAKE_CONFIG };
