import { toNumber } from "../utils.js";

const CME_ENDPOINT = "https://www.cme.sr/Home/GetTodaysExchangeRates/?BusinessDate=2016-07-25";

function parseCmeUpdatedAt(record) {
  const datePart = record?.BusinessDate ? String(record.BusinessDate).trim() : "";
  const timePart = record?.UpdatedTime ? String(record.UpdatedTime).trim() : "";
  const parsed = Date.parse(`${datePart} ${timePart}`);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

export async function fetchCme() {
  const response = await fetch(CME_ENDPOINT, { method: "POST" });
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
    updatedAt: parseCmeUpdatedAt(row),
    sourceUrl: "https://www.cme.sr/",
    rates: {
      USD: { buy: usdBuy, sell: usdSell },
      EUR: { buy: eurBuy, sell: eurSell },
    },
  };
}
