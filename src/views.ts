import { ItemView, WorkspaceLeaf } from 'obsidian';
import type MGE from "./main";
import * as sp from "./systems/sentencePicker";
import { ChaosFactor, Tension, Probability, OracleState, ChaosEngineSettings } from "./lib/types";
import { RollResult, RollResolver, Exceptional, rollOdds, ProbabilityUtils } from './systems/chaosEngine';
import * as path from "path";
import { randomInt } from 'crypto';
import actionList1 from 'JSONS/actions1.json'
import actionList2 from 'JSONS/actions2.json'
import descriptorList1 from 'JSONS/descriptors1.json';
import descriptorList2 from 'JSONS/descriptors2.json';
import { loadSettings, saveSettings } from './lib/storage';
const dispRanges: { range: [number, number]; stance: string, mod: number }[] = [
	{ range: [-100, 5], stance: "Passive", mod: -2 },
	{ range: [6, 10], stance: "Moderate", mod: 0 },
	{ range: [11, 15], stance: "Active", mod: 2 },
	{ range: [16, 99], stance: "Aggressive", mod: 4 },
];
const npcActionTable1: { range: [number, number]; action: string }[] = [
	{ range: [1, 3], action: "Theme Action" },
	{ range: [4, 5], action: "NPC Continues" },
	{ range: [6, 6], action: "NPC Continues +2" },
	{ range: [7, 7], action: "NPC Contines -2" },
	{ range: [8, 8], action: "NPC Action" },
	{ range: [9, 9], action: "NPC Action -4" },
	{ range: [10, 10], action: "NPC Action +4" },
];
const npcActionTable2: { range: [number, number]; action: string }[] = [
	{ range: [-10, 6], action: "Talks/Exposition" },
	{ range: [7, 8], action: "Performs An Ambiguous Action" },
	{ range: [9, 10], action: "Acts out of PC interest" },
	{ range: [11, 11], action: "Gives Something" },
	{ range: [12, 12], action: "Seeks To End Encouter" },
	{ range: [13, 13], action: "Changes The Theme" },
	{ range: [14, 14], action: "Changes Descriptor" },
	{ range: [15, 17], action: "Acts Out Of Self Interest" },
	{ range: [18, 18], action: "Takes Something" },
	{ range: [19, 99], action: "Causes Harm" },
];

const prob_options: Record<string, Probability> = {
	'Inevitable': Probability.Inevitable,
	'Certain': Probability.Certain,
	'Has to Be': Probability.HasToBe,
	'Sure Thing': Probability.SureThing,
	'Probable': Probability.Probable,
	'Likely': Probability.Likely,
	'50/50': Probability._5050,
	'Unlikely': Probability.Unlikely,
	'Dubious': Probability.Dubious,
	'No Way': Probability.NoWay,
	'Ridiculous': Probability.Ridiculous,
	'Impossible': Probability.Impossible,
	'Unfathomable': Probability.Unfathomable
};
const chaos_options: Record<string, ChaosFactor> = {
	'Peaceful': ChaosFactor.Peaceful,
	'Serene': ChaosFactor.Serene,
	'Calm': ChaosFactor.Calm,
	'Stable': ChaosFactor.Stable,
	'Chaotic': ChaosFactor.Chaotic,
	'Havoc': ChaosFactor.Havoc,
	'Pandemonium': ChaosFactor.Pandemonium
};
const tension_options: Record<string, Tension> = {
	'Locked In': Tension.LockedIn,
	'Under Control': Tension.UnderControl,
	'Coasting': Tension.Coasting,
	'Neutral': Tension.Neutral,
	'Tense': Tension.Tense,
	'Getting Crazy': Tension.GettingCrazy,
	'Full Tilt': Tension.FullTilt
};

export const MYTHIC_VIEW = "mythic view";


function calculateButtonPadding(button: HTMLButtonElement) {
	const textContent = button.getAttribute('data-title');
	if (textContent) {
		const textLength = textContent.length;
		const paddingSides = `${textLength}px`; // Adjust the multiplier as needed
		button.style.setProperty('--tooltip-padding-left', paddingSides);
		button.style.setProperty('--tooltip-padding-right', paddingSides);
		return paddingSides
	}
}
function getRandomElement<T>(list: T[]): T {
	const randomIndex = Math.floor(Math.random() * list.length);
	return list[randomIndex];
}

