import React from "react";
import SidebarHeader from "./sidebar/SidebarHeader.jsx";
import NavigationList from "./sidebar/NavigationList.jsx";
import EntityDetails from "./sidebar/EntityDetails.jsx";
import { COUNTRIES } from "../data/index.js";

export default function Sidebar() {
  return (
    <nav
      aria-label="Population data sidebar"
      className="w-[330px] bg-[#060a14]/95 border-l border-blue-900/10 flex flex-col overflow-hidden z-15 shadow-xl relative"
    >
      <div className="p-3.5 pb-2 border-b border-blue-900/10 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#3a80e0] shadow-[0_0_8px_#3a80e0]" />
          <span className="text-base font-bold text-[#dce6f2]">Population Globe</span>
        </div>
        <div className="text-[11px] text-[#4a6a88] ml-[13px] mt-0.5">
          {COUNTRIES.length} countries · 2025
        </div>
      </div>

      <SidebarHeader />
      <NavigationList />
      <EntityDetails />

      <div className="px-3.5 py-1.5 border-t border-blue-900/20 flex items-center gap-1 text-[10px] text-[#354a60] bg-[#050810] shrink-0">
        <span>Low</span>
        <div
          className="flex-1 h-[3px] rounded-sm"
          style={{ background: "linear-gradient(90deg,#193e6e,#127d7d,#23a54b,#c3c32d,#e18718,#d72626)" }}
        />
        <span>High</span>
      </div>
    </nav>
  );
}
