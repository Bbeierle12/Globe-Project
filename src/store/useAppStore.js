import { create } from "zustand";
import { COUNTY_FILE_MAP } from "../data/us-counties/index.js";

export const useAppStore = create((set, get) => ({
  // UI State
  isSettingsOpen: false,
  search: "",
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSearch: (search) => set({ search }),

  // Selection & Hover State
  hov: null,
  sel: null,
  setHov: (hov) => set({ hov }),
  setSel: (sel) => set({ sel }),

  // Expansion State
  expanded: {},
  expandedStates: {},
  countyLoading: {},
  loadedCounties: {},

  toggleExpand: (iso) => set((state) => {
    return { expanded: { ...state.expanded, [iso]: !state.expanded[iso] } };
  }),

  toggleExpandState: (fp) => {
    const state = get();
    const willExpand = !state.expandedStates[fp];
    set({ expandedStates: { ...state.expandedStates, [fp]: willExpand } });

    if (!willExpand || state.loadedCounties[fp] || state.countyLoading[fp]) return;
    const loader = COUNTY_FILE_MAP[fp];
    if (!loader) return;

    set({ countyLoading: { ...state.countyLoading, [fp]: true } });

    loader()
      .then((mod) => {
        const varName = "COUNTIES_" + fp;
        const counties = mod[varName] || [];
        set((s) => ({
          loadedCounties: { ...s.loadedCounties, [fp]: counties },
          countyLoading: { ...s.countyLoading, [fp]: false }
        }));
      })
      .catch((error) => {
        console.error("Failed to load counties for state " + fp + ":", error);
        set((s) => ({ countyLoading: { ...s.countyLoading, [fp]: false } }));
      });
  },

  // Settings State
  autoR: true,
  setAutoR: (autoR) => set({ autoR }),

  layers: {
    buildings: false, // Turned off initially in the globe because of googleTiles, let's keep it false
    earthquakes: true,
    cities: true,
    googleTiles: true,
    population: true,
  },
  toggleLayer: (layerName) => set((state) => ({
    layers: { ...state.layers, [layerName]: !state.layers[layerName] }
  })),

  apiKeys: {
    cesiumIon: "",
    googleMaps: "",
  },
  setApiKey: (keyName, value) => set((state) => ({
    apiKeys: { ...state.apiKeys, [keyName]: value }
  })),
}));