function formatExceptionalResult(exceptional: Exceptional | null, yes: boolean): string {
	if (!exceptional) return yes ? "Yes" : "No";

	const yesPhrases = {
		major: [
			"An overwhelming YES!",
			"Reality itself bends toward YES!",
			"Fate shouts YES!",
			"Yes — The signs point clearly.",
			"A remarkable YES!",
			"YES — and the world echoes it back!",
			"Reality SHUDDERS in aggreement.",
			"An overwhelming YES, written in the stars.",
			"Yes — completely and utterly, without doubt.",
			"Fate declares it so.",
			"The universe bends towards Yes."
		],
		minor: [
			"The pattern resolves into a clear yes.",
			"Yes, in ways subtle, but undeniable.",
			"A gentle but certain affirmation.",
			"Yes — almost if by coincidence?",
			"The omens whisper YES.",
			"Yes, softly but surely.",
			"Yes — fate itself cannot resist."

		]
	};

	const noPhrases = {
		major: [
			"NO — and the heavens recoil!",
			"No — Fate forbids it.",
			"An absolute NO!",
			"No — Fate slams the door shut!",
			"A crushing denial!",
			"Not in this lifetime!",
			"The universe recoils — NO!",
			"The world turns with cold refusal.",
			"All forces align in denial.",
			"The answer is aboslute: NO"
		],
		minor: [
			"Definetly NOT!",
			"A grim NO.",
			"No — The signs do not support it.",
			"No — it feels wrong... and fate agrees."
		]
	};

	const pool = yes
		? exceptional === Exceptional.Major ? yesPhrases.major : yesPhrases.minor
		: exceptional === Exceptional.Major ? noPhrases.major : noPhrases.minor;

	const phrase = pool[Math.floor(Math.random() * pool.length)];
	return phrase;
}


export class MythicView extends ItemView {
	plugin: MGE;
	results: { text: string; tooltip?: string }[] = [];
	resultsContainer: HTMLElement;
	private listEl: HTMLUListElement;
	private cfSelect!: HTMLSelectElement;
	private trendSelect!: HTMLSelectElement;
	private probSelect!: HTMLSelectElement;
	private rollButton!: HTMLButtonElement;
	constructor(leaf: WorkspaceLeaf, plugin: MGE) {
		super(leaf);
		this.plugin = plugin;
	}
	getChaosValue(): number {
		return Number(this.cfSelect?.value ?? 0);
	}

	getTrendValue(): number {
		return Number(this.trendSelect?.value ?? 0);
	}

	getViewType() {
		return MYTHIC_VIEW;
	}

	getDisplayText() {
		return "MGE";
	}
	getIcon(): string {
		return "M"

	}


	getCurrentState(): OracleState {
		return {
			probability: this.probSelect.value as Probability,
			cf: this.cfSelect.value as ChaosFactor,
			tension: this.trendSelect.value as Tension,
		};
	}
	updateTooltip() {
		const state = this.getCurrentState();
		const odds = rollOdds(state);
		const tooltipHtml = `
  <div style="color:#FFD54F"><b>(Major) Yes:</b> ${(odds.excMajorYes * 100).toFixed(2)}%</div>
  <div style="color:#C0CA33"><b>(Minor) Yes:</b> ${(odds.excMinorYes * 100).toFixed(2)}%</div>
  <div style="color:#81C784"><b>Yes:</b> ${(odds.yes * 100).toFixed(2)}%</div>
  <div style="color:#E57373"><b>No:</b> ${(odds.no * 100).toFixed(2)}%</div>
  <div style="color:#EF5350"><b>(Minor) No:</b> ${(odds.excMinorNo * 100).toFixed(2)}%</div>
  <div style="color:#C62828"><b>(Major) No:</b> ${(odds.excMajorNo * 100).toFixed(2)}%</div>
  <div style="color:#26C6DA"><b>Event:</b> ${(odds.event * 100).toFixed(2)}%</div>
`;



		if (this.rollButton) {
			// Remove old tooltip if it exists
			const existing = this.rollButton.querySelector('.mge-tooltip');
			if (existing) existing.remove();

			// Create new tooltip inside the button
			const tooltipDiv = document.createElement('div');
			tooltipDiv.className = 'roll-tooltip';
			tooltipDiv.innerHTML = tooltipHtml;
			this.rollButton.appendChild(tooltipDiv);
		}
	}


