"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../src/lib/types");
const chaosEngine_1 = require("../src/systems/chaosEngine");
// --- core sim loop ---
function simulate(trials, state) {
    let yes = 0, no = 0, exMinor = 0, exMajor = 0;
    for (let i = 0; i < trials; i++) {
        let roll = chaosEngine_1.RollResult.rollD1000(state);
        let resolved_roll = chaosEngine_1.RollResolver.resolveRoll(state, roll);
        if (resolved_roll.yes)
            yes++;
        else
            no++;
        if (resolved_roll.exceptional === chaosEngine_1.Exceptional.Minor)
            exMinor++;
        if (resolved_roll.exceptional === chaosEngine_1.Exceptional.Major)
            exMajor++;
    }
    console.log(`Trials: ${trials}`);
    console.log(`Yes: ${(yes / trials * 100).toFixed(2)}%`);
    console.log(`No: ${(no / trials * 100).toFixed(2)}%`);
    console.log(`Exceptional Minor: ${(exMinor / trials * 100).toFixed(2)}%`);
    console.log(`Exceptional Major: ${(exMajor / trials * 100).toFixed(2)}%`);
}
// run one sim
const state = {
    probability: types_1.Probability.Inevitable,
    cf: types_1.ChaosFactor.Peaceful,
    tension: types_1.Tension.LockedIn,
};
simulate(100000, state);
