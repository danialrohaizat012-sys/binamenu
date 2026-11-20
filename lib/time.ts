// Waktu Malaysia (UTC+8, tiada waktu jimat siang)
const MYT = 8 * 60 * 60 * 1000;

export function startOfTodayMyt(now = new Date()) {
  const local = new Date(now.getTime() + MYT);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - MYT);
}

// Isnin minggu ini (waktu Malaysia), format YYYY-MM-DD
export function mondayMyt(now = new Date()) {
  const local = new Date(now.getTime() + MYT);
  const day = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - day);
  return local.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function timeMyt(iso: string) {
  return new Date(iso).toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
}

export function dateMyt(date: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("ms-MY", { ...opts, timeZone: "Asia/Kuala_Lumpur" });
}
