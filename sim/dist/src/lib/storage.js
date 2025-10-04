"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSettings = loadSettings;
exports.saveSettings = saveSettings;
const DEFAULTS = {
    chaos: {
        pool: 4,
        chaos: 0,
        trend: "Maintaining",
        threshold: 2,
        cfChoice: "Balanced",
        trendChoice: "Maintaining",
    },
};
async function loadSettings(ctx) {
    const data = await ctx.loadData();
    return Object.assign({}, DEFAULTS, data ?? {});
}
async function saveSettings(ctx, settings) {
    await ctx.saveData(settings);
}
