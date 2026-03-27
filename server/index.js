import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { fetchCbvsOfficial } from "./sources/cbvs.js";
import { appendCbvsRegisterEntries } from "./sources/cbvsRegister.js";
import { fetchCme } from "./sources/cme.js";
import { fetchDsb } from "./sources/dsb.js";
import { fetchHakrin } from "./sources/hakrin.js";
import { average, isoNow } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "../dist");
const PORT = Number(process.env.PORT) || 8787;
const app = express();
app.use(cors());
app.use(express.json());

const CACHE_TTL_MS = 3_600_000;
let liveCache = { ts: 0, payload: null };
let officialCache = { ts: 0, payload: null };

async function fetchLiveMarketWithResilience() {
  const tasks = [
    { key: "cme", fn: fetchCme },
    { key: "dsb", fn: fetchDsb },
    { key: "hakrinbank", fn: fetchHakrin },
  ];

  const settled = await Promise.allSettled(tasks.map((task) => task.fn()));
  const rates = [];
  const errors = [];

  settled.forEach((result, index) => {
    const task = tasks[index];
    if (result.status === "fulfilled") {
      rates.push(result.value);
    } else {
      errors.push({
        source: task.key,
        message: result.reason?.message || "Unknown fetch error",
      });
    }
  });

  if (!rates.length) {
    throw new Error("No live market source available");
  }

  const generatedAt = isoNow();
  return {
    generatedAt,
    rates: appendCbvsRegisterEntries(rates, generatedAt),
    errors,
  };
}

async function getLiveMarket() {
  const now = Date.now();
  if (liveCache.payload && now - liveCache.ts < CACHE_TTL_MS) {
    return liveCache.payload;
  }
  const payload = await fetchLiveMarketWithResilience();
  liveCache = { ts: now, payload };
  return payload;
}

async function fetchOfficialVsParallel() {
  const [marketPayload, cbvsOfficial] = await Promise.all([getLiveMarket(), fetchCbvsOfficial()]);
  const directLiveSources = marketPayload.rates.filter(
    (item) => item?.rates?.USD?.source !== "CBvS Register"
  );
  const marketRates = directLiveSources.length ? directLiveSources : marketPayload.rates;

  const usdBuy = average(marketRates.map((item) => item.rates.USD.buy));
  const usdSell = average(marketRates.map((item) => item.rates.USD.sell));
  const eurBuy = average(marketRates.map((item) => item.rates.EUR.buy));
  const eurSell = average(marketRates.map((item) => item.rates.EUR.sell));

  return {
    generatedAt: isoNow(),
    official: {
      USD: cbvsOfficial.USD,
      EUR: cbvsOfficial.EUR,
      updatedAt: cbvsOfficial.updatedAt,
      sourceUrl: cbvsOfficial.sourceUrl,
    },
    parallelMarket: {
      USD: {
        buy: Number(usdBuy.toFixed(3)),
        sell: Number(usdSell.toFixed(3)),
      },
      EUR: {
        buy: Number(eurBuy.toFixed(3)),
        sell: Number(eurSell.toFixed(3)),
      },
      updatedAt: marketPayload.generatedAt,
    },
    sourcesUsed: marketRates.map((item) => item.id),
  };
}

async function getOfficialVsParallel() {
  const now = Date.now();
  if (officialCache.payload && now - officialCache.ts < CACHE_TTL_MS) {
    return officialCache.payload;
  }
  const payload = await fetchOfficialVsParallel();
  officialCache = { ts: now, payload };
  return payload;
}

app.get("/api/rates/live", async (_req, res) => {
  try {
    const payload = await getLiveMarket();
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: "LIVE_RATES_UNAVAILABLE",
      message: error?.message || "Failed to fetch live rates",
    });
  }
});

app.get("/api/rates/official-vs-parallel", async (_req, res) => {
  try {
    const payload = await getOfficialVsParallel();
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: "OFFICIAL_PARALLEL_UNAVAILABLE",
      message: error?.message || "Failed to fetch official vs parallel snapshot",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    generatedAt: isoNow(),
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(DIST_DIR));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Koersen app listening on http://0.0.0.0:${PORT}`);
});
