import * as cheerio from "cheerio";
import { toNumber } from "../utils.js";

const CBVS_ENDPOINT = "https://www.cbvs.sr/";

const dutchMonthMap = {
  januari: 0,
  februari: 1,
  maart: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  augustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11,
};

function parseCbvsUpdatedAt(label) {
  const normalized = label.toLowerCase().trim();
  const match = normalized.match(/(\d{1,2})\s+([a-z]+)/i);
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/);
  const year = new Date().getFullYear();

  if (!match) return new Date().toISOString();

  const day = Number(match[1]);
  const month = dutchMonthMap[match[2]] ?? new Date().getMonth();
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;
  return new Date(year, month, day, hour, minute).toISOString();
}

function findCbvsMainTable($) {
  const tables = $("table.exchange-table").toArray();
  for (const table of tables) {
    const headerText = $(table).find("th.currency-type-header").first().text().toLowerCase();
    if (headerText.includes("gewogen gemiddelde wisselkoersen")) {
      return $(table);
    }
  }
  return null;
}

export async function fetchCbvsOfficial() {
  const response = await fetch(CBVS_ENDPOINT);
  if (!response.ok) {
    throw new Error(`CBvS request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const table = findCbvsMainTable($);
  if (!table) {
    throw new Error("CBvS weighted exchange table not found");
  }

  const headerDateLabel = table.find("thead tr").eq(1).find("th").first().text().replace(/\s+/g, " ").trim();
  const rows = {};
  table.find("tbody tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().trim())
      .get();
    if (cells.length < 5) return;
    const code = cells[0];
    rows[code] = {
      giraalBuy: toNumber(cells[1]),
      giraalSell: toNumber(cells[2]),
      cashBuy: toNumber(cells[3]),
      cashSell: toNumber(cells[4]),
    };
  });

  if (!rows.USD || !rows.EUR) {
    throw new Error("CBvS USD/EUR rows unavailable");
  }

  return {
    updatedAt: parseCbvsUpdatedAt(headerDateLabel),
    sourceUrl: CBVS_ENDPOINT,
    USD: {
      buy: rows.USD.cashBuy,
      sell: rows.USD.cashSell,
    },
    EUR: {
      buy: rows.EUR.cashBuy,
      sell: rows.EUR.cashSell,
    },
  };
}
