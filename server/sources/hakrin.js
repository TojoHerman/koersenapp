import * as cheerio from "cheerio";
import { toNumber } from "../utils.js";

const HAKRIN_ENDPOINT = "https://www.hakrinbank.com/";

function parseHakrinUpdatedAt(text) {
  const normalized = text.replace(/\u2013/g, "-").trim();
  const match = normalized.match(/(\d{2})\/(\d{2})\/(\d{4}).*?(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return new Date().toISOString();

  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const suffix = match[6].toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  return new Date(year, month, day, hour, minute).toISOString();
}

export async function fetchHakrin() {
  const response = await fetch(HAKRIN_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Hakrin request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const table = $("#tablepress-11");
  if (!table.length) {
    throw new Error("Hakrin rates table not found");
  }

  const rateRows = {};
  table.find("tbody tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();
    if (cells.length < 3) return;
    rateRows[cells[0]] = {
      buy: toNumber(cells[1]),
      sell: toNumber(cells[2]),
    };
  });

  if (!rateRows.USD || !rateRows.EUR) {
    throw new Error("Hakrin USD/EUR rates unavailable");
  }

  const updatedText = table.parent().find("p").first().text().trim();
  return {
    id: "hakrinbank",
    name: "Hakrinbank Treasury",
    district: "Paramaribo",
    locationLabel: "Kleine Waterstraat 1, Paramaribo",
    mapsQuery: "Kleine Waterstraat 1 Paramaribo Suriname",
    whatsappNumber: "597477722",
    coordinates: { lat: 5.8275, lng: -55.1576 },
    businessHours: {
      mon: "08:00-17:00",
      tue: "08:00-17:00",
      wed: "08:00-17:00",
      thu: "08:00-17:00",
      fri: "08:00-17:00",
      sat: "08:00-13:00",
      sun: "closed",
    },
    updatedAt: parseHakrinUpdatedAt(updatedText),
    sourceUrl: "https://www.hakrinbank.com/",
    rates: {
      USD: rateRows.USD,
      EUR: rateRows.EUR,
    },
  };
}