	storeResult(result: string | { text: string; tooltip?: string }) {
		let to_copy: string;
		if (typeof result === "string") {
			console.log();
			this.results.push({ text: result });
			to_copy = result;
		} else {
			this.results.push(result);
			to_copy = result.text;
		}

		navigator.clipboard.writeText(to_copy);
		console.log(`Copied: ${to_copy}`);
		this.drawList();
	}
	addFooter(el: Element) {
		const currentTime = new Date().toLocaleString(); // Get the current time in a suitable format
		const footer = document.createElement('div');
		footer.textContent = `${currentTime}`;
		footer.style.fontSize = '8px'; // Adjust the font size as desired
		el.appendChild(footer);

	}
	deleteList() {
		this.containerEl.children[1].querySelectorAll('.results-container').forEach((element) => {
			element.remove();
		})
	}
	private clearList(): void {
		this.results = [];
		this.listEl.empty();
		this.noResults();
	}
	noResults() {
		this.listEl.empty()
		const emptyStateEl = document.createElement('p');
		emptyStateEl.textContent = 'No results available.';
		this.listEl.appendChild(emptyStateEl);
	}

	drawFateCheck(settings: ChaosEngineSettings) {
		const fateCheckContainer = document.createElement('div');
		const fatecheckHeader = document.createElement("h6");
		fateCheckContainer.appendChild(fatecheckHeader);
		fatecheckHeader.setText("Fate Check");

		// Dropdown for Probability
		const dropdown = document.createElement('select');
		this.probSelect = dropdown;
		dropdown.className = 'tooltip-enabled';
		Object.entries(prob_options).forEach(([label, prob]) => {
			const option = document.createElement('option');
			option.textContent = label;
			option.value = prob;
			if (prob === settings.probChoice) option.selected = true; // restore saved
			dropdown.appendChild(option);
		});

		// Checkbox
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'my-checkbox';
		checkbox.style.marginLeft = '5px';
		checkbox.setAttribute("data-title", "Advanced Fatecheck(and,but,numerology)");
		checkbox.classList.add('tooltip-enabled');
		checkbox.checked = settings.advanced ?? false; // restore saved
		// Roll button
		const rollButton = document.createElement('button');
		rollButton.setAttribute('data-title', 'Run Fate Check');
		const diceIcon = document.createElement('i');
		diceIcon.className = 'fa-solid fa-dice-d20 icon';
		rollButton.appendChild(diceIcon);
		rollButton.classList.add("right-button", "roll-button");
		this.rollButton = rollButton;
		// Save on change
		dropdown.addEventListener("change", async () => {
			this.updateTooltip();
			settings.probChoice = dropdown.value as Probability;
			await saveSettings(this.plugin, settings);
		});
		checkbox.addEventListener("change", async () => {
			settings.advanced = checkbox.checked;
			await saveSettings(this.plugin, settings);
		});


		fatecheckHeader.className = 'button-title';
		dropdown.style.marginRight = '10px';
		fatecheckHeader.appendChild(checkbox);
		fatecheckHeader.appendChild(dropdown);
		fatecheckHeader.appendChild(rollButton);

		this.containerEl.children[1].appendChild(fateCheckContainer);

		// On click: run roll
		rollButton.addEventListener('click', () => {
			const state: OracleState = {
				probability: dropdown.value as Probability,
				cf: this.cfSelect.value as ChaosFactor,
				tension: this.trendSelect.value as Tension,
			};
			let mainRoll = RollResult.rollD1000();
			let shadowRoll = RollResult.rollD1000();
			let resolved_roll = RollResolver.resolveRoll(state, mainRoll, shadowRoll);
			const resultText = formatExceptionalResult(resolved_roll.exceptional, resolved_roll.yes);
			let output = resultText;


			if (resolved_roll.eventTriggered) {
				output += "  " + this.eventRoll();
			}
			let exceptionalThreshold = RollResult.exceptionalThreshold(state,resolved_roll.yes);


			const debugTooltip =
				`${state.cf} ${state.tension} ${state.probability}
Main: (${mainRoll.toInt()}) Shadow: (${shadowRoll.toInt()})
Exceptional: ${resolved_roll.exceptional}
Success Threshold: ${ProbabilityUtils.getSuccessThreshold(state)}
Exceptional Thresholds ${exceptionalThreshold.major}, ${exceptionalThreshold.minor}
`;
			this.storeResult({ text: output, tooltip: debugTooltip });
			this.drawList();
		});

		this.updateTooltip();
	}

