import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore.js";

function SettingsModal() {
  var isSettingsOpen = useAppStore(function (s) { return s.isSettingsOpen; });
  var toggleSettings = useAppStore(function (s) { return s.toggleSettings; });
  var autoR = useAppStore(function (s) { return s.autoR; });
  var setAutoR = useAppStore(function (s) { return s.setAutoR; });
  var layers = useAppStore(function (s) { return s.layers; });
  var toggleLayer = useAppStore(function (s) { return s.toggleLayer; });

  useEffect(function () {
    if (!isSettingsOpen) return;
    function onKey(e) { if (e.key === "Escape") toggleSettings(); }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [isSettingsOpen, toggleSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={toggleSettings}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="bg-[#0a0f1c] border border-blue-900/40 rounded-xl shadow-2xl w-full max-w-md p-6 text-[#b8c8dd] flex flex-col gap-6"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="flex justify-between items-center border-b border-blue-900/30 pb-3">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={toggleSettings}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
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
              onChange={function (e) { setAutoR(e.target.checked); }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
            />
            <span className="text-sm">Auto-Rotate Globe</span>
          </label>
        </section>

        {/* Layers */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#4d9ae8] uppercase tracking-wider">Map Layers</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(layers).map(function (layer) {
              return (
                <label key={layer} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layers[layer]}
                    onChange={function () { toggleLayer(layer); }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
                  />
                  <span className="text-sm capitalize">{layer.replace(/([A-Z])/g, " $1").trim()}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-blue-300/60 leading-tight">
            Note: OSM Buildings will only appear if Google Tiles are explicitly disabled to prevent severe overlap and VRAM issues.
          </p>
        </section>
      </div>
    </div>
  );
}

export default SettingsModal;
