import { randomInt } from 'crypto';
function assertNever(x: never): never {
	throw new Error("Unexpected object: " + x);
}
import { ChaosFactor, Tension, Probability, OracleState } from "../lib/types";
const probabilityThresholds: Record<Probability, number> = {
	[Probability.Inevitable]: 5,
	[Probability.Certain]: 25,
	[Probability.HasToBe]: 50,
	[Probability.SureThing]: 150,
	[Probability.Probable]: 250,
	[Probability.Likely]: 350,
	[Probability._5050]: 500,
	[Probability.Unlikely]: 650,
	[Probability.Dubious]: 750,
	[Probability.NoWay]: 850,
	[Probability.Ridiculous]: 950,
	[Probability.Impossible]: 975,
	[Probability.Unfathomable]: 995,
}
// ChaosFactor helpers
export namespace ChaosFactorUtils {
	export function isCalm(cf: ChaosFactor): boolean {
		return (
			cf === ChaosFactor.Peaceful ||
			cf === ChaosFactor.Serene ||
			cf === ChaosFactor.Calm
		);
	}

	export function isChaotic(cf: ChaosFactor): boolean {
		return (
			cf === ChaosFactor.Pandemonium ||
			cf === ChaosFactor.Havoc ||
			cf === ChaosFactor.Chaotic
		);
	}

	export function getCfMod(cf: ChaosFactor): number {
		switch (cf) {
			case ChaosFactor.Peaceful: return 75;
			case ChaosFactor.Serene: return 50;
			case ChaosFactor.Calm: return 25;
			case ChaosFactor.Stable: return 0;
			case ChaosFactor.Chaotic: return 50;
			case ChaosFactor.Havoc: return 100;
			case ChaosFactor.Pandemonium: return 200;
		}
	}
}

// Probability helpers
export namespace ProbabilityUtils {
	function updateThershold(threshold: number, change: number): number {
		threshold += change;
		return Math.max(Math.min(threshold, 995), 5);
	}
	export function isEasy(prob: Probability): boolean {
		return (
			prob === Probability.Inevitable ||
			prob === Probability.Certain ||
			prob === Probability.HasToBe ||
			prob === Probability.SureThing ||
			prob === Probability.Probable ||
			prob === Probability.Likely
		);
	}
	export function isHard(prob: Probability): boolean {
		return (
			prob === Probability.Unfathomable ||
			prob === Probability.Impossible ||
			prob === Probability.Ridiculous ||
			prob === Probability.NoWay ||
			prob === Probability.Dubious ||
			prob === Probability.Unlikely
		);
	}


	export function isNeutral(prob: Probability): boolean {
		return prob === Probability._5050
	}

	export function getSuccessThreshold(
		state: OracleState
	): number {
		let threshold = probabilityThresholds[state.probability];
		console.log("Base Threshold", threshold);
		let tensionMod = tensionProbMod(state);
		console.log("Tension Mod", tensionMod);
		const cf_mod = ChaosFactorUtils.getCfMod(state.cf);
		console.log("cf Mod", cf_mod);
		if (ProbabilityUtils.isHard(state.probability)) {
			if (ChaosFactorUtils.isChaotic(state.cf)) {
				threshold = updateThershold(threshold, -cf_mod);
			} else if (ChaosFactorUtils.isCalm(state.cf)) {
				threshold = updateThershold(threshold, cf_mod);
			}
		} else if (ProbabilityUtils.isEasy(state.probability)) {
			if (ChaosFactorUtils.isChaotic(state.cf)) {
				threshold = updateThershold(threshold, cf_mod);
			} else if (ChaosFactorUtils.isCalm(state.cf)) {
				threshold = updateThershold(threshold, -cf_mod);
			}

		}
		threshold = updateThershold(threshold, tensionMod);
		console.log("Final Threshold", threshold);
		return threshold;
	}
}


// -------------------- Exceptional --------------------
export enum Exceptional {
	Minor = "Minor",   // unusual, surprising, but not world-shaking
	Major = "Major",   // decisive, overwhelming, or catastrophic
}

// -------------------- RollResult --------------------
export class RollResult {
	hundreds: number;
	tens: number;
	ones: number;

	constructor(hundreds: number, tens: number, ones: number) {
		this.hundreds = hundreds;
		this.tens = tens;
		this.ones = ones;
	}

