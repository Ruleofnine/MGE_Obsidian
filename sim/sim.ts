
import { randomInt } from "crypto";
import { ChaosFactor, Tension, Probability, OracleState } from "../src/lib/types";
import { RollResult, RollResolver, Exceptional,rollOdds } from '../src/systems/chaosEngine';
// --- core sim loop ---
function simulate(trials: number, state: OracleState) {
	let yes = 0, no = 0, exMinorNo = 0, exMajorNo = 0, event = 0, exMinorYes = 0, exMajorYes = 0;

	for (let i = 0; i < trials; i++) {
		let roll = RollResult.rollD10000();
		let resolved_roll = RollResolver.resolveRoll(state, roll);
		if (resolved_roll.eventTriggered) event++;
		if (resolved_roll.yes) yes++;
		else no++;
		switch (resolved_roll.exceptional) {
			case Exceptional.Minor:
				if (resolved_roll.yes) {
					exMinorYes++
				} else {
					exMinorNo++
				}
			    break;
			case Exceptional.Major:
				if (resolved_roll.yes) {
					exMajorYes++
				} else {
					exMajorNo++
				}
			    break;
		}
	}

	console.log("===PROJECTED ODDS===");
	rollOdds(state);
	console.log("===SIMULATED ODDS===");
	console.log(`Trials: ${trials}`);
	console.log(`Exceptional Major Yes: ${(exMajorYes / trials * 100).toFixed(2)}%`);
	console.log(`Exceptional Minor Yes: ${(exMinorYes / trials * 100).toFixed(2)}%`);
	console.log(`Yes: ${(yes / trials * 100).toFixed(2)}%`);
	console.log(`No: ${(no / trials * 100).toFixed(2)}%`);
	console.log(`Exceptional Minor No: ${(exMinorNo / trials * 100).toFixed(2)}%`);
	console.log(`Exceptional Major No: ${(exMajorNo / trials * 100).toFixed(2)}%`);
	console.log(`Event: ${(event / trials * 100).toFixed(2)}%`);
	console.log("====================");
}

// run one sim
const state: OracleState = {
	probability: Probability.Inevitable,
	cf: ChaosFactor.Pandemonium,
	tension: Tension.FullTilt,
};

console.log("Starting");
console.log(state);
simulate(15_000_000, state);
