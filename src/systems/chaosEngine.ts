import { randomInt } from 'crypto';
function assertNever(x: never): never {
	throw new Error("Unexpected object: " + x);
}
import { ChaosFactor, Tension, Probability, OracleState } from "../lib/types";
const probabilityThresholds: Record<Probability, number> = {
	[Probability.Inevitable]: 50,
	[Probability.Certain]: 250,
	[Probability.HasToBe]: 500,
	[Probability.SureThing]: 1500,
	[Probability.Probable]: 2500,
	[Probability.Likely]: 3500,
	[Probability._5050]: 5000,
	[Probability.Unlikely]: 6500,
	[Probability.Dubious]: 7500,
	[Probability.NoWay]: 8500,
	[Probability.Ridiculous]: 9500,
	[Probability.Impossible]: 9750,
	[Probability.Unfathomable]: 9950,
}
export namespace TensionUtils {
	export function isTense(tension: Tension): boolean {
		return (
			tension === Tension.FullTilt ||
			tension === Tension.GettingCrazy ||
			tension === Tension.Tense
		);
	}
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
			case ChaosFactor.Peaceful: return 750;
			case ChaosFactor.Serene: return 500;
			case ChaosFactor.Calm: return 250;
			case ChaosFactor.Stable: return 0;
			case ChaosFactor.Chaotic: return 500;
			case ChaosFactor.Havoc: return 1000;
			case ChaosFactor.Pandemonium: return 2000;
		}
	}
}

