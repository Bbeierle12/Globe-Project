/**
 * Shared fetch utilities.
 * Extracted from populationLayer.js and cityLayer.js per Phase 0.
 */

/**
 * Fetches a URL and returns parsed JSON.
 * Throws on non-ok response or invalid input.
 *
 * @param {string} url - URL to fetch
 * @param {function} [fetchFn=fetch] - Fetch implementation (injectable for tests)
 * @returns {Promise<any>} Parsed JSON response
 */
function safeFetch(url, fetchFn) {
  if (!url || typeof url !== "string") {
    return Promise.reject(new Error("safeFetch requires a non-empty URL string"));
  }
  var fn = fetchFn || fetch;
  return fn(url).then(function(r) {
    if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
    return r.json();
  });
}

/**
 * Fetches multiple URLs concurrently, returning settled results.
 * Failed fetches appear as rejected without crashing others.
 *
 * @param {string[]} urls - Array of URLs to fetch
 * @param {function} [fetchFn=fetch] - Fetch implementation (injectable for tests)
 * @returns {Promise<Array<{status: string, value?: any, reason?: Error}>>}
 */
function safeFetchAllSettled(urls, fetchFn) {
  if (!urls || urls.length === 0) return Promise.resolve([]);
  var promises = urls.map(function(url) {
    return safeFetch(url, fetchFn);
  });
  return Promise.allSettled(promises);
}

export { safeFetch, safeFetchAllSettled };
