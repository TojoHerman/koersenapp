import { isoNow, toNumber } from "../utils.js";

const STOOQ_GOLD_ENDPOINT = "https://stooq.com/q/l/?s=xauusd&i=d";
const GOLD_API_ENDPOINT = "https://api.gold-api.com/price/XAU";

function parseStooqTimestamp(rawDate, rawTime) {
  const date = String(rawDate || "").trim();
  const time = String(rawTime || "").trim();
  if (!/^\d{8}$/.test(date) || !/^\d{6}$/.test(time)) {
    return isoNow();
  }

  const normalized = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(
    2,
    4
  )}:${time.slice(4, 6)}Z`;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? isoNow() : new Date(parsed).toISOString();
}

async function fetchFromStooq() {
  const response = await fetch(STOOQ_GOLD_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Stooq gold request failed (${response.status})`);
  }

  const csv = (await response.text()).trim();
  const [line] = csv.split(/\r?\n/).filter(Boolean);
  const parts = line ? line.split(",") : [];
  if (parts.length < 7) {
    throw new Error("Stooq gold payload invalid");
  }

  const symbol = String(parts[0] || "").trim();
  const priceUsd = toNumber(parts[6]);
  if (!priceUsd) {
    throw new Error("Stooq gold price missing");
  }

  return {
    symbol: symbol || "XAUUSD",
    name: "Gold",
    priceUsd,
    updatedAt: parseStooqTimestamp(parts[1], parts[2]),
    source: "Stooq",
    sourceUrl: "https://stooq.com",
  };
}

async function fetchFromGoldApi() {
  const response = await fetch(GOLD_API_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Gold API request failed (${response.status})`);
  }

  const payload = await response.json();
  const priceUsd = toNumber(payload?.price);
  if (!priceUsd) {
    throw new Error("Gold API payload invalid");
  }

  return {
    symbol: "XAUUSD",
    name: payload?.name || "Gold",
    priceUsd,
    updatedAt: payload?.updatedAt || isoNow(),
    source: "Gold API",
    sourceUrl: "https://api.gold-api.com",
  };
}

export async function fetchGoldSpot() {
  try {
    return await fetchFromStooq();
  } catch {
    return fetchFromGoldApi();
  }
}

