import { DEFAULT_BUSINESS_HOURS } from "../utils/marketState";

const LIVE_RATES_ENDPOINT = "/api/rates/live";
const OFFICIAL_PARALLEL_ENDPOINT = "/api/rates/official-vs-parallel";
const GOLD_SPOT_ENDPOINT = "/api/rates/gold";
const CBVS_REGISTER_SOURCE = "CBvS Register";
const CUSTOM_OVERRIDE_SOURCES = new Set([
  "Admin Added",
  "Admin Updated",
  "Business Portal",
  "Cambio Owner Portal",
  "Community Verified",
  "User Reported",
]);

const oneDayMs = 24 * 60 * 60 * 1000;

const fallbackRegisterCambios = [
  { id: "dallex", name: "Dallex N.V.", district: "Paramaribo", locationLabel: "Tourtonnelaan 246, Paramaribo" },
  {
    id: "dharma-tew",
    name: "Dharma Tew Cambio",
    district: "Paramaribo",
    locationLabel: "Verlengde Gemenelandsweg 127, Paramaribo",
  },
  {
    id: "digros-exchange",
    name: "Digros Exchange N.V.",
    district: "Commewijne",
    locationLabel: "Meerzorgweg 284, Commewijne",
  },
  { id: "exces", name: "EXCES N.V.", district: "Paramaribo", locationLabel: "Flustraat 7, Paramaribo" },
  {
    id: "florin-exchange",
    name: "Florin Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Surinamestraat 72, Paramaribo",
  },
  {
    id: "keystone-exchange",
    name: "Keystone Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Molenpad 2, Paramaribo",
  },
  {
    id: "money-line",
    name: "Money Line N.V.",
    district: "Paramaribo",
    locationLabel: "Domineestraat 35c, Paramaribo",
  },
  {
    id: "multi-track-exchange",
    name: "Multi Track Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Wilhelminastraat 35, Paramaribo",
  },
  {
    id: "shamy-money-exchange",
    name: "Shamy Money Exchange N.V.",
    district: "Wanica",
    locationLabel: "Indira Gandhiweg 455, Wanica",
  },
  {
    id: "sunedo-wisselkantoor",
    name: "Sunedo Wisselkantoor N.V.",
    district: "Paramaribo",
    locationLabel: "Domineestraat hoek Neumanpad 12, Paramaribo",
  },
  {
    id: "surifast-money-exchange",
    name: "Surifast Money Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Kwattaweg 442, Paramaribo",
  },
  { id: "surora", name: "Surora N.V.", district: "Paramaribo", locationLabel: "Mahonylaan 41, Paramaribo" },
  {
    id: "unitel-exchange",
    name: "Unitel Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Kwattaweg 115, Paramaribo",
  },
  {
    id: "hj-de-vries-exchange",
    name: "H.J. de Vries Exchange N.V.",
    district: "Paramaribo",
    locationLabel: "Waterkant 90-94, Paramaribo",
  },
];

function randomDelta(max = 0.08) {
  return Math.random() * max - max / 2;
}

