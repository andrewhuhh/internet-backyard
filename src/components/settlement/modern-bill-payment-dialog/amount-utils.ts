import { MAX_AMOUNT_CENTS } from "./constants";

export function formatAmountDisplay(cents: number) {
  if (cents <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatAmountInput(raw: string) {
  let s = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = s.indexOf(".");
  if (dotIndex !== -1) {
    const int = s.slice(0, dotIndex);
    const frac = s.slice(dotIndex + 1).replace(/\./g, "");
    s = int + "." + frac.slice(0, 2);
  }
  if (s.startsWith(".")) s = `0${s}`;
  const parts = s.split(".");
  if (parts[0].length > 12) parts[0] = parts[0].slice(0, 12);
  s = parts.join(".");

  if (!s) return "";

  const intPart = parts[0];
  let formatted = intPart ? new Intl.NumberFormat("en-US").format(Number(intPart)) : "0";

  if (parts.length > 1) {
    const frac = parts[1];
    if (frac) formatted += `.${frac}`;
    if (s.endsWith(".")) formatted += ".";
  }

  return formatted;
}

export function parseAmountInput(raw: string) {
  const dollars = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.min(Math.round(dollars * 100), MAX_AMOUNT_CENTS);
}

export function amountFontSizeStyle(displayLength: number) {
  const chars = Math.max(displayLength, 1);
  return {
    fontSize: `min(var(--mbp-amount-font-max), max(var(--mbp-amount-font-min), calc(var(--mbp-amount-font-row) * 1rem / ${chars})))`,
  };
}
