export const CBVS_REGISTER_SOURCE_URL =
  "https://www.cbvs.sr/images/content/publicaties/DTK_2023/ToezichtWisselkantorenNGeldovermakingskantoren_web_dec2022.pdf";
const DEFAULT_BUSINESS_HOURS = Object.freeze({
  mon: "08:00-17:00",
  tue: "08:00-17:00",
  wed: "08:00-17:00",
  thu: "08:00-17:00",
  fri: "08:00-17:00",
  sat: "08:00-13:00",
  sun: "closed",
});

const CBVS_REGISTER_CAMBIOS = [
  {
    id: "dallex",
    name: "Dallex N.V.",
    district: "Paramaribo",
    locationLabel: "Tourtonnelaan 246, Paramaribo",
  },
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
  {
    id: "exces",
    name: "EXCES N.V.",
    district: "Paramaribo",
    locationLabel: "Flustraat 7, Paramaribo",
  },
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
  {
    id: "surora",
    name: "Surora N.V.",
    district: "Paramaribo",
    locationLabel: "Mahonylaan 41, Paramaribo",
  },
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

export function appendCbvsRegisterEntries(liveRates, generatedAt) {
  if (!Array.isArray(liveRates) || !liveRates.length) {
    return [];
  }

  const existingIds = new Set(liveRates.map((item) => item.id));

  const registerEntries = CBVS_REGISTER_CAMBIOS.filter((entry) => !existingIds.has(entry.id)).map(
    (entry) => {
      return {
        ...entry,
        mapsQuery: `${entry.locationLabel} Suriname`,
        sourceUrl: CBVS_REGISTER_SOURCE_URL,
        businessHours: { ...DEFAULT_BUSINESS_HOURS },
        updatedAt: generatedAt,
        rates: {
          USD: {
            buy: null,
            sell: null,
            source: "CBvS Register",
            trustScore: 0,
          },
          EUR: {
            buy: null,
            sell: null,
            source: "CBvS Register",
            trustScore: 0,
          },
        },
      };
    }
  );

  return [...liveRates, ...registerEntries];
}
