import React from "react";
import { useAppStore } from "../../store/useAppStore.js";
import { ISO_MAP, WORLD_POP, RC } from "../../data/index.js";

function tier(p) {
  if (p >= 2e7) return { l: "Mega", c: "#e74c3c" };
  if (p >= 1e7) return { l: "Large", c: "#e67e22" };
  if (p >= 5e6) return { l: "Medium", c: "#b7950b" };
  if (p >= 1e6) return { l: "Small", c: "#16a085" };
  return { l: "Micro", c: "#2980b9" };
}

function EntityDetails() {
  const sel = useAppStore((state) => state.sel);

  if (!sel) return null;

  const isSt = sel.t === "s";
  const isCty = sel.t === "county";
  const isCity = sel.t === "city";
  const selParent = isSt && sel.parentIso ? ISO_MAP[sel.parentIso] : null;
  const selParentState =
    isCty && sel.parentFp
      ? ISO_MAP.USA
        ? ISO_MAP.USA.subdivisions.find((s) => s.fp === sel.parentFp)
        : null
      : null;

  return (
    <div className="border-t border-blue-900/40 bg-[#060e1c]/85 overflow-y-auto p-2.5 px-3.5 shrink-0 max-h-[280px]">
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="text-sm font-bold text-[#dce6f2]">{sel.n}</span>
        <span
          className={`text-[9px] font-bold px-1.5 py-[1px] rounded-sm ${
            isCity ? "text-[#f2d59a] bg-[#f2d59a]/10" :
            isCty ? "text-[#aaddff] bg-[#aaddff]/10" :
            isSt ? "text-[#5ea8f0] bg-[#5ea8f0]/10" :
            "text-[#7ec87e] bg-[#7ec87e]/10"
          }`}
        >
          {isCity
            ? "CITY"
            : isCty
              ? "COUNTY"
              : isSt
                ? selParent
                  ? selParent.subdivisionLabel.toUpperCase()
                  : "STATE"
                : "COUNTRY"}
        </span>
        {(isSt || isCty) && (
          <span
            className="text-[9px] font-semibold px-1.5 py-[1px] rounded-sm"
            style={{ color: tier(sel.p).c, backgroundColor: tier(sel.p).c + "18" }}
          >
            {tier(sel.p).l}
          </span>
        )}
        {isCty && selParentState && (
          <span className="text-[9px] text-[#5ea8f0] bg-[#5ea8f0]/10 px-1 py-[1px] rounded-sm">
            {selParentState.n}
          </span>
        )}
      </div>

      <div className="text-xl font-light text-[#4d9ae8]">{sel.p.toLocaleString()}</div>
      <div className="text-[10px] text-[#4a6a88] mb-2">
        {isCity
          ? (sel.p / WORLD_POP * 100).toFixed(4) + "% of world"
          : isCty && selParentState
            ? (sel.p / selParentState.p * 100).toFixed(2) + "% of " + selParentState.n + " · " + (sel.p / WORLD_POP * 100).toFixed(4) + "% of world"
            : isSt && selParent
              ? (sel.p / selParent.p * 100).toFixed(2) + "% of " + selParent.n + " · " + (sel.p / WORLD_POP * 100).toFixed(2) + "% of world"
              : (sel.p / WORLD_POP * 100).toFixed(2) + "% of world"}
      </div>

      {(isSt || isCty) && (
        <>
          <div className="h-px bg-blue-900/30 my-1.5" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            {sel.rg != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">Region</span>
                <span className="font-semibold" style={{ color: RC[sel.rg] || "#b0c4da" }}>{sel.rg}</span>
              </div>
            )}
            {sel.cp != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">{isCty ? "Seat" : "Capital"}</span>
                <span className="font-semibold text-[#b0c4da]">{sel.cp || "N/A"}</span>
              </div>
            )}
            {sel.dn != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">Density</span>
                <span className="font-semibold text-[#b0c4da]">{sel.dn.toLocaleString()}/mi²</span>
              </div>
            )}
            {sel.ar != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">Area</span>
                <span className="font-semibold text-[#b0c4da]">{sel.ar.toLocaleString()} km²</span>
              </div>
            )}
            {sel.ag != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">Med. Age</span>
                <span className="font-semibold text-[#b0c4da]">{sel.ag}</span>
              </div>
            )}
            {sel.fips != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">FIPS</span>
                <span className="font-semibold text-[#b0c4da]">{sel.fips}</span>
              </div>
            )}
            {sel.ch != null && (
              <div className="flex justify-between">
                <span className="text-[#4a6a88]">2020-24</span>
                <span className={`font-semibold ${sel.ch >= 0 ? "text-[#27ae60]" : "text-[#e74c3c]"}`}>
                  {sel.ch >= 0 ? "+" : ""}{sel.ch}%
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {!isSt && !isCty && (
        <div>
          <div className="text-[10px] text-[#354a60]">
            {Number(sel.la).toFixed(2)}° · {Number(sel.lo).toFixed(2)}°
          </div>
          {sel.subdivisions && sel.subdivisions.length > 0 && (
            <div className="text-[10px] text-[#4a6a88] mt-1">
              {sel.subdivisions.length} {sel.subdivisionLabel}
              {sel.subdivisions.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EntityDetails;
