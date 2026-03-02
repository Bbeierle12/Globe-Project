import React from "react";
import { useAppStore } from "../store/useAppStore.js";

function SettingsModal() {
  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const toggleSettings = useAppStore((state) => state.toggleSettings);
  const autoR = useAppStore((state) => state.autoR);
  const setAutoR = useAppStore((state) => state.setAutoR);
  const layers = useAppStore((state) => state.layers);
  const toggleLayer = useAppStore((state) => state.toggleLayer);
  const apiKeys = useAppStore((state) => state.apiKeys);
  const setApiKey = useAppStore((state) => state.setApiKey);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0f1c] border border-blue-900/40 rounded-xl shadow-2xl w-full max-w-md p-6 text-[#b8c8dd] flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-blue-900/30 pb-3">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={toggleSettings}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Globe Behavior */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#4d9ae8] uppercase tracking-wider">Behavior</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoR}
              onChange={(e) => setAutoR(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
            />
            <span className="text-sm">Auto-Rotate Globe</span>
          </label>
        </section>

        {/* Layers */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#4d9ae8] uppercase tracking-wider">Map Layers</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(layers).map((layer) => (
              <label key={layer} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers[layer]}
                  onChange={() => toggleLayer(layer)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
                />
                <span className="text-sm capitalize">{layer.replace(/([A-Z])/g, " $1").trim()}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-blue-300/60 leading-tight">
            Note: OSM Buildings will only appear if Google Tiles are explicitly disabled to prevent severe overlap and VRAM issues.
          </p>
        </section>

        {/* API Config */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#4d9ae8] uppercase tracking-wider">App Configuration (Overrides)</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs flex flex-col gap-1">
              Cesium Ion Token
              <input
                type="password"
                value={apiKeys.cesiumIon}
                onChange={(e) => setApiKey("cesiumIon", e.target.value)}
                placeholder="Leave blank to use default .env token"
                className="bg-[#050810] border border-blue-900/50 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
              />
            </label>
            <label className="text-xs flex flex-col gap-1">
              Google Maps API Key
              <input
                type="password"
                value={apiKeys.googleMaps}
                onChange={(e) => setApiKey("googleMaps", e.target.value)}
                placeholder="Leave blank to use default .env key"
                className="bg-[#050810] border border-blue-900/50 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsModal;
