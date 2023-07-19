import { Plugin, addIcon } from 'obsidian';
import { readFileSync } from 'fs'
import { obsidianExportPath } from "../env";
import { MYTHIC_VIEW, MythicView } from "./views";

interface MythicSettings {
	chaosFactor: number;
}

const DEFAULT_SETTINGS: MythicSettings = {
	chaosFactor: 5
}


export default class MGE extends Plugin {
	settings: MythicSettings;
	statusBarTextElement: HTMLSpanElement;
	async onload() {
		console.log("mythic plugin loaded (2)")
		const faScript = document.createElement('script');
		faScript.src = 'https://kit.fontawesome.com/8d28eaccd0.js';
		faScript.crossOrigin = 'anonymous';
		document.head.appendChild(faScript);
		this.addCommand({
			id: 'mythic-view',
			name: 'open mythic',
			callback: () => {
				this.activateView();
			},
		});
		const svgPath = obsidianExportPath + "icons/M.svg"
		const svgContent = readFileSync(svgPath, 'utf-8');
		addIcon('M', svgContent);
		this.registerView(
			MYTHIC_VIEW,
			(leaf) => new MythicView(leaf)
		);
		this.addRibbonIcon("M", "Mythic Game Emulator", () => {
			this.activateView();
		});
	}
	async onunload() {
		this.app.workspace.detachLeavesOfType(MYTHIC_VIEW);
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	async activateView() {
		this.app.workspace.detachLeavesOfType(MYTHIC_VIEW);
		await this.app.workspace.getRightLeaf(false).setViewState({
			type: MYTHIC_VIEW,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(MYTHIC_VIEW)[0]
		);
	}


}

