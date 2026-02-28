import { COUNTY_FILE_MAP } from "../../src/data/us-counties/index.js";

describe("County data", function() {
  it("COUNTY_FILE_MAP has 51 state entries", function() {
    expect(Object.keys(COUNTY_FILE_MAP)).toHaveLength(51);
  });

  it("all entries are functions", function() {
    Object.values(COUNTY_FILE_MAP).forEach(function(loader) {
      expect(typeof loader).toBe("function");
    });
  });

  it("contains expected state FIPS codes", function() {
    var expected = [
      "01","02","04","05","06","08","09","10","11","12","13","15","16",
      "17","18","19","20","21","22","23","24","25","26","27","28","29",
      "30","31","32","33","34","35","36","37","38","39","40","41","42",
      "44","45","46","47","48","49","50","51","53","54","55","56"
    ];
    expected.forEach(function(fp) {
      expect(COUNTY_FILE_MAP[fp]).toBeDefined();
    });
  });

  it("loads California counties (06) with valid structure", async function() {
    var mod = await COUNTY_FILE_MAP["06"]();
    var counties = mod.COUNTIES_06;
    expect(Array.isArray(counties)).toBe(true);
    expect(counties.length).toBeGreaterThan(0);
    counties.forEach(function(c) {
      expect(c.t).toBe("county");
      expect(c.parentIso).toBe("USA");
      expect(c.parentFp).toBe("06");
      expect(c.fips).toBeTruthy();
      expect(c.fips.startsWith("06")).toBe(true);
      expect(c.p).toBeGreaterThan(0);
    });
  });

  it("loads Texas counties (48) with valid structure", async function() {
    var mod = await COUNTY_FILE_MAP["48"]();
    var counties = mod.COUNTIES_48;
    expect(Array.isArray(counties)).toBe(true);
    expect(counties.length).toBeGreaterThan(200);
    counties.forEach(function(c) {
      expect(c.t).toBe("county");
      expect(c.parentFp).toBe("48");
      expect(c.fips.startsWith("48")).toBe(true);
    });
  });
});
