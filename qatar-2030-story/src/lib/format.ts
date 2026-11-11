const nf0 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** Shortfall: always 2 decimals, explicit sign for negatives, never a % sign. */
export function fmtShortfall(v: number, signed = false): string {
  const s = Math.abs(v) < 0.005 ? 0 : v;
  const t = s.toFixed(2);
  if (s > 0 && signed) return `+${t}`;
  return s < 0 ? `−${Math.abs(s).toFixed(2)}` : t;
}
/** 0–1 score to 2 decimals. */
export const fmtScore = (v: number) => v.toFixed(2);
/** Share 0–1 → "16%" (or with decimals). */
export const fmtPct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
export const fmtInt = (v: number) => nf0.format(v);
export const plural = (n: number, one: string, many = `${one}s`) => `${fmtInt(n)} ${n === 1 ? one : many}`;

/** Lower-case the first letter for use mid-sentence, unless it starts an acronym ("AI policy"). */
export function lowerFirst(s: string): string {
  if (s.length > 1 && s[1] === s[1].toUpperCase() && /[A-Z]/.test(s[1])) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
/** "a, b and c" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