	toInt(): number {
		return this.ones + this.tens * 10 + this.hundreds * 100;
	}
	static exceptionalThreshold(state: OracleState, yes: boolean) {
		let majorThreshold: number;
		let minorThreshold: number;
		if (yes && [Probability.Inevitable, Probability.Certain].includes(state.probability)) {
			majorThreshold = 990;
			minorThreshold = 980;
		} else if (yes && [Probability.HasToBe, Probability.SureThing].includes(state.probability)) {
			majorThreshold = 980;
			minorThreshold = 970;
		} else if (yes && [Probability.Probable, Probability.Likely].includes(state.probability)) {
			majorThreshold = 970;
			minorThreshold = 960;
		} else if (yes && state.probability === Probability._5050) {
			majorThreshold = 960;
			minorThreshold = 950;
		} else if (yes && [Probability.Dubious, Probability.Unlikely].includes(state.probability)) {
			majorThreshold = 950;
			minorThreshold = 940;
		} else if (yes && [Probability.Ridiculous, Probability.NoWay].includes(state.probability)) {
			majorThreshold = 940;
			minorThreshold = 930;
		} else if (yes && [Probability.Unfathomable, Probability.Impossible].includes(state.probability)) {
			majorThreshold = 850;
			minorThreshold = 750;
		} else if (!yes && [Probability.Inevitable, Probability.Certain].includes(state.probability)) {
			majorThreshold = 800;
			minorThreshold = 700;
		} else if (!yes && [Probability.HasToBe, Probability.SureThing].includes(state.probability)) {
			majorThreshold =  700;
			minorThreshold =  650;
		} else if (!yes && [Probability.Probable, Probability.Likely].includes(state.probability)) {
			majorThreshold = 700;
			minorThreshold = 650;
		} else if (!yes && state.probability === Probability._5050) {
			majorThreshold = 925;
			minorThreshold = 900;
		} else if (!yes && [Probability.Dubious, Probability.Unlikely].includes(state.probability)) {
			majorThreshold = 975;
			minorThreshold = 975;
		} else if (!yes && [Probability.Ridiculous, Probability.NoWay].includes(state.probability)) {
			majorThreshold = 975;
			minorThreshold = 950;
		} else if (!yes && [Probability.Unfathomable, Probability.Impossible].includes(state.probability)) {
			majorThreshold = 990;
			minorThreshold = 980;
		} else {
			majorThreshold = 900;
			minorThreshold = 950;
		}
		const cfMod = (() => {
			switch (state.cf) {
				case ChaosFactor.Peaceful:
				case ChaosFactor.Serene: return 0;
				case ChaosFactor.Calm:
				case ChaosFactor.Stable: return 5;
				case ChaosFactor.Chaotic: return 10;
				case ChaosFactor.Havoc: return 15;
				case ChaosFactor.Pandemonium: return 25;
			}
		})();

		const tensionMod = (() => {
			switch (state.tension) {
				case Tension.LockedIn:
				case Tension.FullTilt: return 15;
				case Tension.GettingCrazy:
				case Tension.UnderControl: return 10;
				default: return 5;
			}
		})();
		if (ProbabilityUtils.isEasy(state.probability)) {
			minorThreshold = Math.min(Math.max(minorThreshold + cfMod + tensionMod, 20), 980);
			majorThreshold = Math.min(Math.max(majorThreshold + cfMod + tensionMod, 10), 990);
		} else if (ProbabilityUtils.isHard(state.probability)) {
			minorThreshold = Math.min(Math.max(minorThreshold - cfMod - tensionMod, 20), 980);
			majorThreshold = Math.min(Math.max(majorThreshold - cfMod - tensionMod, 10), 990);
		}
		return { minor: minorThreshold, major: majorThreshold }
	}

	isExceptional(state: OracleState, yes: boolean): Exceptional | null {
		const roll = this.toInt();
		const { minor, major } = RollResult.exceptionalThreshold(state, yes)
		if (roll >= major) return Exceptional.Major;
		if (roll >= minor) return Exceptional.Minor;
		return null;

	}

	hasAnd(_state: OracleState, successThreshold: number): boolean {
		const roll = this.toInt();
		return (roll >= successThreshold && (successThreshold - roll) > successThreshold + 100) || roll > 995;
	}

	hasBut(_state: OracleState, successThreshold: number): boolean {
		const roll = this.toInt();
		return roll < successThreshold && (successThreshold - roll) < 50;
	}
	static eventThreshold(state: OracleState): number {
		let window = 10;
		const cfWindowMod = (() => {
			switch (state.cf) {
				case ChaosFactor.Peaceful: return -10;
				case ChaosFactor.Serene: return -5;
				case ChaosFactor.Calm: return 0;
				case ChaosFactor.Stable: return 10;
				case ChaosFactor.Chaotic: return 15;
				case ChaosFactor.Havoc: return 20;
				case ChaosFactor.Pandemonium: return 25;
			}
		})();

		const tensionWindowMod = (() => {
			switch (state.tension) {
				case Tension.LockedIn: return 15;
				case Tension.FullTilt: return 33;
				case Tension.GettingCrazy: return 25;
				case Tension.UnderControl: return 10;
				case Tension.Coasting: return 5;
				case Tension.Tense: return 10;
				default: return 0;
			}
		})();
		return Math.max(window += cfWindowMod + tensionWindowMod, 10);
	}

	hasEvent(state: OracleState, successThreshold: number): boolean {
		const roll = this.toInt();
		const distance = Math.abs(roll - successThreshold);
		let window = RollResult.eventThreshold(state);
		return distance <= window;
	}

	static rollD1000(): RollResult {
		return new RollResult(
			rollDigit(),
			rollDigit(),
			rollDigit()
		);
	}
}

