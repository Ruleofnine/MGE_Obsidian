"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
interface RollResult {
  hits: number;
  ones: number;
  sixes: number;
  yes: boolean;
  exceptional: "none" | "yes" | "no";
  suffix: "none" | "and" | "but";
  text: string;   // e.g., "Exceptional Yes, and" (major flags appended)
  dice: number[]; // raw dice if you want to show them
}
type Trend = "Calming" | "Maintaining" | "Escalating";
function rollPool(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(1 + Math.floor(Math.random() * 6));
  return out;
}
function isHit(face: number, trend: Trend): boolean {
  if (trend === "Calming") return face === 6;
  if (trend === "Maintaining") return face >= 5;
  return face >= 4; // Escalating
}

export function resolveRoll(n: number, trend: Trend, k: number): RollResult {
  const dice = rollPool(n);
  const ones = dice.filter(d => d === 1).length;
  const sixes = dice.filter(d => d === 6).length;
  const hits  = dice.filter(d => isHit(d, trend)).length;

  const yes = hits >= k;

  // Exceptional (independent)
  let exceptional: RollResult["exceptional"] = "none";
  if (hits === 0) exceptional = "no";
  else if (hits >= k + 2 || hits === n) exceptional = "yes";

  // Boon/Complication thresholds
  const boon    = sixes >= Math.ceil(n / 3);
  const majorBoon = sixes >= Math.ceil(n / 2);
  const comp    = ones  >= Math.ceil(n / 3);
  const majorComp = ones  >= Math.ceil(n / 2);

  // Suffix selection
  let suffix: RollResult["suffix"] = "none";
  if (boon && !comp) suffix = "and";
  else if (!boon && comp) suffix = "but";
  else if (boon && comp) {
    if (sixes > ones) suffix = "and";
    else if (ones > sixes) suffix = "but";
    else suffix = Math.random() < 0.5 ? "and" : "but";
  }

  // Compose text
  const base = yes ? "Yes" : "No";
  const exc  = exceptional === "yes" ? "Exceptional " :
               exceptional === "no"  ? "Exceptional " : "";
  const suff = suffix === "none" ? "" : (suffix === "and" ? ", and" : ", but");
  const majors = [
    suffix === "and" && majorBoon ? "(major)" : "",
    suffix === "but" && majorComp ? "(major)" : ""
  ].filter(Boolean).join(" ");

  const text = `${exc}${base}${suff}${majors ? " " + majors : ""}`;

  return { hits, ones, sixes, yes, exceptional, suffix, majorBoon, majorComplication: majorComp, text, dice };
}
*/
