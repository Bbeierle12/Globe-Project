import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore.js";
import { COUNTRIES, ISO_MAP, MP, RC } from "../../data/index.js";
import { COUNTY_FILE_MAP } from "../../data/us-counties/index.js";
import { buildSortedList } from "../../utils/sidebarLogic.js";
import { fmt, cachedClr, itemKey } from "./sidebarFormatters.js";

var ITEM_HEIGHT = 30;
var COUNTY_ITEM_HEIGHT = 24;
var OVERSCAN = 10;

function NavigationList() {
  var search = useAppStore(function (s) { return s.search; });
  var sel = useAppStore(function (s) { return s.sel; });
  var setSel = useAppStore(function (s) { return s.setSel; });
  var expanded = useAppStore(function (s) { return s.expanded; });
  var toggleExpand = useAppStore(function (s) { return s.toggleExpand; });
  var expandedStates = useAppStore(function (s) { return s.expandedStates; });
  var toggleExpandState = useAppStore(function (s) { return s.toggleExpandState; });
  var countyLoading = useAppStore(function (s) { return s.countyLoading; });
  var loadedCounties = useAppStore(function (s) { return s.loadedCounties; });

  var containerRef = useRef(null);
  var [scrollTop, setScrollTop] = useState(0);

  var onScroll = useCallback(function () {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  var sorted = useMemo(function () {
    return buildSortedList({
      countries: COUNTRIES,
      search: search,
      expanded: expanded,
      expandedStates: expandedStates,
      loadedCounties: loadedCounties,
    });
  }, [search, expanded, expandedStates, loadedCounties]);

  var totalHeight = useMemo(function () {
    var h = 0;
    for (var i = 0; i < sorted.length; i++) {
      h += sorted[i].depth === 2 ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT;
    }
    return h;
  }, [sorted]);

  var [containerHeight, setContainerHeight] = useState(400);

  useEffect(function () {
    if (containerRef.current) {
      var resizeObserver = new ResizeObserver(function (entries) {
        if (entries[0]) {
          setContainerHeight(entries[0].contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return function () { resizeObserver.disconnect(); };
    }
  }, []);

  var visible = useMemo(function () {
    var items = [];
    var y = 0;
    var countryRank = 0;
    var subRank = 0;
    var countyRank = 0;
    var startY = scrollTop - OVERSCAN * ITEM_HEIGHT;
    var endY = scrollTop + containerHeight + OVERSCAN * ITEM_HEIGHT;

    for (var i = 0; i < sorted.length; i++) {
      var item = sorted[i];
      var h = item.depth === 2 ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT;
      if (item.depth === 0) { countryRank++; subRank = 0; countyRank = 0; }
      else if (item.depth === 1) { subRank++; countyRank = 0; }
      else { countyRank++; }

      if (y + h > startY && y < endY) {
        items.push({
          item: item, top: y,
          rank: item.depth === 2 ? countyRank : item.depth === 1 ? subRank : countryRank,
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
          {visible.map(function (v) {
            var d = v.item.entry;
            var depth = v.item.depth;
            var rank = v.rank;
            var pct = (d.p / MP) * 100;
            var isSel = sel && sel.n === d.n && sel.t === d.t &&
              (d.t === "county" ? sel.fips === d.fips :
               d.t === "s" ? sel.parentIso === d.parentIso && (sel.fp || sel.sc || sel.n) === (d.fp || d.sc || d.n) :
               d.t === "city" ? sel.la === d.la && sel.lo === d.lo :
               sel.iso === d.iso);
            var clr = cachedClr(d.p);
            var isSub = depth === 1;
            var isCounty = depth === 2;
            var rCol = d.rg ? RC[d.rg] : null;
            var hasSubs = !isSub && !isCounty && d.subdivisions && d.subdivisions.length > 0;
            var isExp = !isSub && !isCounty && d.iso && expanded[d.iso];
            var parentCountry = isSub && d.parentIso ? ISO_MAP[d.parentIso] : null;
            var hasCounties = isSub && d.parentIso === "USA" && d.fp && COUNTY_FILE_MAP[d.fp];
            var isStateExp = hasCounties && expandedStates[d.fp];
            var isCountyLoading = hasCounties && countyLoading[d.fp];

            var depthCls = isCounty ? "ml-12 py-0.5 px-[7px]" : isSub ? "ml-6 py-1 px-[7px]" : "py-1 px-[7px]";

            return (
              <div
                key={itemKey(d)}
                onClick={function () { setSel(d); }}
                className={
                  "absolute left-0 right-0 rounded cursor-pointer box-border border transition-colors " +
                  depthCls + " " +
                  (isSel ? "bg-[#3a80e0]/10 border-[#3a80e0]/20" : "bg-transparent border-transparent hover:bg-blue-900/20")
                }
                style={{
                  top: v.top,
                  height: isCounty ? COUNTY_ITEM_HEIGHT : ITEM_HEIGHT,
                }}
              >
                <div className="flex justify-between items-center mb-px">
                  <div className="flex items-center gap-1 min-w-0">
                    {hasSubs && (
                      <button
                        onClick={function (e) { e.stopPropagation(); toggleExpand(d.iso); }}
                        className="text-[9px] text-[#4a6a88] hover:text-[#4d9ae8] cursor-pointer w-4 h-4 text-center shrink-0 select-none transition-transform duration-150 p-0 bg-transparent border-none leading-4"
                        style={{ transform: isExp ? "rotate(90deg)" : "rotate(0deg)" }}
                      >&#9654;</button>
                    )}
                    {hasCounties && (
                      <button
                        onClick={function (e) { e.stopPropagation(); toggleExpandState(d.fp); }}
                        className="text-[8px] cursor-pointer w-4 h-4 text-center shrink-0 select-none transition-transform duration-150 p-0 bg-transparent border-none leading-4"
                        style={{
                          color: isCountyLoading ? "#4d9ae8" : "#4a6a88",
                          transform: isStateExp ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >{isCountyLoading ? "\u25CB" : "\u25B6"}</button>
                    )}
                    {!hasSubs && !isSub && !isCounty && <span className="w-4 shrink-0" />}
                    {isSub && !hasCounties && <span className="w-4 shrink-0" />}

                    <span className="text-[9px] text-[#354a60] w-5 text-right font-bold shrink-0">{rank}</span>
                    <div
                      className={"rounded-full shrink-0 " + (isCounty ? "w-1 h-1" : "w-1.5 h-1.5")}
                      style={{ background: clr }}
                    />
                    <span
                      className={
                        "font-semibold whitespace-nowrap overflow-hidden text-ellipsis " +
                        (isSel ? "text-[#4d9ae8]" : isCounty ? "text-[#8a9ab0]" : "text-[#a8b8cc]") + " " +
                        (isCounty ? "text-[11px]" : "text-xs")
                      }
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
                  <span className={"font-bold text-[#4d9ae8] shrink-0 ml-1 " + (isCounty ? "text-[11px]" : "text-xs")}>
                    {fmt(d.p)}
                  </span>
                </div>
                <div
                  className="h-[2px] bg-[#283c64]/10 border-[#4a6a88] rounded-full overflow-hidden"
                  style={{ marginLeft: isCounty ? 24 : hasSubs || (!isSub && !isCounty) ? 42 : 30 }}
                >
                  <div className="h-full rounded-full opacity-60" style={{ width: pct + "%", background: clr }} />
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
