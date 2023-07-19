import { ItemView, WorkspaceLeaf} from 'obsidian';
import { randomInt } from 'crypto';
import actionList1 from 'JSONS/actions1.json'
import actionList2 from 'JSONS/actions2.json'
import descriptorList1 from 'JSONS/descriptors1.json';
import descriptorList2 from 'JSONS/descriptors2.json';
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

export class MythicView extends ItemView {
	results: string[] = [];
	chaosFactor_num: number = 3;
	private listEl: HTMLUListElement;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
	storeResult(result: string): void {
		this.results.push(result);
		this.drawList(); // Refresh the list to reflect the updated results
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
		this.deleteList()
		while (this.listEl.firstChild) {
			this.listEl.firstChild.remove();
		}
		this.noResults()
	}
	noResults() {
		this.listEl.empty()
		const emptyStateEl = document.createElement('p');
		emptyStateEl.textContent = 'No results available.';
		this.listEl.appendChild(emptyStateEl);
	}
	drawList() {
		this.deleteList()
		if (!this.listEl) {
			const listContainerEl = document.createElement('div');
			this.listEl = document.createElement('ul');
			this.listEl.className = 'my-list'
			listContainerEl.appendChild(this.listEl);
			this.containerEl.children[1].appendChild(listContainerEl);
		}
		if (this.results.length === 0) {
			this.noResults()
		} else {
			this.listEl.empty()
			for (let i = this.results.length - 1; i >= 0; i--) {
				const result = this.results[i];
				this.addToResults(result, i)
			};

		}
	}
	ChaosFactor(mod: string) {
		if (mod === '+1') {
			this.chaosFactor_num = Math.min(this.chaosFactor_num + 1, 6); // Increase by 1, capped at 6
		} else {
			this.chaosFactor_num = Math.max(this.chaosFactor_num - 1, 3); // Decrease by 1, capped at 3
		}
		this.updateDisplay(this.chaosFactor_num, '.input-cf')
	}
	updateDisplay(toInputNum: number, displayId: string) {
		const inputContainer = this.containerEl.querySelector(displayId) as HTMLInputElement;
		inputContainer.value = toInputNum.toString()
	}
	drawFateCheck() {
		const fateCheckContainer = document.createElement('div');
		const fatecheckHeader = document.createElement("h6");
		fateCheckContainer.appendChild(fatecheckHeader);
		fatecheckHeader.setText("Fate Check");
		const dropdown = document.createElement('select');
		dropdown.className = 'tooltip-enabled';
		const dropdownContainer = document.createElement('div');
		dropdownContainer.style.position = 'relative';
		const options = { '50/50 or Unsure': 0, 'Likely': 2, 'Unlikely': -2, 'Very Likely': 4, 'Very Unlikely': -4, 'Sure Thing': 6, 'No Way': -6, 'Has to Be': 8, 'Impossible': -8 }; Object.entries(options).forEach(([optionText, numericValue]) => {
			const option = document.createElement('option');
			option.textContent = optionText;
			option.value = numericValue.toString();
			dropdown.appendChild(option);
		});
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'my-checkbox';
		checkbox.style.marginLeft = '5px';
		checkbox.setAttribute("data-title", "Is this check favorable?");
		checkbox.addClass('tooltip-enabled')
		const rollButton = document.createElement('button');
		const diceIcon = document.createElement('i');
		diceIcon.className = 'fa-solid fa-dice-d20';
		diceIcon.addClass("icon");
		rollButton.appendChild(diceIcon);
		rollButton.addClass("tooltip-enabled")
		rollButton.setAttribute("data-title", "Roll Fate Check!")
		fatecheckHeader.className = 'button-title';
		rollButton.addClass("right-button")
		dropdown.style.marginRight = '10px'
		fatecheckHeader.appendChild(checkbox)
		fatecheckHeader.appendChild(dropdown)
		fatecheckHeader.appendChild(rollButton);

		this.containerEl.children[1].appendChild(fateCheckContainer)
		const chaosFactor_num = this.chaosFactor_num;
		rollButton.addEventListener('click', () => { 
			let roll_result = "";
			let chaos_mod = 0;
			if (chaosFactor_num == 3) {
				if (checkbox.checked) {
					chaos_mod = 2
				}
				else {
					chaos_mod = -2
				}
			}
			else if (chaosFactor_num == 6) {
				if (checkbox.checked) {
					chaos_mod = -2
				}
				else {
					chaos_mod = 2
				}
			}
			let die1 = randomInt(1, 11);
			let die2 = randomInt(1, 11);
			let chaos_die = randomInt(1, 11);
			let result = (die2 + die1 + parseInt(dropdown.value) + chaos_mod)


			if (chaosFactor_num >= chaos_die) {
				if (die1 === die2) {
				}
				else if (die1 % 2 === 0 && die2 % 2 === 0) {
					const event = this.eventRoll();
					roll_result = event + "  " + roll_result
				} else if (die1 % 2 === 1 && die2 % 2 === 1) {
					roll_result += "Execptional "

				} else {
				}
			}
			if (result >= 11) {
				roll_result += "Yes"
			}
			else {
				roll_result += "No"
			}
			this.storeResult(roll_result);
			this.drawList()
		});

	}
	addToResults(result: string, i: number) {
		const itemEl = document.createElement('li');
		const textEl = document.createElement('span');
		textEl.style.fontWeight ='bold';
		if (result.contains("  ")) {
			const split_text = result.split("  ")
			textEl.textContent = split_text[2];
			const eventEl = document.createElement('div');
			eventEl.textContent = split_text[0] + "\n" + split_text[1];
			eventEl.style.whiteSpace = 'pre-line'; // Allow preserving newlines
			eventEl.style.display = 'block'; //
			eventEl.style.fontWeight = 'bold';
			itemEl.appendChild(textEl);
			itemEl.appendChild(eventEl);
		}
		else {
			textEl.textContent = result;
			itemEl.appendChild(textEl);
		}
		itemEl.className = 'my-list-item'; // Add custom class for styling
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
		this.addFooter(itemEl);
		itemEl.style.paddingRight = '0px'; // Adjust the padding value as needed
		itemEl.style.marginTop = '20px'
		copyBtn.style.position = 'absolute';
		copyBtn.className = 'borderless-button';
		copyBtn.style.right = '0';
		copyBtn.setAttribute('data-title', 'Copy Result');
		copyBtn.style.bottom = '0'
		copyBtn.addClass("tooltip-enabled")
		calculateButtonPadding(copyBtn)
		const deleteButton = document.createElement('button');
		deleteButton.setAttribute('data-title', 'Delete Result');
		const deleteIcon = document.createElement('i');
		deleteButton.className = 'borderless-button'; // Add custom class for styling
		calculateButtonPadding(deleteButton)
		deleteIcon.className = 'fa-solid fa-trash';
		deleteButton.addClass("tooltip-enabled")
		deleteButton.style.position = 'absolute';
		deleteButton.style.top = '0';
		deleteButton.style.right = '0';
		deleteButton.addEventListener('click', () => { //takes the current index from the loop and deletes that from the results array
			if (i >= 0 && i < this.results.length) {
				this.results.splice(i, 1);
			}
			this.drawList()
		});
		deleteButton.appendChild(deleteIcon);
		itemEl.appendChild(deleteButton);
		this.listEl.appendChild(itemEl);
		this.listEl.style.marginTop = '-23px';


	}
	drawCFInput() {
		const container = this.containerEl.children[1]
		const header = document.createElement("h6");
		header.setText("Chaos Factor")
		header.className = 'button-title'
		const subtractButton = document.createElement('button');
		const subtractButtonIcon = document.createElement('i');
		subtractButton.addClass("tooltip-disabled")
		subtractButtonIcon.className = 'fa-regular fa-square-minus fa-xl';
		subtractButton.appendChild(subtractButtonIcon);
		subtractButton.addEventListener('click', () => {
			this.ChaosFactor('-1')
		});
		const addButton = document.createElement('button');
		const addButtonIcon = document.createElement('i');
		addButtonIcon.className = 'fa-regular fa-square-plus fa-xl';
		addButton.addClass("tooltip-disabled")
		addButton.appendChild(addButtonIcon);
		addButton.addEventListener('click', () => {
			this.ChaosFactor('+1')
		});

		const chaosFactorInput = document.createElement('input');
		chaosFactorInput.addClass('input-cf')
		chaosFactorInput.style.width = '26px'
		chaosFactorInput.style.textAlign = 'center'
		chaosFactorInput.type = 'number';
		chaosFactorInput.value = this.chaosFactor_num.toString();
		chaosFactorInput.min = '3',
			chaosFactorInput.max = '6',
			chaosFactorInput.step = '1';
		const inputContainer = document.createElement('div');
		inputContainer.className = 'button-right'
		inputContainer.style.display = 'flex'
		inputContainer.appendChild(subtractButton)
		inputContainer.appendChild(chaosFactorInput)
		inputContainer.appendChild(addButton)
		header.appendChild(inputContainer)
		container.appendChild(header);
	}
	drawResultsList() {
		const resultContainer = document.createElement('div');
		const result_title = document.createElement('span');
		result_title.style.marginLeft = "5px";
		result_title.style.fontSize = "23px";
		result_title.style.fontWeight = "bold";
		result_title.setText("Results");
		result_title.className = 'button-title';
		const resultButton = document.createElement('button');
		resultButton.addClass('borderless-button');
		resultButton.addClass('right-button');
		resultButton.addClass("tooltip-enabled")
		resultButton.setAttribute("data-title", "Delete all results")
		calculateButtonPadding(resultButton)
		result_title.style.border = '10px';
		result_title.style.borderColor = "#fff";
		const resultIcon = document.createElement('i');
		resultIcon.className = 'fa-solid fa-trash';
		const line = document.createElement('hr');
		line.style.position = 'relative';
		line.style.top = '-23px';
		resultButton.appendChild(resultIcon);
		result_title.appendChild(resultButton);
		resultContainer.appendChild(result_title)
		resultContainer.appendChild(line)
		resultContainer.style.border = '10px'
		resultContainer.style.borderColor = "#fff"
		this.containerEl.children[1].appendChild(resultContainer)
		resultButton.addEventListener('click', () => {
			this.clearList()
			this.results = []

		})

		this.drawList()
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
		const event = selectedEvent + "  " + meaning1 + " " + meaning2;
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
		} else if (value === "Both") {
			const detail = this.detailCheck()
			const meaning1 = getRandomElement(descriptorList1);
			const meaning2 = getRandomElement(descriptorList2);
			const detailAndMeaning = detail + "  " + meaning1 + " " + meaning2;
			this.storeResult(detailAndMeaning)
		}
		else if (value === "Meaning"){
			const meaning1 = getRandomElement(descriptorList1);
			const meaning2 = getRandomElement(descriptorList2);
			this.storeResult(meaning1 + "  " + meaning2)
		}
		else if (value === "Action"){
			const action1 = getRandomElement(actionList1);
			const action2 = getRandomElement(actionList2);
			this.storeResult(action1 + "  " + action2)
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
		const chaosFactor_num = this.chaosFactor_num;
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
		const options = ["Detail", "Meaning", "Both", "Action"];
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
					const roll = randomInt(1, 11) + randomInt(1,11) + mod;
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
		container.createEl("h4", { text: "Mythic Game Emulator" });
		this.drawCFInput();
		this.drawFateCheck();
		this.drawEventRoll();
		this.drawDetailCheck();
		this.drawStatisticCheck();
		this.drawBehaviorCheck();
		this.drawResultsList();
	}
	async onClose() {
		// Nothing to clean up.
	}
}

