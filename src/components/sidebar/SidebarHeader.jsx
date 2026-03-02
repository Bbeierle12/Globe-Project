import { useAppStore } from "../../store/useAppStore.js";

function SidebarHeader() {
  var search = useAppStore(function (s) { return s.search; });
  var setSearch = useAppStore(function (s) { return s.setSearch; });
  var toggleSettings = useAppStore(function (s) { return s.toggleSettings; });

  return (
    <div className="flex items-center gap-3 p-3 border-b border-blue-900/30 bg-[#0a0f1c] shrink-0">
      <input
        type="text"
        aria-label="Search countries"
        placeholder="Search countries, states, counties..."
        value={search}
        onChange={function (e) { setSearch(e.target.value); }}
        className="flex-1 bg-[#050810] border border-blue-900/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
      />
      <button
        onClick={toggleSettings}
        className="flex items-center justify-center p-2 rounded-lg bg-[#050810] border border-blue-900/50 text-blue-300 hover:text-white hover:bg-blue-900/40 hover:border-blue-500 transition-all cursor-pointer shadow-sm"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    </div>
  );
}

export default SidebarHeader;