function seedHistory(mid) {
  const points = [];
  let cursor = mid;
  for (let i = 0; i < 7; i += 1) {
    cursor = Number((cursor + randomDelta()).toFixed(3));
    points.push(cursor);
  }
  return points;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRate(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasCompleteQuote(buy, sell) {
  return buy !== null && sell !== null;
}

function resolveCurrencyRate({
  liveCurrency,
  previousCurrency,
  defaultSource,
  defaultTrust,
  updatedAt,
}) {
  const incomingBuy = parseRate(liveCurrency.buy);
  const incomingSell = parseRate(liveCurrency.sell);
  const hasIncomingQuote = hasCompleteQuote(incomingBuy, incomingSell);
  const previousBuy = previousCurrency?.buy ?? null;
  const previousSell = previousCurrency?.sell ?? null;
  const previousHasQuote = hasCompleteQuote(previousBuy, previousSell);

  const preservePrevious =
    !hasIncomingQuote &&
    previousCurrency &&
    previousHasQuote &&
    CUSTOM_OVERRIDE_SOURCES.has(previousCurrency.source);

  const buy = preservePrevious ? previousBuy : incomingBuy;
  const sell = preservePrevious ? previousSell : incomingSell;
  const mid = hasCompleteQuote(buy, sell) ? Number(((buy + sell) / 2).toFixed(3)) : null;

  let history = [];
  if (preservePrevious) {
    history = previousCurrency.history || [];
  } else if (mid !== null) {
    history = previousCurrency ? [...(previousCurrency.history || []).slice(-6), mid] : seedHistory(mid);
  } else {
    history = previousCurrency?.history || [];
  }

  return {
    buy,
    sell,
    previousBuy: previousCurrency ? previousBuy : buy,
    previousSell: previousCurrency ? previousSell : sell,
    history,
    source: preservePrevious ? previousCurrency.source : liveCurrency.source || defaultSource,
    trustScore: preservePrevious
      ? toNumber(previousCurrency.trustScore, defaultTrust)
      : toNumber(liveCurrency.trustScore, defaultTrust),
    lastSourceUpdate: preservePrevious
      ? previousCurrency.lastSourceUpdate || previousCurrency.updatedAt || updatedAt
      : updatedAt,
  };
}

function mapLiveItemToInternal(liveItem, previousItem) {
  const updatedAt = liveItem.updatedAt || new Date().toISOString();
  const usd = liveItem.rates?.USD || {};
  const eur = liveItem.rates?.EUR || {};
  const defaultSource = liveItem.source || "Official Site";
  const defaultTrust = toNumber(liveItem.trustScore, 100);

  const prevUsd = previousItem?.rates?.USD;
  const prevEur = previousItem?.rates?.EUR;
  const normalizedUsd = resolveCurrencyRate({
    liveCurrency: usd,
    previousCurrency: prevUsd,
    defaultSource,
    defaultTrust,
    updatedAt,
  });
  const normalizedEur = resolveCurrencyRate({
    liveCurrency: eur,
    previousCurrency: prevEur,
    defaultSource,
    defaultTrust,
    updatedAt,
  });

  return {
    id: liveItem.id,
    name: liveItem.name,
    district: liveItem.district || "Paramaribo",
    locationLabel: liveItem.locationLabel || "",
    mapsQuery: liveItem.mapsQuery || liveItem.locationLabel || `${liveItem.name} Suriname`,
    whatsappNumber: liveItem.whatsappNumber || "5978889999",
    coordinates: liveItem.coordinates || null,
    businessHours: liveItem.businessHours || { ...DEFAULT_BUSINESS_HOURS },
    rates: {
      USD: normalizedUsd,
      EUR: normalizedEur,
    },
    viewsToday: Math.max(0, (previousItem?.viewsToday ?? 140) + Math.floor(Math.random() * 6)),
    updatedAt,
  };
}

function buildFallbackRates() {
  const now = new Date().toISOString();
  const baseRates = [
    {
      id: "cme",
      name: "Central Money Exchange (CME)",
      district: "Paramaribo",
      locationLabel: "Saramaccastraat 2, Paramaribo",
      mapsQuery: "Saramaccastraat 2 Paramaribo Suriname",
      whatsappNumber: "597426680",
      coordinates: { lat: 5.8269, lng: -55.1661 },
      businessHours: { ...DEFAULT_BUSINESS_HOURS },
      rates: {
        USD: {
          buy: 37.55,
          sell: 37.75,
          previousBuy: 37.55,
          previousSell: 37.75,
          history: seedHistory(37.65),
          source: "Official Site",
          trustScore: 100,
          lastSourceUpdate: now,
        },
        EUR: {
          buy: 42.5,
          sell: 43.45,
          previousBuy: 42.5,
          previousSell: 43.45,
          history: seedHistory(42.98),
          source: "Official Site",
          trustScore: 100,
          lastSourceUpdate: now,
        },
      },
      viewsToday: 210,
      updatedAt: now,
    },
  ];

  const registerRates = fallbackRegisterCambios.map((entry, index) => {
    return {
      id: entry.id,
      name: entry.name,
      district: entry.district,
      locationLabel: entry.locationLabel,
      mapsQuery: `${entry.locationLabel} Suriname`,
      whatsappNumber: "5978889999",
      coordinates: null,
      businessHours: { ...DEFAULT_BUSINESS_HOURS },
      rates: {
        USD: {
          buy: null,
          sell: null,
          previousBuy: null,
          previousSell: null,
          history: [],
          source: CBVS_REGISTER_SOURCE,
          trustScore: 0,
          lastSourceUpdate: now,
        },
        EUR: {
          buy: null,
          sell: null,
          previousBuy: null,
          previousSell: null,
          history: [],
          source: CBVS_REGISTER_SOURCE,
          trustScore: 0,
          lastSourceUpdate: now,
        },
      },
      viewsToday: 120 + index,
      updatedAt: now,
    };
  });

  return [...baseRates, ...registerRates];
}

async function getLivePayload() {
  const response = await fetch(LIVE_RATES_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Live rates request failed (${response.status})`);
  }
  return response.json();
}

function keepCustomEntries(currentRates, liveIds) {
  if (!Array.isArray(currentRates)) return [];
  return currentRates.filter((item) => {
    if (liveIds.has(item.id)) return false;
    const usdSource = item?.rates?.USD?.source || "";
    return (
      usdSource === "Admin Added" ||
      usdSource === "Admin Updated" ||
      usdSource === "Business Portal" ||
      usdSource === "Cambio Owner Portal" ||
      usdSource === "Community Verified" ||
      usdSource === "User Reported"
    );
  });
}

export function createCambioEntry({
  id,
  name,
  district,
  locationLabel,
  mapsQuery,
  whatsappNumber,
  coordinates,
  usdBuy = 39.2,
  usdSell = 39.8,
  eurBuy = 42.5,
  eurSell = 43.2,
}) {
  const now = new Date().toISOString();
  const usdMid = Number(((usdBuy + usdSell) / 2).toFixed(3));
  const eurMid = Number(((eurBuy + eurSell) / 2).toFixed(3));

  return {
    id,
    name,
    district,
    locationLabel,
    mapsQuery: mapsQuery || `${locationLabel} Suriname`,
    whatsappNumber: whatsappNumber || "5978889999",
    coordinates: coordinates || null,
    rates: {
      USD: {
        buy: usdBuy,
        sell: usdSell,
        previousBuy: usdBuy,
        previousSell: usdSell,
        history: seedHistory(usdMid),
        source: "Admin Added",
        trustScore: 100,
        lastSourceUpdate: now,
      },
      EUR: {
        buy: eurBuy,
        sell: eurSell,
        previousBuy: eurBuy,
        previousSell: eurSell,
        history: seedHistory(eurMid),
        source: "Admin Added",
        trustScore: 100,
        lastSourceUpdate: now,
      },
    },
    viewsToday: 0,
    updatedAt: now,
  };
}

export async function fetchInitialMarketRates() {
  try {
    const payload = await getLivePayload();
    return payload.rates.map((item) => mapLiveItemToInternal(item, null));
  } catch {
    return buildFallbackRates();
  }
}

export async function refreshMarketRates(currentRates) {
  try {
    const payload = await getLivePayload();
    const previousMap = new Map((currentRates || []).map((item) => [item.id, item]));
    const liveList = payload.rates.map((item) => mapLiveItemToInternal(item, previousMap.get(item.id)));

    const liveIds = new Set(liveList.map((item) => item.id));
    const customEntries = keepCustomEntries(currentRates, liveIds);
    return [...liveList, ...customEntries];
  } catch {
    if (currentRates?.length) {
      return currentRates;
    }
    return buildFallbackRates();
  }
}

export async function fetchOfficialVsParallelSnapshot(marketRates) {
  try {
    const response = await fetch(OFFICIAL_PARALLEL_ENDPOINT);
    if (!response.ok) {
      throw new Error("Official vs parallel endpoint failed");
    }
    const payload = await response.json();
    return {
      official: {
        USD: payload.official.USD,
        EUR: payload.official.EUR,
        updatedAt: payload.official.updatedAt || new Date().toISOString(),
      },
      parallelMarket: {
        USD: payload.parallelMarket.USD,
        EUR: payload.parallelMarket.EUR,
        updatedAt: payload.parallelMarket.updatedAt || new Date().toISOString(),
      },
    };
  } catch {
    const source = (marketRates || []).filter((item) =>
      hasCompleteQuote(item?.rates?.USD?.buy ?? null, item?.rates?.USD?.sell ?? null) &&
      hasCompleteQuote(item?.rates?.EUR?.buy ?? null, item?.rates?.EUR?.sell ?? null)
    );
    const divisor = source.length || 1;
    const avgUsdBuy = source.length
      ? source.reduce((sum, item) => sum + item.rates.USD.buy, 0) / divisor
      : null;
    const avgUsdSell = source.length
      ? source.reduce((sum, item) => sum + item.rates.USD.sell, 0) / divisor
      : null;
    const avgEurBuy = source.length
      ? source.reduce((sum, item) => sum + item.rates.EUR.buy, 0) / divisor
      : null;
    const avgEurSell = source.length
      ? source.reduce((sum, item) => sum + item.rates.EUR.sell, 0) / divisor
      : null;

    return {
      official: {
        USD: { buy: avgUsdBuy, sell: avgUsdSell },
        EUR: { buy: avgEurBuy, sell: avgEurSell },
        updatedAt: new Date().toISOString(),
      },
      parallelMarket: {
        USD: { buy: avgUsdBuy, sell: avgUsdSell },
        EUR: { buy: avgEurBuy, sell: avgEurSell },
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

export async function fetchGoldSpotRate() {
  const response = await fetch(GOLD_SPOT_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Gold spot request failed (${response.status})`);
  }

  const payload = await response.json();
  const priceUsd = Number(payload?.priceUsd);
  if (!Number.isFinite(priceUsd)) {
    throw new Error("Gold spot payload invalid");
  }

  return {
    symbol: payload.symbol || "XAUUSD",
    name: payload.name || "Gold",
    priceUsd,
    updatedAt: payload.updatedAt || new Date().toISOString(),
    source: payload.source || "Unknown",
  };
}

export function buildTimelineFromNow(days = 7) {
  return Array.from({ length: days }).map((_, index) => {
    const offset = days - 1 - index;
    return new Date(Date.now() - offset * oneDayMs);
  });
}

/*
If you later want a production backend, keep these endpoints in your API layer:
- GET /api/rates/live
- GET /api/rates/official-vs-parallel
*/
