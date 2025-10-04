
import { randomInt } from "crypto";
import { ChaosFactor, Tension, Probability, OracleState } from "../src/lib/types";
import { RollResult, RollResolver,Exceptional } from '../src/systems/chaosEngine';
// --- core sim loop ---
function simulate(trials: number, state: OracleState) {
  let yes = 0, no = 0, exMinor = 0, exMajor = 0, event = 0,but=0;

  for (let i = 0; i < trials; i++) {
    let roll = RollResult.rollD1000();
	let resolved_roll = RollResolver.resolveRoll(state, roll);
	if (resolved_roll.but) but++;
	if (resolved_roll.eventTriggered) event++;
    if (resolved_roll.yes) yes++;
    else no++;
    if (resolved_roll.exceptional === Exceptional.Minor) exMinor++;
    if (resolved_roll.exceptional === Exceptional.Major) exMajor++;
  }

  console.log(`Trials: ${trials}`);
  console.log(`Yes: ${(yes / trials * 100).toFixed(2)}%`);
  console.log(`No: ${(no / trials * 100).toFixed(2)}%`);
  console.log(`But: ${(but / trials * 100).toFixed(2)}%`);
  console.log(`Exceptional Minor: ${(exMinor / trials * 100).toFixed(2)}%`);
  console.log(`Exceptional Major: ${(exMajor / trials * 100).toFixed(2)}%`);
  console.log(`Event: ${(event / trials * 100).toFixed(2)}%`);
}

// run one sim
const state: OracleState = {
  probability: Probability.Unfathomable,
  cf: ChaosFactor.Pandemonium,
  tension: Tension.LockedIn,
};

console.log("Starting");
console.log(state);
simulate(1_000_000, state);
