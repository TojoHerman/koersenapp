import { toNumber } from "../utils.js";

const DSB_ENDPOINT = "https://service.dsbtools.com/exchange/rates";

function parseDsbUpdatedAt(node) {
  const datePart = node?.updated_on ? String(node.updated_on).trim() : "";
  const timePart = node?.updated_on_time ? String(node.updated_on_time).trim() : "";
  const parsed = Date.parse(`${datePart}T${timePart}`);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

export async function fetchDsb() {
  const response = await fetch(DSB_ENDPOINT);
  if (!response.ok) {
    throw new Error(`DSB request failed (${response.status})`);
  }

  const payload = await response.json();
  const usd = payload?.valuta?.USD;
  const eur = payload?.valuta?.EUR;
  if (!usd || !eur) {
    throw new Error("DSB payload missing valuta rates");
  }

  const usdBuy = toNumber(usd.buy);
  const usdSell = toNumber(usd.sell);
  const eurBuy = toNumber(eur.buy);
  const eurSell = toNumber(eur.sell);
  if ([usdBuy, usdSell, eurBuy, eurSell].some((value) => value === null)) {
    throw new Error("DSB rates invalid");
  }

  return {
    id: "dsb",
    name: "DSB Foreign Exchange",
    district: "Paramaribo",
    locationLabel: "Henck Arronstraat 26, Paramaribo",
    mapsQuery: "Henck Arronstraat 26 Paramaribo Suriname",
    whatsappNumber: "597471100",
    coordinates: { lat: 5.8249, lng: -55.1661 },
    businessHours: {
      mon: "08:00-17:00",
      tue: "08:00-17:00",
      wed: "08:00-17:00",
      thu: "08:00-17:00",
      fri: "08:00-17:00",
      sat: "08:00-13:00",
      sun: "closed",
    },
    updatedAt: parseDsbUpdatedAt(usd),
    sourceUrl: "https://www.dsb.sr/",
    rates: {
      USD: { buy: usdBuy, sell: usdSell },
      EUR: { buy: eurBuy, sell: eurSell },
    },
  };
}
