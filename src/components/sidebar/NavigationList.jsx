import React, { useMemo, useRef, useState, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore.js";
import { COUNTRIES, ISO_MAP, MP, RC } from "../../data/index.js";
import { COUNTY_FILE_MAP } from "../../data/us-counties/index.js";
import { pClr } from "../../cesium/topoUtils.js";
import { buildSortedList } from "../../utils/sidebarLogic.js";

const ITEM_HEIGHT = 30;
const COUNTY_ITEM_HEIGHT = 24;
const OVERSCAN = 10;

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

const _colorCache = new Map();
function cachedClr(pop) {
  const cached = _colorCache.get(pop);
  if (cached) return cached;
  const rgb = pClr(pop);
  const str = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  _colorCache.set(pop, str);
  return str;
}

function itemKey(d) {
  if (d.t === "county") return "county:" + d.fips;
  if (d.t === "s") return "s:" + d.parentIso + ":" + (d.fp || d.sc || d.n);
  if (d.t === "city") return "city:" + d.la + ":" + d.lo;
  return "c:" + d.iso;
}

function NavigationList() {
  const search = useAppStore((state) => state.search);
  const sel = useAppStore((state) => state.sel);
  const setSel = useAppStore((state) => state.setSel);
  const expanded = useAppStore((state) => state.expanded);
  const toggleExpand = useAppStore((state) => state.toggleExpand);
  const expandedStates = useAppStore((state) => state.expandedStates);
  const toggleExpandState = useAppStore((state) => state.toggleExpandState);
  const countyLoading = useAppStore((state) => state.countyLoading);
  const loadedCounties = useAppStore((state) => state.loadedCounties);

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  const sorted = useMemo(() => {
    return buildSortedList({
      countries: COUNTRIES,
      search,
      expanded,
      expandedStates,
      loadedCounties,
    });
  }, [search, expanded, expandedStates, loadedCounties]);

  const totalHeight = useMemo(() => {
    let h = 0;
    for (let i = 0; i < sorted.length; i++) {
      h += sorted[i].depth === 2 ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT;
    }
    return h;
  }, [sorted]);

  const [containerHeight, setContainerHeight] = useState(400);

  // Measure container after mount/resize
  React.useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerHeight(entries[0].contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const visible = useMemo(() => {
    const items = [];
    let y = 0;
    let countryRank = 0;
    let subRank = 0;
    let countyRank = 0;
    const startY = scrollTop - OVERSCAN * ITEM_HEIGHT;
    const endY = scrollTop + containerHeight + OVERSCAN * ITEM_HEIGHT;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const h = item.depth === 2 ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT;
      if (item.depth === 0) { countryRank++; subRank = 0; countyRank = 0; }
      else if (item.depth === 1) { subRank++; countyRank = 0; }
      else { countyRank++; }
      
      if (y + h > startY && y < endY) {
        items.push({
          item, top: y,
          rank: item.depth === 2 ? countyRank : item.depth === 1 ? subRank : countryRank
        });
      }
      y += h;
    }
    return items;
  }, [sorted, scrollTop, containerHeight]);

  return (
    <>
      <div className="px-3.5 py-1 flex justify-between items-center text-[#354a60] text-[10px]">
        <span>{sorted.length} entries</span>
      </div>
      <div 
        ref={containerRef} 
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-1.5 pb-1.5 relative"
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {visible.map((v) => {
            const d = v.item.entry;
            const depth = v.item.depth;
            const rank = v.rank;
            const pct = (d.p / MP) * 100;
            const isSel = sel && sel.n === d.n && sel.t === d.t &&
              (d.t === "county" ? sel.fips === d.fips :
               d.t === "s" ? sel.parentIso === d.parentIso && (sel.fp || sel.sc || sel.n) === (d.fp || d.sc || d.n) :
               d.t === "city" ? sel.la === d.la && sel.lo === d.lo :
               sel.iso === d.iso);
            const clr = cachedClr(d.p);
            const isSub = depth === 1;
            const isCounty = depth === 2;
            const rCol = d.rg ? RC[d.rg] : null;
            const hasSubs = !isSub && !isCounty && d.subdivisions && d.subdivisions.length > 0;
            const isExp = !isSub && !isCounty && d.iso && expanded[d.iso];
            const parentCountry = isSub && d.parentIso ? ISO_MAP[d.parentIso] : null;
            const hasCounties = isSub && d.parentIso === "USA" && d.fp && COUNTY_FILE_MAP[d.fp];
            const isStateExp = hasCounties && expandedStates[d.fp];
            const isCountyLoading = hasCounties && countyLoading[d.fp];
            
            return (
              <div
                key={itemKey(d)}
                onClick={() => setSel(d)}
                className={`absolute left-0 right-0 rounded cursor-pointer box-border border transition-colors ${
                  isSel ? "bg-[#3a80e0]/10 border-[#3a80e0]/20" : "bg-transparent border-transparent hover:bg-blue-900/20"
                }`}
                style={{
                  top: v.top,
                  height: isCounty ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT,
                  padding: isCounty ? "2px 7px" : "4px 7px",
                  marginLeft: isCounty ? 48 : isSub ? 24 : 0,
                }}
              >
                <div className="flex justify-between items-center mb-px">
                  <div className="flex items-center gap-1 min-w-0">
                    {hasSubs && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(d.iso); }}
                        className="text-[9px] text-[#4a6a88] hover:text-[#4d9ae8] cursor-pointer w-4 h-4 text-center shrink-0 select-none transition-transform duration-150 p-0 bg-transparent border-none leading-4"
                        style={{ transform: isExp ? "rotate(90deg)" : "rotate(0deg)" }}
                      >&#9654;</button>
                    )}
                    {hasCounties && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpandState(d.fp); }}
                        className="text-[8px] cursor-pointer w-4 h-4 text-center shrink-0 select-none transition-transform duration-150 p-0 bg-transparent border-none leading-4"
                        style={{ 
                          color: isCountyLoading ? "#4d9ae8" : "#4a6a88",
                          transform: isStateExp ? "rotate(90deg)" : "rotate(0deg)" 
                        }}
                      >{isCountyLoading ? "\u25CB" : "\u25B6"}</button>
                    )}
                    {!hasSubs && !isSub && !isCounty && <span className="w-4 shrink-0" />}
                    {isSub && !hasCounties && <span className="w-4 shrink-0" />}
                    
                    <span className="text-[9px] text-[#354a60] w-5 text-right font-bold shrink-0">{rank}</span>
                    <div 
                      className={`rounded-full shrink-0 ${isCounty ? "w-1 h-1" : "w-1.5 h-1.5"}`} 
                      style={{ background: clr }} 
                    />
                    <span 
                      className={`font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${
                        isSel ? "text-[#4d9ae8]" : isCounty ? "text-[#8a9ab0]" : "text-[#a8b8cc]"
                      } ${isCounty ? "text-[11px]" : "text-xs"}`}
                    >{d.n}</span>
                    
                    {isSub && parentCountry && (
                      <span className="text-[8px] text-[#5ea8f0] bg-[#5ea8f0]/10 px-[3px] rounded-sm shrink-0">
                        {parentCountry.iso}
                      </span>
                    )}
                    {isSub && rCol && (
                      <span className="text-[8px] px-[3px] rounded-sm shrink-0" style={{ color: rCol, background: rCol + "15" }}>
                        {d.rg.slice(0, 2)}
                      </span>
                    )}
                    {isCounty && (
                      <span className="text-[8px] text-[#6a7a8a] bg-[#6a7a8a]/10 px-[3px] rounded-sm shrink-0">
                        CTY
                      </span>
                    )}
                  </div>
                  <span className={`font-bold text-[#4d9ae8] shrink-0 ml-1 ${isCounty ? "text-[11px]" : "text-xs"}`}>
                    {fmt(d.p)}
                  </span>
                </div>
                <div 
                  className="h-[2px] bg-[#283c64]/10 border-[#4a6a88] rounded-full overflow-hidden" 
                  style={{ marginLeft: isCounty ? 24 : hasSubs || (!isSub && !isCounty) ? 42 : 30 }}
                >
                  <div className="h-full rounded-full opacity-60" style={{ width: `${pct}%`, background: clr }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default NavigationList;