	drawCFInput(settings: ChaosEngineSettings) {
		const container = this.containerEl.children[1];
		const header = document.createElement("h6");
		header.classList.add("mge-row");

		const label = document.createElement("span");
		label.textContent = "Chaos Factor";

		const group = document.createElement("div");
		group.classList.add("mge-inline-group");

		// CF dropdown
		const cf = document.createElement('select');
		cf.classList.add('cf-dropdown', 'tooltip-enabled');
		cf.setAttribute("data-title", "Chaos Factor!");
		Object.entries(chaos_options).forEach(([text, chaos_factor]) => {
			const opt = document.createElement('option');
			opt.textContent = text;
			opt.value = chaos_factor;
			if (chaos_factor === settings.cfChoice) opt.selected = true;
			cf.appendChild(opt);
		});

		// Tension dropdown
		const trend = document.createElement('select');
		trend.classList.add('trend-dropdown', 'tooltip-enabled');
		trend.setAttribute("data-title", "Trend!");
		Object.entries(tension_options).forEach(([text, tension]) => {
			const opt = document.createElement('option');
			opt.textContent = text;
			opt.value = tension;
			if (tension === settings.tensionChoice) opt.selected = true;
			trend.appendChild(opt);
		});

		// keep refs
		this.cfSelect = cf;
		this.trendSelect = trend;

		// Save on change
		cf.addEventListener("change", async () => {
			settings.cfChoice = cf.value as ChaosFactor;
			this.updateTooltip();
			await saveSettings(this.plugin, settings);
		});
		trend.addEventListener("change", async () => {
			this.updateTooltip();
			settings.tensionChoice = trend.value as Tension;
			await saveSettings(this.plugin, settings);
		});

		group.appendChild(cf);
		group.appendChild(trend);
		header.appendChild(label);
		header.appendChild(group);
		container.appendChild(header);
	}
	async drawSentencePicker() {
		const container = this.containerEl.children[1];

		const header = container.createEl("h6", { text: "Sentence Picker" });

		const dropdown = header.createEl("select", { cls: "epub-dropdown" });
		const pickBtn = header.createEl("button", { text: "Pick Sentence" });
		const randomBtn = header.createEl("button", { text: "Random Book" });

		const epubDir = this.plugin.settings.epubDir // from your settings tab
		const epubFiles = sp.getAllEpubsInDir(this.plugin.settings.epubDir);

		epubFiles.forEach(fullPath => {
			const parsed = path.parse(fullPath);
			const bookName = parsed.name;

			dropdown.createEl("option", {
				text: bookName,
				value: fullPath,
			});
		});
		pickBtn.addEventListener("click", async () => {
			const selectedPath = dropdown.value;
			console.log(selectedPath);
			const sentence = await sp.getRandomSentenceFromEpub(selectedPath);
			console.log(sentence);
			this.storeResult(sentence);
		});

		randomBtn.addEventListener("click", async () => {
			if (epubFiles.length === 0) {
				this.storeResult("⚠️ No epubs found.");
				return;
			}
			const randomFile = epubFiles[Math.floor(Math.random() * epubFiles.length)];
			const sentence = await sp.getRandomSentenceFromEpub(randomFile);
			this.storeResult(sentence);
		});
	}

