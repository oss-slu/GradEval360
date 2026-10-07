import { randomBytes } from "crypto";

export function generateAppointmentCode(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  const rand = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `GEA-${y}${m}${d}-${rand}`;
}
