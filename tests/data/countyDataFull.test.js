/**
 * TDD Contract: Full US county data for all 50 states + DC
 * Validates that COUNTY_FILE_MAP has 51 entries and each state's
 * county data loads with valid structure.
 */

import { COUNTY_FILE_MAP } from "../../src/data/us-counties/index.js";

var ALL_FIPS = [
  "01","02","04","05","06","08","09","10","11","12","13","15","16",
  "17","18","19","20","21","22","23","24","25","26","27","28","29",
  "30","31","32","33","34","35","36","37","38","39","40","41","42",
  "44","45","46","47","48","49","50","51","53","54","55","56"
];

var MIN_COUNTIES = {
  "01": 67, "02": 25, "04": 15, "05": 75, "06": 58, "08": 64, "09": 8,
  "10": 3, "11": 1, "12": 67, "13": 159, "15": 5, "16": 44, "17": 102,
  "18": 92, "19": 99, "20": 105, "21": 120, "22": 64, "23": 16, "24": 24,
  "25": 14, "26": 83, "27": 87, "28": 82, "29": 115, "30": 56, "31": 93,
  "32": 17, "33": 10, "34": 21, "35": 33, "36": 62, "37": 100, "38": 53,
  "39": 88, "40": 77, "41": 36, "42": 67, "44": 5, "45": 46, "46": 66,
  "47": 95, "48": 254, "49": 29, "50": 14, "51": 130, "53": 39, "54": 55,
  "55": 72, "56": 23
};

describe("Full US county data", function () {
  it("COUNTY_FILE_MAP has 51 entries", function () {
    expect(Object.keys(COUNTY_FILE_MAP)).toHaveLength(51);
  });

  it("all entries are functions", function () {
    Object.values(COUNTY_FILE_MAP).forEach(function (loader) {
      expect(typeof loader).toBe("function");
    });
  });

  it("contains all expected FIPS codes", function () {
    ALL_FIPS.forEach(function (fp) {
      expect(COUNTY_FILE_MAP[fp]).toBeDefined();
    });
  });

  ALL_FIPS.forEach(function (fp) {
    describe("state FIPS " + fp, function () {
      it("loads with valid county structure", async function () {
        var mod = await COUNTY_FILE_MAP[fp]();
        var counties = mod["COUNTIES_" + fp];
        expect(Array.isArray(counties)).toBe(true);

        var minCount = MIN_COUNTIES[fp] || 1;
        expect(counties.length).toBeGreaterThanOrEqual(minCount);

        counties.forEach(function (c) {
          expect(c.t).toBe("county");
          expect(c.parentIso).toBe("USA");
          expect(c.parentFp).toBe(fp);
          expect(c.fips).toBeTruthy();
          expect(c.fips.startsWith(fp)).toBe(true);
          expect(c.n).toBeTruthy();
          expect(c.p).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(c.la)).toBe(true);
          expect(Number.isFinite(c.lo)).toBe(true);
          expect(c.rg).toBeTruthy();
          expect(Number.isFinite(c.dn)).toBe(true);
        });
      });
    });
  });
});