// Probability helpers
export namespace ProbabilityUtils {
	function updateThershold(threshold: number, change: number): number {
		threshold += change;
		return Math.max(Math.min(threshold, 9950), 50);
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
		//console.log("Base Threshold", threshold);
		let tensionMod = tensionProbMod(state);
		//console.log("Tension Mod", tensionMod);
		const cf_mod = ChaosFactorUtils.getCfMod(state.cf);
		//console.log("cf Mod", cf_mod);
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
		//console.log("Final Threshold", threshold);
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
	thousands: number;
	hundreds: number;
	tens: number;
	ones: number;

	constructor(thousands: number, hundreds: number, tens: number, ones: number) {
		this.thousands = thousands;
		this.hundreds = hundreds;
		this.tens = tens;
		this.ones = ones;
	}

	to10_000(): number {
		return this.ones + this.tens * 10 + this.hundreds * 100 + this.thousands * 1000;
	}
	to1_000(): number {
		return this.ones + this.tens * 10 + this.hundreds * 100;
	}
	to100(): number {
		return this.ones + this.tens * 10;
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
			majorThreshold = 700;
			minorThreshold = 650;
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
		const roll = this.to1_000();
		const { minor, major } = RollResult.exceptionalThreshold(state, yes)
		if (roll >= major) return Exceptional.Major;
		if (roll >= minor) return Exceptional.Minor;
		return null;

	}

	hasAnd(_state: OracleState, successThreshold: number): boolean {
		const roll = this.to10_000();
		return (roll >= successThreshold && (successThreshold - roll) > successThreshold + 1000) || roll > 9950;
	}

	hasBut(_state: OracleState, successThreshold: number): boolean {
		const roll = this.to10_000();
		return roll < successThreshold && (successThreshold - roll) < 500;
	}
	static eventThreshold(state: OracleState): number {
		let window = 0;
		const cfWindowMod = (() => {
			switch (state.cf) {
				case ChaosFactor.Peaceful: return 2;
				case ChaosFactor.Serene: return 3;
				case ChaosFactor.Calm: return 4;
				case ChaosFactor.Stable: return 5;
				case ChaosFactor.Chaotic: return 6;
				case ChaosFactor.Havoc: return 7;
				case ChaosFactor.Pandemonium: return 8;
			}
		})();

		const tensionWindowMod = (() => {
			switch (state.tension) {
				case Tension.LockedIn: return 5;
				case Tension.FullTilt: return 6;
				case Tension.GettingCrazy: return 5;
				case Tension.UnderControl: return 4;
				case Tension.Coasting: return 2;
				case Tension.Tense: return 3;
				default: return 0;
			}
		})();
		return Math.max(window += cfWindowMod + tensionWindowMod, 5);
	}

	hasEvent(state: OracleState): boolean {
		const subBand = this.to100();
		let window = RollResult.eventThreshold(state);
		return subBand <= window;
	}

	static rollD10000(): RollResult {
		return new RollResult(
			rollDigit(),
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
		if (t === Tension.FullTilt) return -1500;
		if (t === Tension.LockedIn) return -1250;
		if (t === Tension.GettingCrazy) return -1000;
		if (t === Tension.UnderControl) return -500;
		if (t === Tension.Coasting) return -100;
		if (t === Tension.Tense) return -250;
	} else if (ProbabilityUtils.isEasy(p)) {
		if (t === Tension.LockedIn) return -500;
		if (t === Tension.UnderControl) return -250;
		if (t === Tension.Coasting) return -250;
		if (t === Tension.Tense) return 250;
		if (t === Tension.GettingCrazy) return 750;
		if (t === Tension.FullTilt) return 1500;
	}
	return 0;
}
// -------------------- RollResolved --------------------
export interface RollResolved {
	exceptional: Exceptional | null;
	yes: boolean;
	eventTriggered: boolean;
}

export namespace RollResolver {
	export function resolveRoll(
		state: OracleState,
		rollResult: RollResult,
	): RollResolved {
		const successThreshold = ProbabilityUtils.getSuccessThreshold(state);
		let roll = rollResult.to10_000();
		const yes = roll >= successThreshold;
		const exceptional = rollResult.isExceptional(state, yes);
		const eventTriggered = rollResult.hasEvent(state);
		return { exceptional, yes, eventTriggered };
	}
}
function rangeChance(start: number, end: number, max: number): number {
	if (end < start) return 0;
	return (end - start + 1) / max;
}

export function rollOdds(state: OracleState) {
	const successThreshold = ProbabilityUtils.getSuccessThreshold(state);
	const successBandMax = 10000;
	const exceptionalBandMax = 1000;

	const yesChance = (successBandMax - successThreshold) / successBandMax;
	const noChance = 1 - yesChance;

	const yesEx = RollResult.exceptionalThreshold(state, true);
	const noEx = RollResult.exceptionalThreshold(state, false);

	// ✅ YES SIDE — [major, 1000)
	const majorYes = (1000 - yesEx.major) / exceptionalBandMax;
	const minorYes = (yesEx.major - yesEx.minor) / exceptionalBandMax;

	// ✅ NO SIDE — [minor, major)
	const majorNo = (1000 - noEx.major) / exceptionalBandMax;
	const minorNo = (noEx.major - noEx.minor) / exceptionalBandMax;

	// ✅ Event window – no +1 bias (matches sim)
	const eventWindow = RollResult.eventThreshold(state);
	const eventChance = eventWindow / 100;

	console.log("===PROJECTED ODDS===");
	console.log(`Exceptional Major Yes: ${(majorYes * yesChance * 100).toFixed(2)}%`);
	console.log(`Exceptional Minor Yes: ${(minorYes * yesChance * 100).toFixed(2)}%`);
	console.log(`Yes: ${(yesChance * 100).toFixed(2)}%`);
	console.log(`No: ${(noChance * 100).toFixed(2)}%`);
	console.log(`Exceptional Minor No: ${(minorNo * noChance * 100).toFixed(2)}%`);
	console.log(`Exceptional Major No: ${(majorNo * noChance * 100).toFixed(2)}%`);
	console.log(`Event: ${(eventChance * 100).toFixed(2)}%`);

	return {
		yes: yesChance,
		no: noChance,
		excMajorYes: majorYes * yesChance,
		excMinorYes: minorYes * yesChance,
		excMajorNo: majorNo * noChance,
		excMinorNo: minorNo * noChance,
		event: eventChance,
	};
}






// -------------------- rollDigit helper --------------------
function rollDigit(): number {
	let a = randomInt(10); // 0–9
	return a;
}