	drawList() {
		this.listEl.empty();
		if (!this.listEl) {
			this.resultsContainer.appendChild(this.listEl);
		}
		if (this.results.length === 0) {
			this.noResults()
			return;
		} else {
			for (let i = this.results.length - 1; i >= 0; i--) {
				console.log("drawList -> adding index:", i, "value:", this.results[i]);
				const entry = this.results[i];
				if (typeof entry === "string") {
					this.addToResults(entry, i);
				} else {
					this.addToResults(entry.text, i, entry.tooltip)
				}
			};

		}
	}
	updateDisplay(toInputNum: number, displayId: string) {
		const inputContainer = this.containerEl.querySelector(displayId) as HTMLInputElement;
		inputContainer.value = toInputNum.toString()
	}
	addToResults(result: string, i: number, tooltip?: string) {
		const itemEl = document.createElement('li');
		const textEl = document.createElement('span');
		textEl.style.fontWeight = 'bold';

		if (result.includes("  ")) {
			const split_text = result.split("  ");
			textEl.textContent = split_text[2] ?? "";
			const eventEl = document.createElement('div');
			eventEl.textContent = split_text[0] + "\n" + split_text[1];
			eventEl.style.whiteSpace = 'pre-line';
			eventEl.style.display = 'block';
			eventEl.style.fontWeight = 'bold';
			itemEl.appendChild(textEl);
			itemEl.appendChild(eventEl);
		} else {
			textEl.textContent = result;
			itemEl.appendChild(textEl);
		}

		itemEl.className = 'my-list-item';

		// Copy button
		const copyBtn = document.createElement('button');
		const copyBtnImg = document.createElement('i');
		copyBtnImg.className = 'fa-regular fa-clipboard';
		copyBtn.appendChild(copyBtnImg);
		copyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(result);
			console.log(`Copied: ${result}`);
		});
		itemEl.appendChild(copyBtn);

		itemEl.style.position = 'relative';
		itemEl.style.paddingRight = '0px';
		itemEl.style.marginTop = '20px';

		copyBtn.style.position = 'absolute';
		copyBtn.className = 'borderless-button';
		copyBtn.style.right = '0';
		copyBtn.style.bottom = '0';
		copyBtn.setAttribute('data-title', 'Copy Result');
		copyBtn.classList.add("tooltip-enabled");
		calculateButtonPadding(copyBtn);

		this.addFooter(itemEl);

		// Delete button
		const deleteButton = document.createElement('button');
		deleteButton.setAttribute('data-title', 'Delete Result');
		const deleteIcon = document.createElement('i');
		deleteIcon.className = 'fa-solid fa-trash';
		deleteButton.className = 'borderless-button';
		deleteButton.classList.add("tooltip-enabled");
		calculateButtonPadding(deleteButton);
		deleteButton.style.position = 'absolute';
		deleteButton.style.top = '0';
		deleteButton.style.right = '0';
		deleteButton.appendChild(deleteIcon);
		deleteButton.addEventListener('click', () => {
			if (i >= 0 && i < this.results.length) {
				this.results.splice(i, 1);
				this.drawList();
			}
		});
		itemEl.appendChild(deleteButton);
		if (tooltip) {
			const tooltipDiv = document.createElement("div");
			tooltipDiv.className = "result-tooltip";
			tooltipDiv.textContent = tooltip;
			itemEl.appendChild(tooltipDiv);
		}

		this.listEl.appendChild(itemEl);
		console.log("addToResults -> appended li, list length:", this.listEl.children.length);
		this.listEl.style.marginTop = '-23px';
	}
	drawResultsList() {
		this.listEl.empty();

		if (this.results.length === 0) {
			this.noResults();
			return;
		}

		for (let i = this.results.length - 1; i >= 0; i--) {
			this.addToResults(this.results[i].text, i);
		}
	}




	eventRoll() {
		function selectEvent(roll: number): string {
			const eventOptions = [
				{ range: [1, 7], event: "REMOTE EVENT" },
				{ range: [8, 28], event: "NPC ACTION" },
				{ range: [29, 35], event: "INTRODUCE A NEW NPC" },
				{ range: [36, 45], event: "MOVE TOWARD A THREAD" },
				{ range: [46, 52], event: "MOVE AWAY FROM A THREAD" },
				{ range: [53, 55], event: "CLOSE A THREAD" },
				{ range: [56, 67], event: "PC NEGATIVE" },
				{ range: [68, 75], event: "PC POSITIVE" },
				{ range: [76, 83], event: "AMBIGUOUS EVENT" },
				{ range: [84, 92], event: "NPC NEGATIVE" },
				{ range: [93, 100], event: "NPC POSITIVE" },
			];
			for (const option of eventOptions) {
				const [min, max] = option.range;
				if (roll >= min && roll <= max) {
					return option.event;
				}
			}

			return "Invalid roll. The roll should be between 1 and 100.";
		}
		const rolledNumber = randomInt(1, 101)
		const selectedEvent = selectEvent(rolledNumber);
		const meaning1 = getRandomElement(descriptorList1);
		const meaning2 = getRandomElement(descriptorList2);
		const event = selectedEvent + "\n" + meaning1 + " " + meaning2;
		return event;
	}
	drawEventRoll() {
		const container = this.containerEl.children[1]; const event_title = document.createElement('h6');
		event_title.setText('Event Roll');
		const diceIcon = document.createElement('i');
		const rollButton = document.createElement('button');
		diceIcon.className = 'fa-solid fa-question';
		diceIcon.addClass("icon");
		rollButton.appendChild(diceIcon);
		rollButton.addClass("tooltip-enabled")
		rollButton.setAttribute("data-title", "Roll Event!")
		rollButton.addClass("right-button")
		event_title.className = 'button-title'
		rollButton.addEventListener('click', () => {
			this.storeResult(this.eventRoll());
		})
		event_title.appendChild(rollButton);
		container.appendChild(event_title)

	}
	runDetailCheckButton() {
		const option = this.contentEl.querySelector('.detail-check-dropdown') as HTMLSelectElement;
		const value = option.value;
		if (value === "Detail") {
			this.storeResult(this.detailCheck())
		}
		else if (value === "Meaning") {
			const meaning1 = getRandomElement(descriptorList1);
			const meaning2 = getRandomElement(descriptorList2);
			this.storeResult(meaning1 + "\n" + meaning2)
		}
		else if (value === "Action") {
			const action1 = getRandomElement(actionList1);
			const action2 = getRandomElement(actionList2);
			this.storeResult(action1 + "\n" + action2)
		}
		else if (value === "Meaning & Action") {
			const meaning1 = getRandomElement(descriptorList1);
			const meaning2 = getRandomElement(descriptorList2);
			const action1 = getRandomElement(actionList1);
			const action2 = getRandomElement(actionList2);
			this.storeResult(action1 + " " + action2 + "\n" + meaning1 + " " + meaning2)
		}
	}
	checkDetail(roll: number): string {
		const emotions: { [key: number]: string } = {
			4: "ANGER",
			5: "SADNESS",
			6: "FEAR",
			7: "DISFAVORS THREAD",
			8: "DISFAVORS PC",
			9: "FOCUS NPC",
			10: "FAVORS NPC",
			11: "FOCUS PC",
			12: "DISFAVORS NPC",
			13: "FOCUS THREAD",
			14: "FAVORS PC",
			15: "FAVOR THREAD",
			16: "COURAGE",
			17: "HAPPINESS",
		};
		const result = emotions[roll] || (roll >= 18 ? "CALM" : "ANGER")
		return result
	}
	detailCheck(): string {
		const chaosFactor_num = 3;
		let mod;
		if (chaosFactor_num === 3) {
			mod = 2
		} else if (chaosFactor_num === 6) {
			mod = -2
		} else {
			mod = 0
		}
		const roll = randomInt(1, 11) + randomInt(1, 11) + mod;
		const emotion = this.checkDetail(roll);
		return emotion
	}

	drawDetailCheck() {
		const container = this.containerEl.children[1];
		const event_title = document.createElement('h6');
		event_title.setText('Detail Check');
		const diceIcon = document.createElement('i');
		const rollButton = document.createElement('button');
		const dropdown = document.createElement('select');
		dropdown.className = 'detail-check-dropdown'
		const options = ["Detail", "Meaning", "Action", "Meaning & Action"];
		options.forEach((optionText) => {
			const option = document.createElement('option');
			option.textContent = optionText;
			option.value = optionText
			dropdown.appendChild(option);
		});
		event_title.appendChild(dropdown)
		diceIcon.className = 'fa-solid fa-magnifying-glass';
		diceIcon.addClass("icon");
		rollButton.appendChild(diceIcon);
		rollButton.addClass("tooltip-enabled")
		rollButton.setAttribute("data-title", "Roll Detail Check!")
		rollButton.addClass("right-button")
		event_title.className = 'button-title'
		rollButton.addEventListener('click', () => {
			this.runDetailCheckButton();
		})
		event_title.appendChild(rollButton);
		container.appendChild(event_title)
	}
	statisticCheck(mod: number) {

		const rollResult = randomInt(1, 11) + randomInt(1, 11) + mod;
		const percentageRanges: { range: [number, number]; event: string }[] = [
			{ range: [0, 2], event: "VERY WEAK -75%" },
			{ range: [3, 4], event: "WEAK -50%" },
			{ range: [5, 6], event: "LESS -10%" },
			{ range: [7, 11], event: "EXPECTED BASELINE" },
			{ range: [12, 14], event: "MORE +10%" },
			{ range: [15, 16], event: "STRONG +50%" },
			{ range: [17, 18], event: "VERY STRONG +100%" },
			{ range: [19, 20], event: "PC BASELINE" },
			{ range: [21, 22], event: "PC MORE +10%" },
			{ range: [23, 24], event: "PC STRONG +50%" },
			{ range: [25, 26], event: "PC VERY STRONG +100%" },
		];

		for (const { range, event } of percentageRanges) {
			const [minRoll, maxRoll] = range;
			if (rollResult >= minRoll && rollResult <= maxRoll) {
				return event;
			}
		}
		return "UNKNOWN";
	}


	drawStatisticCheck() {
		const dropdown = document.createElement('select');
		const dropdownlabel = document.createElement('h6');
		dropdownlabel.textContent = 'Statistic Check'
		const options = { "Important NPC": 2, "Weak Attribute": -2, "Strong Attribute": 2, "Prime Attribute": 4 };
		Object.entries(options).forEach(([optionText, numericValue]) => {
			const option = document.createElement('option');
			option.textContent = optionText;
			option.value = numericValue.toString();
			dropdown.appendChild(option);
		});
		dropdownlabel.appendChild(dropdown)
		const rollButton = document.createElement('button');
		const diceIcon = document.createElement('i');
		diceIcon.className = 'fa-solid fa-chart-simple';
		diceIcon.addClass("icon");
		rollButton.appendChild(diceIcon);
		rollButton.addClass("tooltip-enabled")
		rollButton.setAttribute("data-title", "Roll statistic Check!")
		dropdownlabel.className = 'button-title';
		rollButton.addClass("right-button")
		dropdownlabel.appendChild(rollButton);
		rollButton.addEventListener('click', () => {
			const result = this.statisticCheck(parseInt((dropdown.value)))
			this.storeResult(result)
		})
		this.containerEl.children[1].appendChild(dropdownlabel)

	}
	getStance() {
		const disp = this.containerEl.querySelector('.input-disposition') as HTMLInputElement;
		const disposition_value = parseInt(disp.value);
		for (const { range, stance, mod } of dispRanges) {
			const [minRoll, maxRoll] = range;
			if (disposition_value >= minRoll && disposition_value <= maxRoll) {
				return [mod, stance];
			}
		}
		return [-2, "broke"]
	}
	updateDisposition(number: number) {
		const disp = this.containerEl.querySelector('.input-disposition') as HTMLInputElement;
		const dispLabel = this.containerEl.querySelector('.dispositionLabel') as HTMLInputElement;
		let disposition_value = parseInt(disp.value);
		disposition_value += number;
		disp.value = disposition_value.toString()
		this.updateDispositionDisplay(dispLabel)
	}
	updateDispositionDisplay(display: HTMLElement) {
		const [_, stance] = this.getStance();
		display.textContent = stance as string;
		if (stance === 'Passive') {
			display.style.backgroundColor = 'cyan';
		} else if (stance === 'Moderate') {
			display.style.backgroundColor = 'grey';
		} else if (stance === 'Active') {
			display.style.backgroundColor = 'orange';
		}
		else if (stance === 'Aggressive') {
			display.style.backgroundColor = 'red';
		}

	}
	drawBehaviorCheck() {
		const app = this;
		const container = this.containerEl.children[1];
		const event_title = document.createElement('h6');
		event_title.setText('Behavior Check');
		const dispositionButton = document.createElement('button');
		const dispositionIcon = document.createElement('i');
		dispositionIcon.className = 'fa-solid fa-dice';
		dispositionIcon.addClass("icon");
		dispositionButton.style.height = '30px'
		dispositionButton.style.width = '30px'
		dispositionIcon.style.fontSize = '10px'
		dispositionButton.appendChild(dispositionIcon);
		dispositionButton.addClass("tooltip-enabled")
		const dispotionContainer = document.createElement('div');
		dispotionContainer.style.display = 'flex'
		const input = document.createElement('input');
		dispositionButton.setAttribute("data-title", "Roll Disposition!")
		input.addClass('input-disposition')
		input.value = '0'
		input.style.textAlign = 'center'
		input.type = 'number';
		input.style.width = '45px';
		input.min = '1';
		input.max = '99';
		input.maxLength = 2;
		input.addEventListener("input", function() {
			if (this.value.length > 2) {
				this.value = this.value.slice(0, 2);
			}
			else if (this.value.length === 0) {
				this.value = '0'
			}
			app.updateDispositionDisplay(dispositionLabel)
		});
		const diceIcon = document.createElement('i');
		const rollButton = document.createElement('button');
		diceIcon.className = 'fa-solid fa-person-circle-question';
		diceIcon.addClass("icon");
		rollButton.appendChild(diceIcon);
		rollButton.addClass("tooltip-enabled")
		rollButton.setAttribute("data-title", "Roll Behavior Check!")
		rollButton.addClass("right-button")
		const dispositionLabel = document.createElement('span');
		dispositionLabel.addClass('dispositionLabel')
		dispositionLabel.textContent = 'Passive';
		dispositionLabel.style.color = 'black';
		dispositionLabel.style.border = '1px solid black'
		dispositionLabel.style.backgroundColor = 'cyan'
		event_title.className = 'button-title';
		rollButton.addEventListener('click', () => {
			app.behaviorCheck()
		})

		dispositionButton.addEventListener("click", function() {
			app.updateDisplay(randomInt(2, 21), '.input-disposition')
			app.updateDispositionDisplay(dispositionLabel)
		});
		dispotionContainer.appendChild(dispositionButton)
		dispotionContainer.appendChild(input)
		dispotionContainer.appendChild(dispositionLabel)
		event_title.appendChild(dispotionContainer)
		event_title.appendChild(rollButton);
		container.appendChild(event_title)

	}
	behaviorCheck() {
		const roll = randomInt(1, 11);
		for (const option of npcActionTable1) {
			const [min, max] = option.range;
			if (roll >= min && roll <= max) {
				const action = option.action;
				this.storeResult(action)
				if (action.contains("+2")) {
					this.updateDisposition(2)
				}
				else if (action.contains("-2")) {
					this.updateDisposition(-2)
				}
				else if (action.contains("-4")) {
					this.updateDisposition(-4)
				}
				else if (action.contains("+4")) {
					this.updateDisposition(4)
				}
				if (action.contains("NPC Action")) {
					let [mod, _] = this.getStance()
					mod = mod as number;
					const roll = randomInt(1, 11) + randomInt(1, 11) + mod;
					for (const option of npcActionTable2) {
						const [min, max] = option.range;
						if (roll >= min && roll <= max) {
							const action = option.action;
							this.storeResult(action)
						}
					}
				}
			}
		}
	}
	async onOpen() {
		const container = this.containerEl.children[1];
		let settings = await loadSettings(this.plugin);

		container.createEl("h4", { text: "Mythic Game Emulator" });

		// draw controls first
		this.drawCFInput(settings);
		this.drawFateCheck(settings);
		this.updateTooltip();
		this.drawEventRoll();
		this.drawDetailCheck();
		this.drawStatisticCheck();
		this.drawBehaviorCheck();
		this.drawSentencePicker();

		// ⬇️ build Results at the end (or move it here if already built)
		if (!this.resultsContainer) {
			this.resultsContainer = container.createDiv("results-container");

			const resultHeader = this.resultsContainer.createDiv("results-header");
			const resultTitle = resultHeader.createSpan({ cls: "results-title" });
			resultTitle.setText("Results");

			const clearBtn = resultHeader.createEl("button", { cls: "borderless-button right-button tooltip-enabled" });
			clearBtn.setAttribute("data-title", "Delete all results");
			calculateButtonPadding(clearBtn);
			clearBtn.createEl("i", { cls: "fa-solid fa-trash" });
			clearBtn.addEventListener("click", () => {
				this.results = [];
				this.drawList();
			});

			this.listEl = this.resultsContainer.createEl("ul", { cls: "results-list" });
		} else {
			// if it already exists, this moves it to the bottom
			container.appendChild(this.resultsContainer);
		}

		this.drawResultsList();
	}


	async onClose() {
		// Nothing to clean up.
	}
}

