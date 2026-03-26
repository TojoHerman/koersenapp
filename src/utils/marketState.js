export const STALE_THRESHOLD_MS = 90 * 60 * 1000;

export const DEFAULT_BUSINESS_HOURS = Object.freeze({
  mon: "08:00-17:00",
  tue: "08:00-17:00",
  wed: "08:00-17:00",
  thu: "08:00-17:00",
  fri: "08:00-17:00",
  sat: "08:00-13:00",
  sun: "closed",
});

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseMinutes(token) {
  if (!token) return null;
  const match = String(token).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function isInsideWindow(currentMinutes, startMinutes, endMinutes) {
  if (startMinutes === endMinutes) return true;
  if (endMinutes > startMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

export function isRateStale(updatedAt, thresholdMs = STALE_THRESHOLD_MS) {
  if (!updatedAt) return true;
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > thresholdMs;
}

export function isCambioOpenNow(businessHours, now = new Date()) {
  if (!businessHours || typeof businessHours !== "object") return null;

  const dayKey = dayKeys[now.getDay()];
  const slotRaw = businessHours[dayKey];
  if (!slotRaw) return null;

  const slot = String(slotRaw).trim().toLowerCase();
  if (!slot || slot === "closed") return false;
  if (slot === "24h") return true;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const windows = slot.split(",").map((item) => item.trim());

  for (const window of windows) {
    const [startRaw, endRaw] = window.split("-").map((part) => part.trim());
    const start = parseMinutes(startRaw);
    const end = parseMinutes(endRaw);
    if (start === null || end === null) continue;
    if (isInsideWindow(currentMinutes, start, end)) return true;
  }

  return false;
}
