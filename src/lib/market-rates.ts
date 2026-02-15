/**
 * Live Market Rate Feed — FRED API
 *
 * Fetches current base rates from the Federal Reserve Economic Data API.
 * Caches results in memory for 24 hours. Falls back to static rates if
 * FRED_API_KEY is not set or the API is unreachable.
 *
 * FRED series used:
 *   DPRIME  — WSJ Prime Rate
 *   SOFR    — Secured Overnight Financing Rate
 *   DGS10   — 10-Year Treasury Constant Maturity Rate
 *
 * APOR estimate: derived as Treasury + 1.75% (conservative approximation
 * of the Average Prime Offer Rate for 30-year fixed conventional loans).
 * For exact APOR, see FFIEC tables at ffiec.gov/ratespread.
 *
 * Setup: Add FRED_API_KEY to your .env (free at https://fred.stlouisfed.org/docs/api/api_key.html)
 */

export interface MarketRates {
  prime: number;
  sofr: number;
  treasury: number;
  aporEstimate: number;
  fetchedAt: number;
  source: "fred" | "fallback";
}

// Static fallback rates — updated manually as a safety net.
// These are only used if FRED_API_KEY is missing or the API is down.
const FALLBACK_RATES: MarketRates = {
  prime: 0.0675,
  sofr: 0.0430,
  treasury: 0.0415,
  aporEstimate: 0.059, // 4.15% + 1.75%
  fetchedAt: 0,
  source: "fallback",
};

let cachedRates: MarketRates = { ...FALLBACK_RATES };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch current market rates from FRED. Results are cached for 24 hours.
 * Call this at the start of any pipeline that prices loans.
 */
export async function refreshMarketRates(): Promise<MarketRates> {
  // Return cache if still fresh
  if (cachedRates.source === "fred" && Date.now() - cachedRates.fetchedAt < CACHE_TTL) {
    return cachedRates;
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return cachedRates;
  }

  try {
    const [prime, sofr, treasury] = await Promise.all([
      fetchFredSeries("DPRIME", apiKey),
      fetchFredSeries("SOFR", apiKey),
      fetchFredSeries("DGS10", apiKey),
    ]);

    cachedRates = {
      prime: prime ?? FALLBACK_RATES.prime,
      sofr: sofr ?? FALLBACK_RATES.sofr,
      treasury: treasury ?? FALLBACK_RATES.treasury,
      aporEstimate: (treasury ?? FALLBACK_RATES.treasury) + 0.0175,
      fetchedAt: Date.now(),
      source: "fred",
    };

    return cachedRates;
  } catch {
    return cachedRates;
  }
}

/**
 * Get cached rates synchronously. Returns whatever was last fetched,
 * or fallback rates if refreshMarketRates() hasn't been called yet.
 */
export function getCachedRates(): MarketRates {
  return cachedRates;
}

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
): Promise<number | null> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${seriesId}&api_key=${apiKey}&file_type=json` +
    `&limit=1&sort_order=desc`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = await res.json();
  const value = data?.observations?.[0]?.value;
  if (!value || value === ".") return null;

  // FRED returns percentages (e.g. 6.75), we store as decimals (0.0675)
  return parseFloat(value) / 100;
}
