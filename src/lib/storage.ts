
import type { Plugin } from "obsidian";
import type { ChaosEngineSettings } from "./types";
import { Tension, Probability, ChaosFactor } from "./types";

export const DEFAULTS: ChaosEngineSettings = {
	cfChoice: ChaosFactor.Stable,
	probChoice: Probability._5050,
	tensionChoice: Tension.Neutral,
	advanced: false,
}

export async function loadSettings(ctx: Plugin): Promise<ChaosEngineSettings> {
	const data = await ctx.loadData();
	return Object.assign({}, DEFAULTS, data ?? {});
}

export async function saveSettings(ctx: Plugin, settings: ChaosEngineSettings) {
	await ctx.saveData(settings);
}
