"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollResolver = exports.RerollRange = exports.UpOrDown = exports.RollResult = exports.Exceptional = exports.ProbabilityUtils = exports.ChaosFactorUtils = void 0;
const crypto_1 = require("crypto");
function assertNever(x) {
    throw new Error("Unexpected object: " + x);
}
const types_1 = require("../lib/types");
const probabilityThresholds = {
    [types_1.Probability.Inevitable]: 1,
    [types_1.Probability.Certain]: 25,
    [types_1.Probability.HasToBe]: 50,
    [types_1.Probability.SureThing]: 100,
    [types_1.Probability.Probable]: 250,
    [types_1.Probability.Likely]: 350,
    [types_1.Probability._5050]: 500,
    [types_1.Probability.Unlikely]: 650,
    [types_1.Probability.Dubious]: 750,
    [types_1.Probability.NoWay]: 850,
    [types_1.Probability.Ridiculous]: 900,
    [types_1.Probability.Impossible]: 975,
    [types_1.Probability.Unfathomable]: 999,
};
// ChaosFactor helpers
var ChaosFactorUtils;
(function (ChaosFactorUtils) {
    function isCalm(cf) {
        return (cf === types_1.ChaosFactor.Peaceful ||
            cf === types_1.ChaosFactor.Serene ||
            cf === types_1.ChaosFactor.Calm);
    }
    ChaosFactorUtils.isCalm = isCalm;
    function isChaotic(cf) {
        return (cf === types_1.ChaosFactor.Pandemonium ||
            cf === types_1.ChaosFactor.Havoc ||
            cf === types_1.ChaosFactor.Chaotic);
    }
    ChaosFactorUtils.isChaotic = isChaotic;
    function getCfMod(cf) {
        switch (cf) {
            case types_1.ChaosFactor.Peaceful: return 200;
            case types_1.ChaosFactor.Serene: return 100;
            case types_1.ChaosFactor.Calm: return 50;
            case types_1.ChaosFactor.Stable: return 0;
            case types_1.ChaosFactor.Chaotic: return 50;
            case types_1.ChaosFactor.Havoc: return 100;
            case types_1.ChaosFactor.Pandemonium: return 200;
        }
    }
    ChaosFactorUtils.getCfMod = getCfMod;
})(ChaosFactorUtils || (exports.ChaosFactorUtils = ChaosFactorUtils = {}));
// Probability helpers
var ProbabilityUtils;
(function (ProbabilityUtils) {
    function isEasy(prob) {
        return (prob === types_1.Probability.Inevitable ||
            prob === types_1.Probability.Certain ||
            prob === types_1.Probability.HasToBe ||
            prob === types_1.Probability.SureThing ||
            prob === types_1.Probability.Probable ||
            prob === types_1.Probability.Likely);
    }
    ProbabilityUtils.isEasy = isEasy;
    function isHard(prob) {
        return (prob === types_1.Probability.Unfathomable ||
            prob === types_1.Probability.Impossible ||
            prob === types_1.Probability.Ridiculous ||
            prob === types_1.Probability.NoWay ||
            prob === types_1.Probability.Dubious ||
            prob === types_1.Probability.Unlikely);
    }
    ProbabilityUtils.isHard = isHard;
    function isNeutral(prob) {
        return prob === types_1.Probability._5050;
    }
    ProbabilityUtils.isNeutral = isNeutral;
    function getSuccessThreshold(state) {
        let threshold = probabilityThresholds[state.probability];
        const cf_mod = ChaosFactorUtils.getCfMod(state.cf);
        if (ProbabilityUtils.isHard(state.probability)) {
            if (ChaosFactorUtils.isChaotic(state.cf)) {
                threshold -= cf_mod;
            }
            else if (ChaosFactorUtils.isCalm(state.cf)) {
                threshold += cf_mod;
            }
        }
        else if (ProbabilityUtils.isEasy(state.probability)) {
            if (ChaosFactorUtils.isChaotic(state.cf)) {
                threshold += cf_mod;
            }
            else if (ChaosFactorUtils.isCalm(state.cf)) {
                threshold -= cf_mod;
            }
        }
        const [clampMin, clampMax] = (() => {
            switch (state.tension) {
                case types_1.Tension.LockedIn: return [25, 975];
                case types_1.Tension.UnderControl: return [5, 995];
                case types_1.Tension.Coasting: return [10, 990];
                case types_1.Tension.Neutral: return [1, 999];
                case types_1.Tension.Tense: return [5, 995];
                case types_1.Tension.GettingCrazy: return [10, 990];
                case types_1.Tension.FullTilt: return [25, 975];
                default: return assertNever(state.tension);
            }
        })();
        return Math.min(Math.max(threshold, clampMin), clampMax);
    }
    ProbabilityUtils.getSuccessThreshold = getSuccessThreshold;
})(ProbabilityUtils || (exports.ProbabilityUtils = ProbabilityUtils = {}));
// -------------------- Exceptional --------------------
var Exceptional;
(function (Exceptional) {
    Exceptional["Minor"] = "Minor";
    Exceptional["Major"] = "Major";
})(Exceptional || (exports.Exceptional = Exceptional = {}));
// -------------------- RollResult --------------------
class RollResult {
    hundreds;
    tens;
    ones;
    constructor(hundreds, tens, ones) {
        this.hundreds = hundreds;
        this.tens = tens;
        this.ones = ones;
    }
    toInt() {
        return this.ones + this.tens * 10 + this.hundreds * 100;
    }
    isExceptional(state, yes) {
        const roll = this.toInt();
        let baseThreshold = (() => {
            switch (true) {
                case yes && [types_1.Probability.Inevitable, types_1.Probability.Certain].includes(state.probability):
                    return 990;
                case yes && [types_1.Probability.HasToBe, types_1.Probability.SureThing].includes(state.probability):
                    return 975;
                case yes && [types_1.Probability.Probable, types_1.Probability.Likely].includes(state.probability):
                    return 950;
                case yes && state.probability === types_1.Probability._5050:
                    return 900;
                case yes && [types_1.Probability.Dubious, types_1.Probability.Unlikely].includes(state.probability):
                    return 900;
                case yes && [types_1.Probability.Ridiculous, types_1.Probability.NoWay].includes(state.probability):
                    return 875;
                case yes && [types_1.Probability.Unfathomable, types_1.Probability.Impossible].includes(state.probability):
                    return 850;
                case !yes && [types_1.Probability.Inevitable, types_1.Probability.Certain].includes(state.probability):
                    return 800;
                case !yes && [types_1.Probability.HasToBe, types_1.Probability.SureThing].includes(state.probability):
                    return 825;
                case !yes && [types_1.Probability.Probable, types_1.Probability.Likely].includes(state.probability):
                    return 850;
                case !yes && state.probability === types_1.Probability._5050:
                    return 900;
                case !yes && [types_1.Probability.Dubious, types_1.Probability.Unlikely].includes(state.probability):
                    return 950;
                case !yes && [types_1.Probability.Ridiculous, types_1.Probability.NoWay].includes(state.probability):
                    return 975;
                case !yes && [types_1.Probability.Unfathomable, types_1.Probability.Impossible].includes(state.probability):
                    return 990;
                default:
                    return 900;
            }
        })();
        const cfMod = (() => {
            switch (state.cf) {
                case types_1.ChaosFactor.Peaceful:
                case types_1.ChaosFactor.Serene: return 0;
                case types_1.ChaosFactor.Calm:
                case types_1.ChaosFactor.Stable: return 5;
                case types_1.ChaosFactor.Chaotic: return 10;
                case types_1.ChaosFactor.Havoc: return 15;
                case types_1.ChaosFactor.Pandemonium: return 25;
            }
        })();
        const tensionMod = (() => {
            switch (state.tension) {
                case types_1.Tension.LockedIn:
                case types_1.Tension.FullTilt: return 15;
                case types_1.Tension.GettingCrazy:
                case types_1.Tension.UnderControl: return 10;
                default: return 5;
            }
        })();
        baseThreshold = Math.min(Math.max(baseThreshold - cfMod - tensionMod, 800), 990);
        if (roll > baseThreshold + 75) {
            return Exceptional.Major;
        }
        else if (roll > baseThreshold) {
            return Exceptional.Minor;
        }
        else {
            return null;
        }
    }
    hasAnd(_state, successThreshold) {
        const roll = this.toInt();
        return (roll >= successThreshold && (successThreshold - roll) > successThreshold + 100) || roll > 995;
    }
    hasBut(_state, successThreshold) {
        const roll = this.toInt();
        return roll < successThreshold && (successThreshold - roll) < 50;
    }
    hasEvent(state, successThreshold) {
        const roll = this.toInt();
        const distance = Math.abs(roll - successThreshold);
        let window = 10;
        const cfWindowMod = (() => {
            switch (state.cf) {
                case types_1.ChaosFactor.Peaceful:
                case types_1.ChaosFactor.Serene:
                case types_1.ChaosFactor.Calm: return 0;
                case types_1.ChaosFactor.Stable:
                case types_1.ChaosFactor.Chaotic: return 5;
                case types_1.ChaosFactor.Havoc: return 15;
                case types_1.ChaosFactor.Pandemonium: return 25;
            }
        })();
        const tensionWindowMod = (() => {
            switch (state.tension) {
                case types_1.Tension.LockedIn:
                case types_1.Tension.FullTilt: return 15;
                case types_1.Tension.GettingCrazy:
                case types_1.Tension.UnderControl: return 10;
                case types_1.Tension.Coasting:
                case types_1.Tension.Tense: return 5;
                default: return 0;
            }
        })();
        if (ChaosFactorUtils.isChaotic(state.cf) && roll % 7 === 0) {
            return true;
        }
        window += cfWindowMod + tensionWindowMod;
        return distance <= window;
    }
    static rollD1000(state) {
        const bias = RerollRange.fromState(state);
        return new RollResult(rollDigit(bias), rollDigit(bias), rollDigit(bias));
    }
}
exports.RollResult = RollResult;
// -------------------- UpOrDown --------------------
var UpOrDown;
(function (UpOrDown) {
    UpOrDown["Up"] = "Up";
    UpOrDown["Down"] = "Down";
})(UpOrDown || (exports.UpOrDown = UpOrDown = {}));
var RerollRange;
(function (RerollRange) {
    function isRerollable(range, current) {
        switch (range.kind) {
            case "None": return false;
            case "All": return true;
            case "ReRollOnes": return current === 1;
            case "ReRollThrees": return current >= 1 && current <= 3;
            case "ReRollSixes": return current >= 1 && current <= 6;
        }
    }
    RerollRange.isRerollable = isRerollable;
    function fromState(state) {
        const p = state.probability;
        const t = state.tension;
        if (t === types_1.Tension.Neutral || p === types_1.Probability._5050)
            return { kind: "None" };
        if (ProbabilityUtils.isHard(p)) {
            if (t === types_1.Tension.LockedIn || t === types_1.Tension.FullTilt)
                return { kind: "All", dir: UpOrDown.Up };
            if (t === types_1.Tension.UnderControl || t === types_1.Tension.GettingCrazy)
                return { kind: "ReRollSixes", dir: UpOrDown.Up };
            if (t === types_1.Tension.Coasting || t === types_1.Tension.Tense)
                return { kind: "ReRollThrees", dir: UpOrDown.Up };
        }
        else if (ProbabilityUtils.isEasy(p)) {
            if (t === types_1.Tension.LockedIn)
                return { kind: "All", dir: UpOrDown.Up };
            if (t === types_1.Tension.UnderControl || t === types_1.Tension.Coasting)
                return { kind: "ReRollThrees", dir: UpOrDown.Up };
            if (t === types_1.Tension.Tense)
                return { kind: "ReRollThrees", dir: UpOrDown.Down };
            if (t === types_1.Tension.GettingCrazy)
                return { kind: "ReRollSixes", dir: UpOrDown.Down };
            if (t === types_1.Tension.FullTilt)
                return { kind: "All", dir: UpOrDown.Down };
        }
        return { kind: "None" };
    }
    RerollRange.fromState = fromState;
})(RerollRange || (exports.RerollRange = RerollRange = {}));
var RollResolver;
(function (RollResolver) {
    function resolveRoll(state, rollResult) {
        const successThreshold = ProbabilityUtils.getSuccessThreshold(state);
        const yes = rollResult.toInt() >= successThreshold;
        const shadowRoll = RollResult.rollD1000(state);
        const exceptional = shadowRoll.isExceptional(state, yes);
        const but = rollResult.hasBut(state, successThreshold);
        const and = rollResult.hasAnd(state, successThreshold);
        const eventTriggered = rollResult.hasEvent(state, successThreshold);
        return { exceptional, yes, but, and, eventTriggered };
    }
    RollResolver.resolveRoll = resolveRoll;
})(RollResolver || (exports.RollResolver = RollResolver = {}));
// -------------------- rollDigit helper --------------------
function rollDigit(bias) {
    let a = (0, crypto_1.randomInt)(10); // 0–9
    if (RerollRange.isRerollable(bias, a)) {
        const b = (0, crypto_1.randomInt)(10);
        switch (bias.kind) {
            case "All":
            case "ReRollOnes":
            case "ReRollThrees":
            case "ReRollSixes":
                a = bias.dir === UpOrDown.Up ? Math.max(a, b) : Math.min(a, b);
                break;
        }
    }
    return a;
}