export function tensionProbMod(state: OracleState): number {
	const p = state.probability;
	const t = state.tension;
	if (t === Tension.Neutral || p === Probability._5050) return 0;
	if (ProbabilityUtils.isHard(p)) {
		if (t === Tension.FullTilt) return -150;
		if (t === Tension.LockedIn) return -125;
		if (t === Tension.GettingCrazy) return -100;
		if (t === Tension.UnderControl) return -50;
		if (t === Tension.Coasting) return -10;
		if (t === Tension.Tense) return -25;
	} else if (ProbabilityUtils.isEasy(p)) {
		if (t === Tension.LockedIn) return -50;
		if (t === Tension.UnderControl) return -25;
		if (t === Tension.Coasting) return -25;
		if (t === Tension.Tense) return 25;
		if (t === Tension.GettingCrazy) return 75;
		if (t === Tension.FullTilt) return 150;
	}
	return 0;
}
// -------------------- RollResolved --------------------
export interface RollResolved {
	exceptional: Exceptional | null;
	yes: boolean;
	but: boolean;
	eventTriggered: boolean;
}

export namespace RollResolver {
	export function resolveRoll(
		state: OracleState,
		rollResult: RollResult,
		shadowRollResult: RollResult,
	): RollResolved {
		const successThreshold = ProbabilityUtils.getSuccessThreshold(state);
		let roll = rollResult.toInt();
		const yes = roll >= successThreshold;
		let exceptional = null;
		if (roll === 0 || roll === 999) {
			exceptional = Exceptional.Major;
		} else if (10 >= roll || roll >= 990) {
			exceptional = Exceptional.Minor;
		};
		if (!exceptional) {
			exceptional = shadowRollResult.isExceptional(state, yes);
		}
		const but = rollResult.hasBut(state, successThreshold);
		const eventTriggered = shadowRollResult.hasEvent(state, successThreshold);
		return { exceptional, yes, but, eventTriggered };
	}
}
function rangeChance(start: number, end: number): number {
	return (end - start + 1) / 1000
}
export function rollOdds(state: OracleState) {
	const successThreshold = ProbabilityUtils.getSuccessThreshold(state);
	console.log("successThreshold = ",successThreshold);

	const yesChance = rangeChance(successThreshold, 999);
	console.log("Yes % = ",yesChance);
	const noChance = rangeChance(0, successThreshold - 1);
	console.log("No % = ",noChance);

	const yesEx = RollResult.exceptionalThreshold(state, true);
	const noEx = RollResult.exceptionalThreshold(state, false);
	console.log("exceptional yes major", yesEx.major)
	console.log("exceptional yes minor", yesEx.minor)

	// --- YES EXCEPTIONALS ---
	// Always guarantee 999 crit and 990–998 near-crit.
	const critMajorYes = rangeChance(999, 999);
	const critMinorYes = rangeChance(990, 998);
	// --- NO EXCEPTIONALS ---
	// Always guarantee 0 and 1–9 for minor/major fails
	const critMajorNo = rangeChance(0, 0);
	const critMinorNo = rangeChance(1, 9);

	const majorNo = rangeChance(noEx.major,  999);
	const minorNo = rangeChance(noEx.minor,  noEx.major-1);
	// Dynamic ranges relative to success threshold
	const majorYes = rangeChance(yesEx.major,  999);
	const minorYes = rangeChance(yesEx.minor,  yesEx.major-1);
	console.log("Major No chance = ",majorNo);
	console.log("Minor No chance = ",minorNo);
	console.log("Minor No chance  with crit= " ,minorNo + critMinorNo);
	console.log("Major No chance with crit = " ,majorNo + critMajorNo);
	console.log("Major Yes chance = ",majorYes);
	console.log("Minor Yes chance = ",minorYes);
	console.log("Minor Yes chance with crit = ",minorYes + critMinorYes);
	console.log("Major Yes chance with crit = ",majorYes + critMajorYes);
	console.log("Final Major No",(((majorNo + critMajorNo) * noChance) * 100).toFixed(2));
	console.log("Final Minor No" ,(((minorNo + critMinorNo) * noChance) * 100).toFixed(2));
	console.log("Final Major Yes",(((majorYes + critMajorYes) * yesChance) * 100).toFixed(2));
	console.log("Final Minor Yes" ,(((minorYes + critMinorYes) * yesChance) * 100).toFixed(2));


	// --- EVENT WINDOW ---
	const eventWindow = RollResult.eventThreshold(state);
	const eventLow = Math.max(successThreshold - eventWindow, 0);
	const eventHigh = Math.min(successThreshold + eventWindow, 999);
	const eventBase = rangeChance(eventLow, eventHigh);

	return {
		yes: yesChance,
		no: noChance,
		excMajorYes: (majorYes + critMajorYes) * yesChance,
		excMinorYes: (minorYes + critMinorYes) * yesChance,
		excMajorNo: (majorNo   + critMajorNo) * noChance,
		excMinorNo: (minorNo   + critMinorNo) * noChance,
		event: eventBase,
	};
}



// -------------------- rollDigit helper --------------------
function rollDigit(): number {
	let a = randomInt(10); // 0–9
	return a;
}
