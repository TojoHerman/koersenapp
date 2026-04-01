import { toNumber } from "../utils.js";

const CME_ENDPOINT = "https://www.cme.sr/Home/GetTodaysExchangeRates/?BusinessDate=2016-07-25";
const CME_HOME = "https://www.cme.sr/";

function buildCmeHeaders(cookie = "") {
  const headers = {
    accept: "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9",
    origin: CME_HOME.replace(/\/$/, ""),
    referer: CME_HOME,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
  };

  if (cookie) {
    headers.cookie = cookie;
  }

  return headers;
}

function extractCookieHeader(response) {
  const setCookies = response.headers.getSetCookie?.() || [];
  if (!setCookies.length) return "";
  return setCookies.map((cookieLine) => cookieLine.split(";")[0]).join("; ");
}

function parseCmeUpdatedAt(record) {
  const datePart = record?.BusinessDate ? String(record.BusinessDate).trim() : "";
  const timePart = record?.UpdatedTime ? String(record.UpdatedTime).trim() : "";
  const parsed = Date.parse(`${datePart} ${timePart}`);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

function createCmeRate({ usdBuy, usdSell, eurBuy, eurSell, updatedAt }) {
  return {
    id: "cme",
    name: "Central Money Exchange (CME)",
    district: "Paramaribo",
    locationLabel: "Saramaccastraat 2, Paramaribo",
    mapsQuery: "Saramaccastraat 2 Paramaribo Suriname",
    whatsappNumber: "597426680",
    coordinates: { lat: 5.8269, lng: -55.1661 },
    businessHours: {
      mon: "08:00-17:00",
      tue: "08:00-17:00",
      wed: "08:00-17:00",
      thu: "08:00-17:00",
      fri: "08:00-17:00",
      sat: "08:00-13:00",
      sun: "closed",
    },
    updatedAt,
    sourceUrl: "https://www.cme.sr/",
    rates: {
      USD: { buy: usdBuy, sell: usdSell },
      EUR: { buy: eurBuy, sell: eurSell },
    },
  };
}

export function createCmeFallbackRate() {
  return createCmeRate({
    usdBuy: 37.55,
    usdSell: 37.75,
    eurBuy: 42.5,
    eurSell: 43.45,
    updatedAt: new Date().toISOString(),
  });
}

export async function fetchCme() {
  let response = await fetch(CME_ENDPOINT, {
    method: "POST",
    headers: buildCmeHeaders(),
  });

  // Render datacenter traffic can be blocked unless we first establish a session cookie.
  if (response.status === 403) {
    const homeResponse = await fetch(CME_HOME, { headers: buildCmeHeaders() });
    const cookieHeader = extractCookieHeader(homeResponse);
    response = await fetch(CME_ENDPOINT, {
      method: "POST",
      headers: buildCmeHeaders(cookieHeader),
    });
  }

  if (!response.ok) {
    throw new Error(`CME request failed (${response.status})`);
  }

  const payload = await response.json();
  const row = Array.isArray(payload) ? payload[0] : null;
  if (!row) {
    throw new Error("CME payload empty");
  }

  const usdBuy = toNumber(row.BuyUsdExchangeRate);
  const usdSell = toNumber(row.SaleUsdExchangeRate);
  const eurBuy = toNumber(row.BuyEuroExchangeRate);
  const eurSell = toNumber(row.SaleEuroExchangeRate);
  if ([usdBuy, usdSell, eurBuy, eurSell].some((value) => value === null)) {
    throw new Error("CME rates invalid");
  }

  return createCmeRate({
    usdBuy,
    usdSell,
    eurBuy,
    eurSell,
    updatedAt: parseCmeUpdatedAt(row),
  });
}
