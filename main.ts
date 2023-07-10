import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MythicSettings {
	chaosFactor: number;
}

const DEFAULT_SETTINGS: MythicSettings = {
	chaosFactor: 5
}

export default class MyPlugin extends Plugin {
	settings: MythicSettings;
	statusBarTextElement:HTMLSpanElement;

	async onload() {
		console.log("test")
		console.log("test")
		this.statusBarTextElement =  this.addStatusBarItem().createEl('span');
		this.statusBarTextElement.textContent = "test";
	}
	onunload() {

	}
}
