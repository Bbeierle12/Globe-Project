import { useAppStore } from "./store/useAppStore.js";
import CesiumGlobe from "./CesiumGlobe.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Tooltip from "./components/Tooltip.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

function App() {
  const hov = useAppStore((state) => state.hov);

  return (
    <div className="w-screen h-screen bg-[#050810] flex font-['Segoe_UI',system-ui,sans-serif] text-[#b8c8dd] overflow-hidden relative">
      <CesiumGlobe />
      <Tooltip hov={hov} />
      <Sidebar />
      <SettingsModal />
    </div>
  );
}

export default App;
