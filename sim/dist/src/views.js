import { __awaiter } from "tslib";
import { ItemView } from 'obsidian';
import * as sp from "./systems/sentencePicker";
import { ChaosFactor, Tension, Probability } from "./lib/types";
import { RollResult, RollResolver, Exceptional } from './systems/chaosEngine';
import * as path from "path";
import { randomInt } from 'crypto';
import actionList1 from 'JSONS/actions1.json';
import actionList2 from 'JSONS/actions2.json';
import descriptorList1 from 'JSONS/descriptors1.json';
import descriptorList2 from 'JSONS/descriptors2.json';
const dispRanges = [
    { range: [-100, 5], stance: "Passive", mod: -2 },
    { range: [6, 10], stance: "Moderate", mod: 0 },
    { range: [11, 15], stance: "Active", mod: 2 },
    { range: [16, 99], stance: "Aggressive", mod: 4 },
];
const npcActionTable1 = [
    { range: [1, 3], action: "Theme Action" },
    { range: [4, 5], action: "NPC Continues" },
    { range: [6, 6], action: "NPC Continues +2" },
    { range: [7, 7], action: "NPC Contines -2" },
    { range: [8, 8], action: "NPC Action" },
    { range: [9, 9], action: "NPC Action -4" },
    { range: [10, 10], action: "NPC Action +4" },
];
const npcActionTable2 = [
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
const prob_options = {
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
const chaos_options = {
    'Peaceful': ChaosFactor.Peaceful,
    'Serene': ChaosFactor.Serene,
    'Calm': ChaosFactor.Calm,
    'Stable': ChaosFactor.Serene,
    'Chaotic': ChaosFactor.Chaotic,
    'Havoc': ChaosFactor.Havoc,
    'Pandemonium': ChaosFactor.Pandemonium
};
const tension_options = {
    'Locked In': Tension.LockedIn,
    'Under Control': Tension.UnderControl,
    'Coasting': Tension.Coasting,
    'Neutral': Tension.Neutral,
    'Tense': Tension.Tense,
    'Getting Crazy': Tension.GettingCrazy,
    'Full Tilt': Tension.FullTilt
};
export const MYTHIC_VIEW = "mythic view";
function calculateButtonPadding(button) {
    const textContent = button.getAttribute('data-title');
    if (textContent) {
        const textLength = textContent.length;
        const paddingSides = `${textLength}px`; // Adjust the multiplier as needed
        button.style.setProperty('--tooltip-padding-left', paddingSides);
        button.style.setProperty('--tooltip-padding-right', paddingSides);
        return paddingSides;
    }
}
function getRandomElement(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}
function formatExceptionalResult(exceptional, yes) {
    if (!exceptional)
        return yes ? "Yes" : "No";
    const base = yes ? "Yes" : "No";
    return `${base} — Exceptional (${Exceptional[exceptional]})`;
}
export class MythicView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.results = [];
        this.chaosFactor_num = 3;
        this.plugin = plugin;
    }
    getChaosValue() {
        var _a, _b;
        return Number((_b = (_a = this.cfSelect) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0);
    }
    getTrendValue() {
        var _a, _b;
        return Number((_b = (_a = this.trendSelect) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0);
    }
    getViewType() {
        return MYTHIC_VIEW;
    }
    getDisplayText() {
        return "MGE";
    }
    getIcon() {
        return "M";
    }
    storeResult(result) {
        navigator.clipboard.writeText(result);
        console.log("storeResult -> adding:", result);
        console.log(`Copied: ${result}`);
        this.results.push(result);
        this.drawList(); // Refresh the list to reflect the updated results
    }
    addFooter(el) {
        const currentTime = new Date().toLocaleString(); // Get the current time in a suitable format
        const footer = document.createElement('div');
        footer.textContent = `${currentTime}`;
        footer.style.fontSize = '8px'; // Adjust the font size as desired
        el.appendChild(footer);
    }
    deleteList() {
        this.containerEl.children[1].querySelectorAll('.results-container').forEach((element) => {
            element.remove();
        });
    }
    clearList() {
        this.results = [];
        this.listEl.empty();
        this.noResults();
    }
    noResults() {
        this.listEl.empty();
        const emptyStateEl = document.createElement('p');
        emptyStateEl.textContent = 'No results available.';
        this.listEl.appendChild(emptyStateEl);
    }
    drawSentencePicker() {
        return __awaiter(this, void 0, void 0, function* () {
            const container = this.containerEl.children[1];
            const header = container.createEl("h6", { text: "Sentence Picker" });
            const dropdown = header.createEl("select", { cls: "epub-dropdown" });
            const pickBtn = header.createEl("button", { text: "Pick Sentence" });
            const randomBtn = header.createEl("button", { text: "Random Book" });
            const epubDir = this.plugin.settings.epubDir; // from your settings tab
            const epubFiles = sp.getAllEpubsInDir(this.plugin.settings.epubDir);
            epubFiles.forEach(fullPath => {
                const parsed = path.parse(fullPath);
                const bookName = parsed.name;
                dropdown.createEl("option", {
                    text: bookName,
                    value: fullPath,
                });
            });
            pickBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                const selectedPath = dropdown.value;
                console.log(selectedPath);
                const sentence = yield sp.getRandomSentenceFromEpub(selectedPath);
                console.log(sentence);
                this.storeResult(sentence);
            }));
            randomBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
                if (epubFiles.length === 0) {
                    this.storeResult("⚠️ No epubs found.");
                    return;
                }
                const randomFile = epubFiles[Math.floor(Math.random() * epubFiles.length)];
                const sentence = yield sp.getRandomSentenceFromEpub(randomFile);
                this.storeResult(sentence);
            }));
        });
    }
    drawList() {
        this.listEl.empty();
        if (!this.listEl) {
            this.resultsContainer.appendChild(this.listEl);
            //this.resultsContainer.children[1].appendChild(listContainerEl);
        }
        if (this.results.length === 0) {
            this.noResults();
            return;
        }
        else {
            for (let i = this.results.length - 1; i >= 0; i--) {
                console.log("drawList -> adding index:", i, "value:", this.results[i]);
                const result = this.results[i];
                this.addToResults(result, i);
            }
            ;
        }
    }
    updateDisplay(toInputNum, displayId) {
        const inputContainer = this.containerEl.querySelector(displayId);
        inputContainer.value = toInputNum.toString();
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
        Object.entries(prob_options).forEach(([label, prob]) => {
            const option = document.createElement('option');
            option.textContent = label;
            option.value = prob;
            dropdown.appendChild(option);
        });
        const rollButton = document.createElement('button');
        const diceIcon = document.createElement('i');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'my-checkbox';
        checkbox.style.marginLeft = '5px';
        checkbox.setAttribute("data-title", "Advanced Fatecheck(and,but,numerology)");
        checkbox.addClass('tooltip-enabled');
        diceIcon.className = 'fa-solid fa-dice-d20';
        diceIcon.addClass("icon");
        rollButton.appendChild(diceIcon);
        rollButton.addClass("tooltip-enabled");
        rollButton.setAttribute("data-title", "Roll Fate Check!");
        fatecheckHeader.className = 'button-title';
        rollButton.addClass("right-button");
        dropdown.style.marginRight = '10px';
        fatecheckHeader.appendChild(checkbox);
        fatecheckHeader.appendChild(dropdown);
        fatecheckHeader.appendChild(rollButton);
        this.containerEl.children[1].appendChild(fateCheckContainer);
        rollButton.addEventListener('click', () => {
            const state = {
                probability: dropdown.value,
                cf: this.cfSelect.value,
                tension: this.trendSelect.value,
            };
            console.log(state);
            let roll_result_str = "";
            let roll = RollResult.rollD1000(state);
            let resolved_roll = RollResolver.resolveRoll(state, roll);
            const result = formatExceptionalResult(resolved_roll.exceptional, resolved_roll.yes);
            roll_result_str += result;
            if (resolved_roll.and) {
                roll_result_str += " AND ";
            }
            if (resolved_roll.but) {
                roll_result_str += " BUT ";
            }
            if (resolved_roll.eventTriggered) {
                roll_result_str += "  ";
                roll_result_str += this.eventRoll();
            }
            console.log(roll_result_str);
            this.storeResult(roll_result_str);
            this.drawList();
        });
    }
    addToResults(result, i) {
        var _a;
        const itemEl = document.createElement('li');
        const textEl = document.createElement('span');
        textEl.style.fontWeight = 'bold';
        if (result.includes("  ")) {
            const split_text = result.split("  ");
            textEl.textContent = (_a = split_text[2]) !== null && _a !== void 0 ? _a : "";
            const eventEl = document.createElement('div');
            eventEl.textContent = split_text[0] + "\n" + split_text[1];
            eventEl.style.whiteSpace = 'pre-line';
            eventEl.style.display = 'block';
            eventEl.style.fontWeight = 'bold';
            itemEl.appendChild(textEl);
            itemEl.appendChild(eventEl);
        }
        else {
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
        this.listEl.appendChild(itemEl);
        console.log("addToResults -> appended li, list length:", this.listEl.children.length);
        this.listEl.style.marginTop = '-23px';
    }
    drawCFInput() {
        const container = this.containerEl.children[1];
        const header = document.createElement("h6");
        header.classList.add("mge-row");
        const label = document.createElement("span");
        label.textContent = "Chaos Factor";
        const group = document.createElement("div");
        group.classList.add("mge-inline-group");
        const cf = document.createElement('select');
        cf.classList.add('cf-dropdown', 'tooltip-enabled');
        cf.setAttribute("data-title", "Chaos Factor!");
        Object.entries(chaos_options).forEach(([text, chaos_factor]) => {
            const opt = document.createElement('option');
            opt.textContent = text;
            opt.value = chaos_factor;
            cf.appendChild(opt);
        });
        const trend = document.createElement('select');
        trend.classList.add('trend-dropdown', 'tooltip-enabled');
        trend.setAttribute("data-title", "Trend!");
        Object.entries(tension_options).forEach(([text, tension]) => {
            const opt = document.createElement('option');
            opt.textContent = text;
            opt.value = tension;
            trend.appendChild(opt);
        });
        // keep refs
        this.cfSelect = cf;
        this.trendSelect = trend;
        group.appendChild(cf);
        group.appendChild(trend);
        header.appendChild(label);
        header.appendChild(group);
        container.appendChild(header);
    }
    drawResultsList() {
        this.listEl.empty();
        if (this.results.length === 0) {
            this.noResults();
            return;
        }
        for (let i = this.results.length - 1; i >= 0; i--) {
            this.addToResults(this.results[i], i);
        }
    }
    eventRoll() {
        function selectEvent(roll) {
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
        const rolledNumber = randomInt(1, 101);
        const selectedEvent = selectEvent(rolledNumber);
        const meaning1 = getRandomElement(descriptorList1);
        const meaning2 = getRandomElement(descriptorList2);
        const event = selectedEvent + "\n" + meaning1 + " " + meaning2;
        return event;
    }
    drawEventRoll() {
        const container = this.containerEl.children[1];
        const event_title = document.createElement('h6');
        event_title.setText('Event Roll');
        const diceIcon = document.createElement('i');
        const rollButton = document.createElement('button');
        diceIcon.className = 'fa-solid fa-question';
        diceIcon.addClass("icon");
        rollButton.appendChild(diceIcon);
        rollButton.addClass("tooltip-enabled");
        rollButton.setAttribute("data-title", "Roll Event!");
        rollButton.addClass("right-button");
        event_title.className = 'button-title';
        rollButton.addEventListener('click', () => {
            this.storeResult(this.eventRoll());
        });
        event_title.appendChild(rollButton);
        container.appendChild(event_title);
    }
    runDetailCheckButton() {
        const option = this.contentEl.querySelector('.detail-check-dropdown');
        const value = option.value;
        if (value === "Detail") {
            this.storeResult(this.detailCheck());
        }
        else if (value === "Meaning") {
            const meaning1 = getRandomElement(descriptorList1);
            const meaning2 = getRandomElement(descriptorList2);
            this.storeResult(meaning1 + "\n" + meaning2);
        }
        else if (value === "Action") {
            const action1 = getRandomElement(actionList1);
            const action2 = getRandomElement(actionList2);
            this.storeResult(action1 + "\n" + action2);
        }
        else if (value === "Meaning & Action") {
            const meaning1 = getRandomElement(descriptorList1);
            const meaning2 = getRandomElement(descriptorList2);
            const action1 = getRandomElement(actionList1);
            const action2 = getRandomElement(actionList2);
            this.storeResult(action1 + "\w" + action2 + "\n" + meaning1 + "\w" + meaning2);
        }
    }
    checkDetail(roll) {
        const emotions = {
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
        const result = emotions[roll] || (roll >= 18 ? "CALM" : "ANGER");
        return result;
    }
    detailCheck() {
        const chaosFactor_num = this.chaosFactor_num;
        let mod;
        if (chaosFactor_num === 3) {
            mod = 2;
        }
        else if (chaosFactor_num === 6) {
            mod = -2;
        }
        else {
            mod = 0;
        }
        const roll = randomInt(1, 11) + randomInt(1, 11) + mod;
        const emotion = this.checkDetail(roll);
        return emotion;
    }
    drawDetailCheck() {
        const container = this.containerEl.children[1];
        const event_title = document.createElement('h6');
        event_title.setText('Detail Check');
        const diceIcon = document.createElement('i');
        const rollButton = document.createElement('button');
        const dropdown = document.createElement('select');
        dropdown.className = 'detail-check-dropdown';
        const options = ["Detail", "Meaning", "Action", "Meaning & Action"];
        options.forEach((optionText) => {
            const option = document.createElement('option');
            option.textContent = optionText;
            option.value = optionText;
            dropdown.appendChild(option);
        });
        event_title.appendChild(dropdown);
        diceIcon.className = 'fa-solid fa-magnifying-glass';
        diceIcon.addClass("icon");
        rollButton.appendChild(diceIcon);
        rollButton.addClass("tooltip-enabled");
        rollButton.setAttribute("data-title", "Roll Detail Check!");
        rollButton.addClass("right-button");
        event_title.className = 'button-title';
        rollButton.addEventListener('click', () => {
            this.runDetailCheckButton();
        });
        event_title.appendChild(rollButton);
        container.appendChild(event_title);
    }
    statisticCheck(mod) {
        const rollResult = randomInt(1, 11) + randomInt(1, 11) + mod;
        const percentageRanges = [
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
        dropdownlabel.textContent = 'Statistic Check';
        const options = { "Important NPC": 2, "Weak Attribute": -2, "Strong Attribute": 2, "Prime Attribute": 4 };
        Object.entries(options).forEach(([optionText, numericValue]) => {
            const option = document.createElement('option');
            option.textContent = optionText;
            option.value = numericValue.toString();
            dropdown.appendChild(option);
        });
        dropdownlabel.appendChild(dropdown);
        const rollButton = document.createElement('button');
        const diceIcon = document.createElement('i');
        diceIcon.className = 'fa-solid fa-chart-simple';
        diceIcon.addClass("icon");
        rollButton.appendChild(diceIcon);
        rollButton.addClass("tooltip-enabled");
        rollButton.setAttribute("data-title", "Roll statistic Check!");
        dropdownlabel.className = 'button-title';
        rollButton.addClass("right-button");
        dropdownlabel.appendChild(rollButton);
        rollButton.addEventListener('click', () => {
            const result = this.statisticCheck(parseInt((dropdown.value)));
            this.storeResult(result);
        });
        this.containerEl.children[1].appendChild(dropdownlabel);
    }
    getStance() {
        const disp = this.containerEl.querySelector('.input-disposition');
        const disposition_value = parseInt(disp.value);
        for (const { range, stance, mod } of dispRanges) {
            const [minRoll, maxRoll] = range;
            if (disposition_value >= minRoll && disposition_value <= maxRoll) {
                return [mod, stance];
            }
        }
        return [-2, "broke"];
    }
    updateDisposition(number) {
        const disp = this.containerEl.querySelector('.input-disposition');
        const dispLabel = this.containerEl.querySelector('.dispositionLabel');
        let disposition_value = parseInt(disp.value);
        disposition_value += number;
        disp.value = disposition_value.toString();
        this.updateDispositionDisplay(dispLabel);
    }
    updateDispositionDisplay(display) {
        const [_, stance] = this.getStance();
        display.textContent = stance;
        if (stance === 'Passive') {
            display.style.backgroundColor = 'cyan';
        }
        else if (stance === 'Moderate') {
            display.style.backgroundColor = 'grey';
        }
        else if (stance === 'Active') {
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
        dispositionButton.style.height = '30px';
        dispositionButton.style.width = '30px';
        dispositionIcon.style.fontSize = '10px';
        dispositionButton.appendChild(dispositionIcon);
        dispositionButton.addClass("tooltip-enabled");
        const dispotionContainer = document.createElement('div');
        dispotionContainer.style.display = 'flex';
        const input = document.createElement('input');
        dispositionButton.setAttribute("data-title", "Roll Disposition!");
        input.addClass('input-disposition');
        input.value = '0';
        input.style.textAlign = 'center';
        input.type = 'number';
        input.style.width = '45px';
        input.min = '1';
        input.max = '99';
        input.maxLength = 2;
        input.addEventListener("input", function () {
            if (this.value.length > 2) {
                this.value = this.value.slice(0, 2);
            }
            else if (this.value.length === 0) {
                this.value = '0';
            }
            app.updateDispositionDisplay(dispositionLabel);
        });
        const diceIcon = document.createElement('i');
        const rollButton = document.createElement('button');
        diceIcon.className = 'fa-solid fa-person-circle-question';
        diceIcon.addClass("icon");
        rollButton.appendChild(diceIcon);
        rollButton.addClass("tooltip-enabled");
        rollButton.setAttribute("data-title", "Roll Behavior Check!");
        rollButton.addClass("right-button");
        const dispositionLabel = document.createElement('span');
        dispositionLabel.addClass('dispositionLabel');
        dispositionLabel.textContent = 'Passive';
        dispositionLabel.style.color = 'black';
        dispositionLabel.style.border = '1px solid black';
        dispositionLabel.style.backgroundColor = 'cyan';
        event_title.className = 'button-title';
        rollButton.addEventListener('click', () => {
            app.behaviorCheck();
        });
        dispositionButton.addEventListener("click", function () {
            app.updateDisplay(randomInt(2, 21), '.input-disposition');
            app.updateDispositionDisplay(dispositionLabel);
        });
        dispotionContainer.appendChild(dispositionButton);
        dispotionContainer.appendChild(input);
        dispotionContainer.appendChild(dispositionLabel);
        event_title.appendChild(dispotionContainer);
        event_title.appendChild(rollButton);
        container.appendChild(event_title);
    }
    behaviorCheck() {
        const roll = randomInt(1, 11);
        for (const option of npcActionTable1) {
            const [min, max] = option.range;
            if (roll >= min && roll <= max) {
                const action = option.action;
                this.storeResult(action);
                if (action.contains("+2")) {
                    this.updateDisposition(2);
                }
                else if (action.contains("-2")) {
                    this.updateDisposition(-2);
                }
                else if (action.contains("-4")) {
                    this.updateDisposition(-4);
                }
                else if (action.contains("+4")) {
                    this.updateDisposition(4);
                }
                if (action.contains("NPC Action")) {
                    let [mod, _] = this.getStance();
                    mod = mod;
                    const roll = randomInt(1, 11) + randomInt(1, 11) + mod;
                    for (const option of npcActionTable2) {
                        const [min, max] = option.range;
                        if (roll >= min && roll <= max) {
                            const action = option.action;
                            this.storeResult(action);
                        }
                    }
                }
            }
        }
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const container = this.containerEl.children[1];
            container.createEl("h4", { text: "Mythic Game Emulator" });
            // draw controls first
            this.drawCFInput();
            this.drawFateCheck();
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
            }
            else {
                // if it already exists, this moves it to the bottom
                container.appendChild(this.resultsContainer);
            }
            this.drawResultsList();
        });
    }
    onClose() {
        return __awaiter(this, void 0, void 0, function* () {
            // Nothing to clean up.
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQWlCLE1BQU0sVUFBVSxDQUFDO0FBRW5ELE9BQU8sS0FBSyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFlLE1BQU0sYUFBYSxDQUFDO0FBQzdFLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFDLFdBQVcsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzdFLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDbkMsT0FBTyxXQUFXLE1BQU0scUJBQXFCLENBQUE7QUFDN0MsT0FBTyxXQUFXLE1BQU0scUJBQXFCLENBQUE7QUFDN0MsT0FBTyxlQUFlLE1BQU0seUJBQXlCLENBQUM7QUFDdEQsT0FBTyxlQUFlLE1BQU0seUJBQXlCLENBQUM7QUFDdEQsTUFBTSxVQUFVLEdBQStEO0lBQzlFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDaEQsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0lBQzlDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtJQUM3QyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcs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Z0JBQWdCLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7S0FBQTtJQUdLLE9BQU87O1lBQ1osdUJBQXVCO1FBQ3hCLENBQUM7S0FBQTtDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgdHlwZSBNR0UgZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0ICogYXMgc3AgZnJvbSBcIi4vc3lzdGVtcy9zZW50ZW5jZVBpY2tlclwiO1xuaW1wb3J0IHsgQ2hhb3NGYWN0b3IsIFRlbnNpb24sIFByb2JhYmlsaXR5LCBPcmFjbGVTdGF0ZSB9IGZyb20gXCIuL2xpYi90eXBlc1wiO1xuaW1wb3J0IHsgUm9sbFJlc3VsdCwgUm9sbFJlc29sdmVyLEV4Y2VwdGlvbmFsIH0gZnJvbSAnLi9zeXN0ZW1zL2NoYW9zRW5naW5lJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHJhbmRvbUludCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgYWN0aW9uTGlzdDEgZnJvbSAnSlNPTlMvYWN0aW9uczEuanNvbidcbmltcG9ydCBhY3Rpb25MaXN0MiBmcm9tICdKU09OUy9hY3Rpb25zMi5qc29uJ1xuaW1wb3J0IGRlc2NyaXB0b3JMaXN0MSBmcm9tICdKU09OUy9kZXNjcmlwdG9yczEuanNvbic7XG5pbXBvcnQgZGVzY3JpcHRvckxpc3QyIGZyb20gJ0pTT05TL2Rlc2NyaXB0b3JzMi5qc29uJztcbmNvbnN0IGRpc3BSYW5nZXM6IHsgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl07IHN0YW5jZTogc3RyaW5nLCBtb2Q6IG51bWJlciB9W10gPSBbXG5cdHsgcmFuZ2U6IFstMTAwLCA1XSwgc3RhbmNlOiBcIlBhc3NpdmVcIiwgbW9kOiAtMiB9LFxuXHR7IHJhbmdlOiBbNiwgMTBdLCBzdGFuY2U6IFwiTW9kZXJhdGVcIiwgbW9kOiAwIH0sXG5cdHsgcmFuZ2U6IFsxMSwgMTVdLCBzdGFuY2U6IFwiQWN0aXZlXCIsIG1vZDogMiB9LFxuXHR7IHJhbmdlOiBbMTYsIDk5XSwgc3RhbmNlOiBcIkFnZ3Jlc3NpdmVcIiwgbW9kOiA0IH0sXG5dO1xuY29uc3QgbnBjQWN0aW9uVGFibGUxOiB7IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdOyBhY3Rpb246IHN0cmluZyB9W10gPSBbXG5cdHsgcmFuZ2U6IFsxLCAzXSwgYWN0aW9uOiBcIlRoZW1lIEFjdGlvblwiIH0sXG5cdHsgcmFuZ2U6IFs0LCA1XSwgYWN0aW9uOiBcIk5QQyBDb250aW51ZXNcIiB9LFxuXHR7IHJhbmdlOiBbNiwgNl0sIGFjdGlvbjogXCJOUEMgQ29udGludWVzICsyXCIgfSxcblx0eyByYW5nZTogWzcsIDddLCBhY3Rpb246IFwiTlBDIENvbnRpbmVzIC0yXCIgfSxcblx0eyByYW5nZTogWzgsIDhdLCBhY3Rpb246IFwiTlBDIEFjdGlvblwiIH0sXG5cdHsgcmFuZ2U6IFs5LCA5XSwgYWN0aW9uOiBcIk5QQyBBY3Rpb24gLTRcIiB9LFxuXHR7IHJhbmdlOiBbMTAsIDEwXSwgYWN0aW9uOiBcIk5QQyBBY3Rpb24gKzRcIiB9LFxuXTtcbmNvbnN0IG5wY0FjdGlvblRhYmxlMjogeyByYW5nZTogW251bWJlciwgbnVtYmVyXTsgYWN0aW9uOiBzdHJpbmcgfVtdID0gW1xuXHR7IHJhbmdlOiBbLTEwLCA2XSwgYWN0aW9uOiBcIlRhbGtzL0V4cG9zaXRpb25cIiB9LFxuXHR7IHJhbmdlOiBbNywgOF0sIGFjdGlvbjogXCJQZXJmb3JtcyBBbiBBbWJpZ3VvdXMgQWN0aW9uXCIgfSxcblx0eyByYW5nZTogWzksIDEwXSwgYWN0aW9uOiBcIkFjdHMgb3V0IG9mIFBDIGludGVyZXN0XCIgfSxcblx0eyByYW5nZTogWzExLCAxMV0sIGFjdGlvbjogXCJHaXZlcyBTb21ldGhpbmdcIiB9LFxuXHR7IHJhbmdlOiBbMTIsIDEyXSwgYWN0aW9uOiBcIlNlZWtzIFRvIEVuZCBFbmNvdXRlclwiIH0sXG5cdHsgcmFuZ2U6IFsxMywgMTNdLCBhY3Rpb246IFwiQ2hhbmdlcyBUaGUgVGhlbWVcIiB9LFxuXHR7IHJhbmdlOiBbMTQsIDE0XSwgYWN0aW9uOiBcIkNoYW5nZXMgRGVzY3JpcHRvclwiIH0sXG5cdHsgcmFuZ2U6IFsxNSwgMTddLCBhY3Rpb246IFwiQWN0cyBPdXQgT2YgU2VsZiBJbnRlcmVzdFwiIH0sXG5cdHsgcmFuZ2U6IFsxOCwgMThdLCBhY3Rpb246IFwiVGFrZXMgU29tZXRoaW5nXCIgfSxcblx0eyByYW5nZTogWzE5LCA5OV0sIGFjdGlvbjogXCJDYXVzZXMgSGFybVwiIH0sXG5dO1xuXG5jb25zdCBwcm9iX29wdGlvbnM6IFJlY29yZDxzdHJpbmcsIFByb2JhYmlsaXR5PiA9IHtcblx0J0luZXZpdGFibGUnOiBQcm9iYWJpbGl0eS5JbmV2aXRhYmxlLFxuXHQnQ2VydGFpbic6IFByb2JhYmlsaXR5LkNlcnRhaW4sXG5cdCdIYXMgdG8gQmUnOiBQcm9iYWJpbGl0eS5IYXNUb0JlLFxuXHQnU3VyZSBUaGluZyc6IFByb2JhYmlsaXR5LlN1cmVUaGluZyxcblx0J1Byb2JhYmxlJzogUHJvYmFiaWxpdHkuUHJvYmFibGUsXG5cdCdMaWtlbHknOiBQcm9iYWJpbGl0eS5MaWtlbHksXG5cdCc1MC81MCc6IFByb2JhYmlsaXR5Ll81MDUwLFxuXHQnVW5saWtlbHknOiBQcm9iYWJpbGl0eS5Vbmxpa2VseSxcblx0J0R1YmlvdXMnOiBQcm9iYWJpbGl0eS5EdWJpb3VzLFxuXHQnTm8gV2F5JzogUHJvYmFiaWxpdHkuTm9XYXksXG5cdCdSaWRpY3Vsb3VzJzogUHJvYmFiaWxpdHkuUmlkaWN1bG91cyxcblx0J0ltcG9zc2libGUnOiBQcm9iYWJpbGl0eS5JbXBvc3NpYmxlLFxuXHQnVW5mYXRob21hYmxlJzogUHJvYmFiaWxpdHkuVW5mYXRob21hYmxlXG59O1xuY29uc3QgY2hhb3Nfb3B0aW9uczogUmVjb3JkPHN0cmluZywgQ2hhb3NGYWN0b3I+ID0ge1xuXHQnUGVhY2VmdWwnOiBDaGFvc0ZhY3Rvci5QZWFjZWZ1bCxcblx0J1NlcmVuZSc6IENoYW9zRmFjdG9yLlNlcmVuZSxcblx0J0NhbG0nOiBDaGFvc0ZhY3Rvci5DYWxtLFxuXHQnU3RhYmxlJzogQ2hhb3NGYWN0b3IuU2VyZW5lLFxuXHQnQ2hhb3RpYyc6IENoYW9zRmFjdG9yLkNoYW90aWMsXG5cdCdIYXZvYyc6IENoYW9zRmFjdG9yLkhhdm9jLFxuXHQnUGFuZGVtb25pdW0nOiBDaGFvc0ZhY3Rvci5QYW5kZW1vbml1bVxufTtcbmNvbnN0IHRlbnNpb25fb3B0aW9uczogUmVjb3JkPHN0cmluZywgVGVuc2lvbj4gPSB7XG5cdCdMb2NrZWQgSW4nOiBUZW5zaW9uLkxvY2tlZEluLFxuXHQnVW5kZXIgQ29udHJvbCc6IFRlbnNpb24uVW5kZXJDb250cm9sLFxuXHQnQ29hc3RpbmcnOiBUZW5zaW9uLkNvYXN0aW5nLFxuXHQnTmV1dHJhbCc6IFRlbnNpb24uTmV1dHJhbCxcblx0J1RlbnNlJzogVGVuc2lvbi5UZW5zZSxcblx0J0dldHRpbmcgQ3JhenknOiBUZW5zaW9uLkdldHRpbmdDcmF6eSxcblx0J0Z1bGwgVGlsdCc6IFRlbnNpb24uRnVsbFRpbHRcbn07XG5cbmV4cG9ydCBjb25zdCBNWVRISUNfVklFVyA9IFwibXl0aGljIHZpZXdcIjtcblxuXG5mdW5jdGlvbiBjYWxjdWxhdGVCdXR0b25QYWRkaW5nKGJ1dHRvbjogSFRNTEJ1dHRvbkVsZW1lbnQpIHtcblx0Y29uc3QgdGV4dENvbnRlbnQgPSBidXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJyk7XG5cdGlmICh0ZXh0Q29udGVudCkge1xuXHRcdGNvbnN0IHRleHRMZW5ndGggPSB0ZXh0Q29udGVudC5sZW5ndGg7XG5cdFx0Y29uc3QgcGFkZGluZ1NpZGVzID0gYCR7dGV4dExlbmd0aH1weGA7IC8vIEFkanVzdCB0aGUgbXVsdGlwbGllciBhcyBuZWVkZWRcblx0XHRidXR0b24uc3R5bGUuc2V0UHJvcGVydHkoJy0tdG9vbHRpcC1wYWRkaW5nLWxlZnQnLCBwYWRkaW5nU2lkZXMpO1xuXHRcdGJ1dHRvbi5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10b29sdGlwLXBhZGRpbmctcmlnaHQnLCBwYWRkaW5nU2lkZXMpO1xuXHRcdHJldHVybiBwYWRkaW5nU2lkZXNcblx0fVxufVxuZnVuY3Rpb24gZ2V0UmFuZG9tRWxlbWVudDxUPihsaXN0OiBUW10pOiBUIHtcblx0Y29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBsaXN0Lmxlbmd0aCk7XG5cdHJldHVybiBsaXN0W3JhbmRvbUluZGV4XTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXhjZXB0aW9uYWxSZXN1bHQoZXhjZXB0aW9uYWw6IEV4Y2VwdGlvbmFsIHwgbnVsbCwgeWVzOiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKCFleGNlcHRpb25hbCkgcmV0dXJuIHllcyA/IFwiWWVzXCIgOiBcIk5vXCI7XG5cbiAgY29uc3QgYmFzZSA9IHllcyA/IFwiWWVzXCIgOiBcIk5vXCI7XG4gIHJldHVybiBgJHtiYXNlfSDigJQgRXhjZXB0aW9uYWwgKCR7RXhjZXB0aW9uYWxbZXhjZXB0aW9uYWxdfSlgO1xufVxuZXhwb3J0IGNsYXNzIE15dGhpY1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG5cdHBsdWdpbjogTUdFO1xuXHRyZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXHRyZXN1bHRzQ29udGFpbmVyOiBIVE1MRWxlbWVudDtcblx0Y2hhb3NGYWN0b3JfbnVtOiBudW1iZXIgPSAzO1xuXHRwcml2YXRlIGxpc3RFbDogSFRNTFVMaXN0RWxlbWVudDtcblx0cHJpdmF0ZSBjZlNlbGVjdCE6IEhUTUxTZWxlY3RFbGVtZW50O1xuXHRwcml2YXRlIHRyZW5kU2VsZWN0ITogSFRNTFNlbGVjdEVsZW1lbnQ7XG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogTUdFKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblx0Z2V0Q2hhb3NWYWx1ZSgpOiBudW1iZXIge1xuXHRcdHJldHVybiBOdW1iZXIodGhpcy5jZlNlbGVjdD8udmFsdWUgPz8gMCk7XG5cdH1cblxuXHRnZXRUcmVuZFZhbHVlKCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIE51bWJlcih0aGlzLnRyZW5kU2VsZWN0Py52YWx1ZSA/PyAwKTtcblx0fVxuXG5cdGdldFZpZXdUeXBlKCkge1xuXHRcdHJldHVybiBNWVRISUNfVklFVztcblx0fVxuXG5cdGdldERpc3BsYXlUZXh0KCkge1xuXHRcdHJldHVybiBcIk1HRVwiO1xuXHR9XG5cdGdldEljb24oKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gXCJNXCJcblxuXHR9XG5cdHN0b3JlUmVzdWx0KHJlc3VsdDogc3RyaW5nKTogdm9pZCB7XG5cdFx0bmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0KTtcblx0XHRjb25zb2xlLmxvZyhcInN0b3JlUmVzdWx0IC0+IGFkZGluZzpcIiwgcmVzdWx0KTtcblx0XHRjb25zb2xlLmxvZyhgQ29waWVkOiAke3Jlc3VsdH1gKTtcblx0XHR0aGlzLnJlc3VsdHMucHVzaChyZXN1bHQpO1xuXHRcdHRoaXMuZHJhd0xpc3QoKTsgLy8gUmVmcmVzaCB0aGUgbGlzdCB0byByZWZsZWN0IHRoZSB1cGRhdGVkIHJlc3VsdHNcblx0fVxuXHRhZGRGb290ZXIoZWw6IEVsZW1lbnQpIHtcblx0XHRjb25zdCBjdXJyZW50VGltZSA9IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKTsgLy8gR2V0IHRoZSBjdXJyZW50IHRpbWUgaW4gYSBzdWl0YWJsZSBmb3JtYXRcblx0XHRjb25zdCBmb290ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRmb290ZXIudGV4dENvbnRlbnQgPSBgJHtjdXJyZW50VGltZX1gO1xuXHRcdGZvb3Rlci5zdHlsZS5mb250U2l6ZSA9ICc4cHgnOyAvLyBBZGp1c3QgdGhlIGZvbnQgc2l6ZSBhcyBkZXNpcmVkXG5cdFx0ZWwuYXBwZW5kQ2hpbGQoZm9vdGVyKTtcblxuXHR9XG5cdGRlbGV0ZUxpc3QoKSB7XG5cdFx0dGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXS5xdWVyeVNlbGVjdG9yQWxsKCcucmVzdWx0cy1jb250YWluZXInKS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZSgpO1xuXHRcdH0pXG5cdH1cblx0cHJpdmF0ZSBjbGVhckxpc3QoKTogdm9pZCB7XG5cdFx0dGhpcy5yZXN1bHRzID0gW107XG5cdFx0dGhpcy5saXN0RWwuZW1wdHkoKTtcblx0XHR0aGlzLm5vUmVzdWx0cygpO1xuXHR9XG5cdG5vUmVzdWx0cygpIHtcblx0XHR0aGlzLmxpc3RFbC5lbXB0eSgpXG5cdFx0Y29uc3QgZW1wdHlTdGF0ZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdGVtcHR5U3RhdGVFbC50ZXh0Q29udGVudCA9ICdObyByZXN1bHRzIGF2YWlsYWJsZS4nO1xuXHRcdHRoaXMubGlzdEVsLmFwcGVuZENoaWxkKGVtcHR5U3RhdGVFbCk7XG5cdH1cblx0YXN5bmMgZHJhd1NlbnRlbmNlUGlja2VyKCkge1xuXHRcdGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XG5cblx0XHRjb25zdCBoZWFkZXIgPSBjb250YWluZXIuY3JlYXRlRWwoXCJoNlwiLCB7IHRleHQ6IFwiU2VudGVuY2UgUGlja2VyXCIgfSk7XG5cblx0XHRjb25zdCBkcm9wZG93biA9IGhlYWRlci5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJlcHViLWRyb3Bkb3duXCIgfSk7XG5cdFx0Y29uc3QgcGlja0J0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiUGljayBTZW50ZW5jZVwiIH0pO1xuXHRcdGNvbnN0IHJhbmRvbUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiUmFuZG9tIEJvb2tcIiB9KTtcblxuXHRcdGNvbnN0IGVwdWJEaXIgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lcHViRGlyIC8vIGZyb20geW91ciBzZXR0aW5ncyB0YWJcblx0XHRjb25zdCBlcHViRmlsZXMgPSBzcC5nZXRBbGxFcHVic0luRGlyKHRoaXMucGx1Z2luLnNldHRpbmdzLmVwdWJEaXIpO1xuXG5cdFx0ZXB1YkZpbGVzLmZvckVhY2goZnVsbFBhdGggPT4ge1xuXHRcdFx0Y29uc3QgcGFyc2VkID0gcGF0aC5wYXJzZShmdWxsUGF0aCk7XG5cdFx0XHRjb25zdCBib29rTmFtZSA9IHBhcnNlZC5uYW1lO1xuXG5cdFx0XHRkcm9wZG93bi5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG5cdFx0XHRcdHRleHQ6IGJvb2tOYW1lLFxuXHRcdFx0XHR2YWx1ZTogZnVsbFBhdGgsXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRwaWNrQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBzZWxlY3RlZFBhdGggPSBkcm9wZG93bi52YWx1ZTtcblx0XHRcdGNvbnNvbGUubG9nKHNlbGVjdGVkUGF0aCk7XG5cdFx0XHRjb25zdCBzZW50ZW5jZSA9IGF3YWl0IHNwLmdldFJhbmRvbVNlbnRlbmNlRnJvbUVwdWIoc2VsZWN0ZWRQYXRoKTtcblx0XHRcdGNvbnNvbGUubG9nKHNlbnRlbmNlKTtcblx0XHRcdHRoaXMuc3RvcmVSZXN1bHQoc2VudGVuY2UpO1xuXHRcdH0pO1xuXG5cdFx0cmFuZG9tQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRpZiAoZXB1YkZpbGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHR0aGlzLnN0b3JlUmVzdWx0KFwi4pqg77iPIE5vIGVwdWJzIGZvdW5kLlwiKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgcmFuZG9tRmlsZSA9IGVwdWJGaWxlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlcHViRmlsZXMubGVuZ3RoKV07XG5cdFx0XHRjb25zdCBzZW50ZW5jZSA9IGF3YWl0IHNwLmdldFJhbmRvbVNlbnRlbmNlRnJvbUVwdWIocmFuZG9tRmlsZSk7XG5cdFx0XHR0aGlzLnN0b3JlUmVzdWx0KHNlbnRlbmNlKTtcblx0XHR9KTtcblx0fVxuXG5cdGRyYXdMaXN0KCkge1xuXHRcdHRoaXMubGlzdEVsLmVtcHR5KCk7XG5cdFx0aWYgKCF0aGlzLmxpc3RFbCkge1xuXHRcdFx0dGhpcy5yZXN1bHRzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMubGlzdEVsKTtcblx0XHRcdC8vdGhpcy5yZXN1bHRzQ29udGFpbmVyLmNoaWxkcmVuWzFdLmFwcGVuZENoaWxkKGxpc3RDb250YWluZXJFbCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLnJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLm5vUmVzdWx0cygpXG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJkcmF3TGlzdCAtPiBhZGRpbmcgaW5kZXg6XCIsIGksIFwidmFsdWU6XCIsIHRoaXMucmVzdWx0c1tpXSk7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMucmVzdWx0c1tpXTtcblx0XHRcdFx0dGhpcy5hZGRUb1Jlc3VsdHMocmVzdWx0LCBpKVxuXHRcdFx0fTtcblxuXHRcdH1cblx0fVxuXHR1cGRhdGVEaXNwbGF5KHRvSW5wdXROdW06IG51bWJlciwgZGlzcGxheUlkOiBzdHJpbmcpIHtcblx0XHRjb25zdCBpbnB1dENvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwucXVlcnlTZWxlY3RvcihkaXNwbGF5SWQpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cdFx0aW5wdXRDb250YWluZXIudmFsdWUgPSB0b0lucHV0TnVtLnRvU3RyaW5nKClcblx0fVxuXHRkcmF3RmF0ZUNoZWNrKCkge1xuXHRcdGNvbnN0IGZhdGVDaGVja0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdGNvbnN0IGZhdGVjaGVja0hlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoNlwiKTtcblx0XHRmYXRlQ2hlY2tDb250YWluZXIuYXBwZW5kQ2hpbGQoZmF0ZWNoZWNrSGVhZGVyKTtcblx0XHRmYXRlY2hlY2tIZWFkZXIuc2V0VGV4dChcIkZhdGUgQ2hlY2tcIik7XG5cdFx0Y29uc3QgZHJvcGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcblx0XHRkcm9wZG93bi5jbGFzc05hbWUgPSAndG9vbHRpcC1lbmFibGVkJztcblx0XHRjb25zdCBkcm9wZG93bkNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdGRyb3Bkb3duQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblxuXHRcdE9iamVjdC5lbnRyaWVzKHByb2Jfb3B0aW9ucykuZm9yRWFjaCgoW2xhYmVsLCBwcm9iXSkgPT4ge1xuXHRcdFx0Y29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG5cdFx0XHRvcHRpb24udGV4dENvbnRlbnQgPSBsYWJlbDtcblx0XHRcdG9wdGlvbi52YWx1ZSA9IHByb2I7XG5cdFx0XHRkcm9wZG93bi5hcHBlbmRDaGlsZChvcHRpb24pO1xuXHRcdH0pO1xuXHRcdGNvbnN0IHJvbGxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHRjb25zdCBkaWNlSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcblx0XHRjb25zdCBjaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cdFx0Y2hlY2tib3gudHlwZSA9ICdjaGVja2JveCc7IGNoZWNrYm94LmlkID0gJ215LWNoZWNrYm94JzsgXG5cdFx0Y2hlY2tib3guc3R5bGUubWFyZ2luTGVmdCA9ICc1cHgnO1xuXHRcdGNoZWNrYm94LnNldEF0dHJpYnV0ZShcImRhdGEtdGl0bGVcIiwgXCJBZHZhbmNlZCBGYXRlY2hlY2soYW5kLGJ1dCxudW1lcm9sb2d5KVwiKTtcblx0XHRjaGVja2JveC5hZGRDbGFzcygndG9vbHRpcC1lbmFibGVkJylcblx0XHRkaWNlSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtZGljZS1kMjAnO1xuXHRcdGRpY2VJY29uLmFkZENsYXNzKFwiaWNvblwiKTtcblx0XHRyb2xsQnV0dG9uLmFwcGVuZENoaWxkKGRpY2VJY29uKTtcblx0XHRyb2xsQnV0dG9uLmFkZENsYXNzKFwidG9vbHRpcC1lbmFibGVkXCIpXG5cdFx0cm9sbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRpdGxlXCIsIFwiUm9sbCBGYXRlIENoZWNrIVwiKVxuXHRcdGZhdGVjaGVja0hlYWRlci5jbGFzc05hbWUgPSAnYnV0dG9uLXRpdGxlJztcblx0XHRyb2xsQnV0dG9uLmFkZENsYXNzKFwicmlnaHQtYnV0dG9uXCIpXG5cdFx0ZHJvcGRvd24uc3R5bGUubWFyZ2luUmlnaHQgPSAnMTBweCdcbiAgICAgICAgZmF0ZWNoZWNrSGVhZGVyLmFwcGVuZENoaWxkKGNoZWNrYm94KVxuXHRcdGZhdGVjaGVja0hlYWRlci5hcHBlbmRDaGlsZChkcm9wZG93bilcblx0XHRmYXRlY2hlY2tIZWFkZXIuYXBwZW5kQ2hpbGQocm9sbEJ1dHRvbik7XG5cblx0XHR0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdLmFwcGVuZENoaWxkKGZhdGVDaGVja0NvbnRhaW5lcilcblx0XHRyb2xsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0Y29uc3Qgc3RhdGU6IE9yYWNsZVN0YXRlID0ge1xuXHRcdFx0XHRwcm9iYWJpbGl0eTogZHJvcGRvd24udmFsdWUgYXMgUHJvYmFiaWxpdHksXG5cdFx0XHRcdGNmOiB0aGlzLmNmU2VsZWN0LnZhbHVlIGFzIENoYW9zRmFjdG9yLFxuXHRcdFx0XHR0ZW5zaW9uOiB0aGlzLnRyZW5kU2VsZWN0LnZhbHVlIGFzIFRlbnNpb24sXG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhzdGF0ZSk7XG5cdFx0XHRsZXQgcm9sbF9yZXN1bHRfc3RyID0gXCJcIjtcblx0XHRcdGxldCByb2xsID0gUm9sbFJlc3VsdC5yb2xsRDEwMDAoc3RhdGUpO1xuXHRcdFx0bGV0IHJlc29sdmVkX3JvbGwgPSBSb2xsUmVzb2x2ZXIucmVzb2x2ZVJvbGwoc3RhdGUsIHJvbGwpO1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gZm9ybWF0RXhjZXB0aW9uYWxSZXN1bHQocmVzb2x2ZWRfcm9sbC5leGNlcHRpb25hbCxyZXNvbHZlZF9yb2xsLnllcyk7XG5cdFx0XHRyb2xsX3Jlc3VsdF9zdHIgKz0gcmVzdWx0O1xuXHRcdFx0aWYgKHJlc29sdmVkX3JvbGwuYW5kKSB7XG5cdFx0XHRcdHJvbGxfcmVzdWx0X3N0ciArPSBcIiBBTkQgXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAocmVzb2x2ZWRfcm9sbC5idXQpIHtcblx0XHRcdFx0cm9sbF9yZXN1bHRfc3RyICs9IFwiIEJVVCBcIjtcblx0XHRcdH1cblx0XHRcdGlmIChyZXNvbHZlZF9yb2xsLmV2ZW50VHJpZ2dlcmVkKXtcblx0XHRcdCAgICByb2xsX3Jlc3VsdF9zdHIgKz0gXCIgIFwiO1xuXHRcdFx0XHRyb2xsX3Jlc3VsdF9zdHIgKz0gdGhpcy5ldmVudFJvbGwoKTtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKHJvbGxfcmVzdWx0X3N0cik7XG5cdFx0XHR0aGlzLnN0b3JlUmVzdWx0KHJvbGxfcmVzdWx0X3N0cik7XG5cdFx0XHR0aGlzLmRyYXdMaXN0KClcblx0XHR9KTtcblxuXHR9XG5cdGFkZFRvUmVzdWx0cyhyZXN1bHQ6IHN0cmluZywgaTogbnVtYmVyKSB7XG5cdFx0Y29uc3QgaXRlbUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRjb25zdCB0ZXh0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0dGV4dEVsLnN0eWxlLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG5cblx0XHRpZiAocmVzdWx0LmluY2x1ZGVzKFwiICBcIikpIHtcblx0XHRcdGNvbnN0IHNwbGl0X3RleHQgPSByZXN1bHQuc3BsaXQoXCIgIFwiKTtcblx0XHRcdHRleHRFbC50ZXh0Q29udGVudCA9IHNwbGl0X3RleHRbMl0gPz8gXCJcIjtcblx0XHRcdGNvbnN0IGV2ZW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdGV2ZW50RWwudGV4dENvbnRlbnQgPSBzcGxpdF90ZXh0WzBdICsgXCJcXG5cIiArIHNwbGl0X3RleHRbMV07XG5cdFx0XHRldmVudEVsLnN0eWxlLndoaXRlU3BhY2UgPSAncHJlLWxpbmUnO1xuXHRcdFx0ZXZlbnRFbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdGV2ZW50RWwuc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJztcblx0XHRcdGl0ZW1FbC5hcHBlbmRDaGlsZCh0ZXh0RWwpO1xuXHRcdFx0aXRlbUVsLmFwcGVuZENoaWxkKGV2ZW50RWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0ZXh0RWwudGV4dENvbnRlbnQgPSByZXN1bHQ7XG5cdFx0XHRpdGVtRWwuYXBwZW5kQ2hpbGQodGV4dEVsKTtcblx0XHR9XG5cblx0XHRpdGVtRWwuY2xhc3NOYW1lID0gJ215LWxpc3QtaXRlbSc7XG5cblx0XHQvLyBDb3B5IGJ1dHRvblxuXHRcdGNvbnN0IGNvcHlCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHRjb25zdCBjb3B5QnRuSW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuXHRcdGNvcHlCdG5JbWcuY2xhc3NOYW1lID0gJ2ZhLXJlZ3VsYXIgZmEtY2xpcGJvYXJkJztcblx0XHRjb3B5QnRuLmFwcGVuZENoaWxkKGNvcHlCdG5JbWcpO1xuXHRcdGNvcHlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChyZXN1bHQpO1xuXHRcdFx0Y29uc29sZS5sb2coYENvcGllZDogJHtyZXN1bHR9YCk7XG5cdFx0fSk7XG5cdFx0aXRlbUVsLmFwcGVuZENoaWxkKGNvcHlCdG4pO1xuXG5cdFx0aXRlbUVsLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRpdGVtRWwuc3R5bGUucGFkZGluZ1JpZ2h0ID0gJzBweCc7XG5cdFx0aXRlbUVsLnN0eWxlLm1hcmdpblRvcCA9ICcyMHB4JztcblxuXHRcdGNvcHlCdG4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdGNvcHlCdG4uY2xhc3NOYW1lID0gJ2JvcmRlcmxlc3MtYnV0dG9uJztcblx0XHRjb3B5QnRuLnN0eWxlLnJpZ2h0ID0gJzAnO1xuXHRcdGNvcHlCdG4uc3R5bGUuYm90dG9tID0gJzAnO1xuXHRcdGNvcHlCdG4uc2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJywgJ0NvcHkgUmVzdWx0Jyk7XG5cdFx0Y29weUJ0bi5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcC1lbmFibGVkXCIpO1xuXHRcdGNhbGN1bGF0ZUJ1dHRvblBhZGRpbmcoY29weUJ0bik7XG5cblx0XHR0aGlzLmFkZEZvb3RlcihpdGVtRWwpO1xuXG5cdFx0Ly8gRGVsZXRlIGJ1dHRvblxuXHRcdGNvbnN0IGRlbGV0ZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuXHRcdGRlbGV0ZUJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGl0bGUnLCAnRGVsZXRlIFJlc3VsdCcpO1xuXHRcdGNvbnN0IGRlbGV0ZUljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG5cdFx0ZGVsZXRlSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtdHJhc2gnO1xuXHRcdGRlbGV0ZUJ1dHRvbi5jbGFzc05hbWUgPSAnYm9yZGVybGVzcy1idXR0b24nO1xuXHRcdGRlbGV0ZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcC1lbmFibGVkXCIpO1xuXHRcdGNhbGN1bGF0ZUJ1dHRvblBhZGRpbmcoZGVsZXRlQnV0dG9uKTtcblx0XHRkZWxldGVCdXR0b24uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdGRlbGV0ZUJ1dHRvbi5zdHlsZS50b3AgPSAnMCc7XG5cdFx0ZGVsZXRlQnV0dG9uLnN0eWxlLnJpZ2h0ID0gJzAnO1xuXHRcdGRlbGV0ZUJ1dHRvbi5hcHBlbmRDaGlsZChkZWxldGVJY29uKTtcblx0XHRkZWxldGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRpZiAoaSA+PSAwICYmIGkgPCB0aGlzLnJlc3VsdHMubGVuZ3RoKSB7XG5cdFx0XHRcdHRoaXMucmVzdWx0cy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdHRoaXMuZHJhd0xpc3QoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpdGVtRWwuYXBwZW5kQ2hpbGQoZGVsZXRlQnV0dG9uKTtcblxuXHRcdHRoaXMubGlzdEVsLmFwcGVuZENoaWxkKGl0ZW1FbCk7XG5cdFx0Y29uc29sZS5sb2coXCJhZGRUb1Jlc3VsdHMgLT4gYXBwZW5kZWQgbGksIGxpc3QgbGVuZ3RoOlwiLCB0aGlzLmxpc3RFbC5jaGlsZHJlbi5sZW5ndGgpO1xuXHRcdHRoaXMubGlzdEVsLnN0eWxlLm1hcmdpblRvcCA9ICctMjNweCc7XG5cdH1cblxuXHRkcmF3Q0ZJbnB1dCgpIHtcblx0XHRjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdO1xuXG5cdFx0Y29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg2XCIpO1xuXHRcdGhlYWRlci5jbGFzc0xpc3QuYWRkKFwibWdlLXJvd1wiKTtcblxuXHRcdGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG5cdFx0bGFiZWwudGV4dENvbnRlbnQgPSBcIkNoYW9zIEZhY3RvclwiO1xuXG5cdFx0Y29uc3QgZ3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdGdyb3VwLmNsYXNzTGlzdC5hZGQoXCJtZ2UtaW5saW5lLWdyb3VwXCIpO1xuXG5cblxuXHRcdGNvbnN0IGNmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG5cdFx0Y2YuY2xhc3NMaXN0LmFkZCgnY2YtZHJvcGRvd24nLCAndG9vbHRpcC1lbmFibGVkJyk7XG5cdFx0Y2Yuc2V0QXR0cmlidXRlKFwiZGF0YS10aXRsZVwiLCBcIkNoYW9zIEZhY3RvciFcIik7XG5cdFx0T2JqZWN0LmVudHJpZXMoY2hhb3Nfb3B0aW9ucykuZm9yRWFjaCgoW3RleHQsIGNoYW9zX2ZhY3Rvcl0pID0+IHtcblx0XHRcdGNvbnN0IG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuXHRcdFx0b3B0LnRleHRDb250ZW50ID0gdGV4dDtcblx0XHRcdG9wdC52YWx1ZSA9IGNoYW9zX2ZhY3Rvcjtcblx0XHRcdGNmLmFwcGVuZENoaWxkKG9wdCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCB0cmVuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXHRcdHRyZW5kLmNsYXNzTGlzdC5hZGQoJ3RyZW5kLWRyb3Bkb3duJywgJ3Rvb2x0aXAtZW5hYmxlZCcpO1xuXHRcdHRyZW5kLnNldEF0dHJpYnV0ZShcImRhdGEtdGl0bGVcIiwgXCJUcmVuZCFcIik7XG5cdFx0T2JqZWN0LmVudHJpZXModGVuc2lvbl9vcHRpb25zKS5mb3JFYWNoKChbdGV4dCwgdGVuc2lvbl0pID0+IHtcblx0XHRcdGNvbnN0IG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuXHRcdFx0b3B0LnRleHRDb250ZW50ID0gdGV4dDtcblx0XHRcdG9wdC52YWx1ZSA9IHRlbnNpb247XG5cdFx0XHR0cmVuZC5hcHBlbmRDaGlsZChvcHQpO1xuXHRcdH0pO1xuXG5cdFx0Ly8ga2VlcCByZWZzXG5cdFx0dGhpcy5jZlNlbGVjdCA9IGNmO1xuXHRcdHRoaXMudHJlbmRTZWxlY3QgPSB0cmVuZDtcblxuXHRcdGdyb3VwLmFwcGVuZENoaWxkKGNmKTtcblx0XHRncm91cC5hcHBlbmRDaGlsZCh0cmVuZCk7XG5cdFx0aGVhZGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcblx0XHRoZWFkZXIuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXHR9XG5cblxuXHRkcmF3UmVzdWx0c0xpc3QoKSB7XG5cdFx0dGhpcy5saXN0RWwuZW1wdHkoKTtcblxuXHRcdGlmICh0aGlzLnJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLm5vUmVzdWx0cygpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGZvciAobGV0IGkgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdHRoaXMuYWRkVG9SZXN1bHRzKHRoaXMucmVzdWx0c1tpXSwgaSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblx0ZXZlbnRSb2xsKCkge1xuXHRcdGZ1bmN0aW9uIHNlbGVjdEV2ZW50KHJvbGw6IG51bWJlcik6IHN0cmluZyB7XG5cdFx0XHRjb25zdCBldmVudE9wdGlvbnMgPSBbXG5cdFx0XHRcdHsgcmFuZ2U6IFsxLCA3XSwgZXZlbnQ6IFwiUkVNT1RFIEVWRU5UXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzgsIDI4XSwgZXZlbnQ6IFwiTlBDIEFDVElPTlwiIH0sXG5cdFx0XHRcdHsgcmFuZ2U6IFsyOSwgMzVdLCBldmVudDogXCJJTlRST0RVQ0UgQSBORVcgTlBDXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzM2LCA0NV0sIGV2ZW50OiBcIk1PVkUgVE9XQVJEIEEgVEhSRUFEXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzQ2LCA1Ml0sIGV2ZW50OiBcIk1PVkUgQVdBWSBGUk9NIEEgVEhSRUFEXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzUzLCA1NV0sIGV2ZW50OiBcIkNMT1NFIEEgVEhSRUFEXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzU2LCA2N10sIGV2ZW50OiBcIlBDIE5FR0FUSVZFXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzY4LCA3NV0sIGV2ZW50OiBcIlBDIFBPU0lUSVZFXCIgfSxcblx0XHRcdFx0eyByYW5nZTogWzc2LCA4M10sIGV2ZW50OiBcIkFNQklHVU9VUyBFVkVOVFwiIH0sXG5cdFx0XHRcdHsgcmFuZ2U6IFs4NCwgOTJdLCBldmVudDogXCJOUEMgTkVHQVRJVkVcIiB9LFxuXHRcdFx0XHR7IHJhbmdlOiBbOTMsIDEwMF0sIGV2ZW50OiBcIk5QQyBQT1NJVElWRVwiIH0sXG5cdFx0XHRdO1xuXHRcdFx0Zm9yIChjb25zdCBvcHRpb24gb2YgZXZlbnRPcHRpb25zKSB7XG5cdFx0XHRcdGNvbnN0IFttaW4sIG1heF0gPSBvcHRpb24ucmFuZ2U7XG5cdFx0XHRcdGlmIChyb2xsID49IG1pbiAmJiByb2xsIDw9IG1heCkge1xuXHRcdFx0XHRcdHJldHVybiBvcHRpb24uZXZlbnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFwiSW52YWxpZCByb2xsLiBUaGUgcm9sbCBzaG91bGQgYmUgYmV0d2VlbiAxIGFuZCAxMDAuXCI7XG5cdFx0fVxuXHRcdGNvbnN0IHJvbGxlZE51bWJlciA9IHJhbmRvbUludCgxLCAxMDEpXG5cdFx0Y29uc3Qgc2VsZWN0ZWRFdmVudCA9IHNlbGVjdEV2ZW50KHJvbGxlZE51bWJlcik7XG5cdFx0Y29uc3QgbWVhbmluZzEgPSBnZXRSYW5kb21FbGVtZW50KGRlc2NyaXB0b3JMaXN0MSk7XG5cdFx0Y29uc3QgbWVhbmluZzIgPSBnZXRSYW5kb21FbGVtZW50KGRlc2NyaXB0b3JMaXN0Mik7XG5cdFx0Y29uc3QgZXZlbnQgPSBzZWxlY3RlZEV2ZW50ICsgXCJcXG5cIiArIG1lYW5pbmcxICsgXCIgXCIgKyBtZWFuaW5nMjtcblx0XHRyZXR1cm4gZXZlbnQ7XG5cdH1cblx0ZHJhd0V2ZW50Um9sbCgpIHtcblx0XHRjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdOyBjb25zdCBldmVudF90aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2g2Jyk7XG5cdFx0ZXZlbnRfdGl0bGUuc2V0VGV4dCgnRXZlbnQgUm9sbCcpO1xuXHRcdGNvbnN0IGRpY2VJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuXHRcdGNvbnN0IHJvbGxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHRkaWNlSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtcXVlc3Rpb24nO1xuXHRcdGRpY2VJY29uLmFkZENsYXNzKFwiaWNvblwiKTtcblx0XHRyb2xsQnV0dG9uLmFwcGVuZENoaWxkKGRpY2VJY29uKTtcblx0XHRyb2xsQnV0dG9uLmFkZENsYXNzKFwidG9vbHRpcC1lbmFibGVkXCIpXG5cdFx0cm9sbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRpdGxlXCIsIFwiUm9sbCBFdmVudCFcIilcblx0XHRyb2xsQnV0dG9uLmFkZENsYXNzKFwicmlnaHQtYnV0dG9uXCIpXG5cdFx0ZXZlbnRfdGl0bGUuY2xhc3NOYW1lID0gJ2J1dHRvbi10aXRsZSdcblx0XHRyb2xsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5zdG9yZVJlc3VsdCh0aGlzLmV2ZW50Um9sbCgpKTtcblx0XHR9KVxuXHRcdGV2ZW50X3RpdGxlLmFwcGVuZENoaWxkKHJvbGxCdXR0b24pO1xuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChldmVudF90aXRsZSlcblxuXHR9XG5cdHJ1bkRldGFpbENoZWNrQnV0dG9uKCkge1xuXHRcdGNvbnN0IG9wdGlvbiA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5kZXRhaWwtY2hlY2stZHJvcGRvd24nKSBhcyBIVE1MU2VsZWN0RWxlbWVudDtcblx0XHRjb25zdCB2YWx1ZSA9IG9wdGlvbi52YWx1ZTtcblx0XHRpZiAodmFsdWUgPT09IFwiRGV0YWlsXCIpIHtcblx0XHRcdHRoaXMuc3RvcmVSZXN1bHQodGhpcy5kZXRhaWxDaGVjaygpKVxuXG5cdFx0fVxuXHRcdGVsc2UgaWYgKHZhbHVlID09PSBcIk1lYW5pbmdcIikge1xuXHRcdFx0Y29uc3QgbWVhbmluZzEgPSBnZXRSYW5kb21FbGVtZW50KGRlc2NyaXB0b3JMaXN0MSk7XG5cdFx0XHRjb25zdCBtZWFuaW5nMiA9IGdldFJhbmRvbUVsZW1lbnQoZGVzY3JpcHRvckxpc3QyKTtcblx0XHRcdHRoaXMuc3RvcmVSZXN1bHQobWVhbmluZzEgKyBcIlxcblwiICsgbWVhbmluZzIpXG5cdFx0fVxuXHRcdGVsc2UgaWYgKHZhbHVlID09PSBcIkFjdGlvblwiKSB7XG5cdFx0XHRjb25zdCBhY3Rpb24xID0gZ2V0UmFuZG9tRWxlbWVudChhY3Rpb25MaXN0MSk7XG5cdFx0XHRjb25zdCBhY3Rpb24yID0gZ2V0UmFuZG9tRWxlbWVudChhY3Rpb25MaXN0Mik7XG5cdFx0XHR0aGlzLnN0b3JlUmVzdWx0KGFjdGlvbjEgKyBcIlxcblwiICsgYWN0aW9uMilcblx0XHR9XG5cdFx0ZWxzZSBpZiAodmFsdWUgPT09IFwiTWVhbmluZyAmIEFjdGlvblwiKSB7XG5cdFx0XHRjb25zdCBtZWFuaW5nMSA9IGdldFJhbmRvbUVsZW1lbnQoZGVzY3JpcHRvckxpc3QxKTtcblx0XHRcdGNvbnN0IG1lYW5pbmcyID0gZ2V0UmFuZG9tRWxlbWVudChkZXNjcmlwdG9yTGlzdDIpO1xuXHRcdFx0Y29uc3QgYWN0aW9uMSA9IGdldFJhbmRvbUVsZW1lbnQoYWN0aW9uTGlzdDEpO1xuXHRcdFx0Y29uc3QgYWN0aW9uMiA9IGdldFJhbmRvbUVsZW1lbnQoYWN0aW9uTGlzdDIpO1xuXHRcdFx0dGhpcy5zdG9yZVJlc3VsdChhY3Rpb24xICsgXCJcXHdcIiArIGFjdGlvbjIgKyBcIlxcblwiICsgbWVhbmluZzEgKyBcIlxcd1wiICsgbWVhbmluZzIpXG5cdFx0fVxuXHR9XG5cdGNoZWNrRGV0YWlsKHJvbGw6IG51bWJlcik6IHN0cmluZyB7XG5cdFx0Y29uc3QgZW1vdGlvbnM6IHsgW2tleTogbnVtYmVyXTogc3RyaW5nIH0gPSB7XG5cdFx0XHQ0OiBcIkFOR0VSXCIsXG5cdFx0XHQ1OiBcIlNBRE5FU1NcIixcblx0XHRcdDY6IFwiRkVBUlwiLFxuXHRcdFx0NzogXCJESVNGQVZPUlMgVEhSRUFEXCIsXG5cdFx0XHQ4OiBcIkRJU0ZBVk9SUyBQQ1wiLFxuXHRcdFx0OTogXCJGT0NVUyBOUENcIixcblx0XHRcdDEwOiBcIkZBVk9SUyBOUENcIixcblx0XHRcdDExOiBcIkZPQ1VTIFBDXCIsXG5cdFx0XHQxMjogXCJESVNGQVZPUlMgTlBDXCIsXG5cdFx0XHQxMzogXCJGT0NVUyBUSFJFQURcIixcblx0XHRcdDE0OiBcIkZBVk9SUyBQQ1wiLFxuXHRcdFx0MTU6IFwiRkFWT1IgVEhSRUFEXCIsXG5cdFx0XHQxNjogXCJDT1VSQUdFXCIsXG5cdFx0XHQxNzogXCJIQVBQSU5FU1NcIixcblx0XHR9O1xuXHRcdGNvbnN0IHJlc3VsdCA9IGVtb3Rpb25zW3JvbGxdIHx8IChyb2xsID49IDE4ID8gXCJDQUxNXCIgOiBcIkFOR0VSXCIpXG5cdFx0cmV0dXJuIHJlc3VsdFxuXHR9XG5cdGRldGFpbENoZWNrKCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgY2hhb3NGYWN0b3JfbnVtID0gdGhpcy5jaGFvc0ZhY3Rvcl9udW07XG5cdFx0bGV0IG1vZDtcblx0XHRpZiAoY2hhb3NGYWN0b3JfbnVtID09PSAzKSB7XG5cdFx0XHRtb2QgPSAyXG5cdFx0fSBlbHNlIGlmIChjaGFvc0ZhY3Rvcl9udW0gPT09IDYpIHtcblx0XHRcdG1vZCA9IC0yXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1vZCA9IDBcblx0XHR9XG5cdFx0Y29uc3Qgcm9sbCA9IHJhbmRvbUludCgxLCAxMSkgKyByYW5kb21JbnQoMSwgMTEpICsgbW9kO1xuXHRcdGNvbnN0IGVtb3Rpb24gPSB0aGlzLmNoZWNrRGV0YWlsKHJvbGwpO1xuXHRcdHJldHVybiBlbW90aW9uXG5cdH1cblxuXHRkcmF3RGV0YWlsQ2hlY2soKSB7XG5cdFx0Y29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXTtcblx0XHRjb25zdCBldmVudF90aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2g2Jyk7XG5cdFx0ZXZlbnRfdGl0bGUuc2V0VGV4dCgnRGV0YWlsIENoZWNrJyk7XG5cdFx0Y29uc3QgZGljZUljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7XG5cdFx0Y29uc3Qgcm9sbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuXHRcdGNvbnN0IGRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG5cdFx0ZHJvcGRvd24uY2xhc3NOYW1lID0gJ2RldGFpbC1jaGVjay1kcm9wZG93bidcblx0XHRjb25zdCBvcHRpb25zID0gW1wiRGV0YWlsXCIsIFwiTWVhbmluZ1wiLCBcIkFjdGlvblwiLCBcIk1lYW5pbmcgJiBBY3Rpb25cIl07XG5cdFx0b3B0aW9ucy5mb3JFYWNoKChvcHRpb25UZXh0KSA9PiB7XG5cdFx0XHRjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcblx0XHRcdG9wdGlvbi50ZXh0Q29udGVudCA9IG9wdGlvblRleHQ7XG5cdFx0XHRvcHRpb24udmFsdWUgPSBvcHRpb25UZXh0XG5cdFx0XHRkcm9wZG93bi5hcHBlbmRDaGlsZChvcHRpb24pO1xuXHRcdH0pO1xuXHRcdGV2ZW50X3RpdGxlLmFwcGVuZENoaWxkKGRyb3Bkb3duKVxuXHRcdGRpY2VJY29uLmNsYXNzTmFtZSA9ICdmYS1zb2xpZCBmYS1tYWduaWZ5aW5nLWdsYXNzJztcblx0XHRkaWNlSWNvbi5hZGRDbGFzcyhcImljb25cIik7XG5cdFx0cm9sbEJ1dHRvbi5hcHBlbmRDaGlsZChkaWNlSWNvbik7XG5cdFx0cm9sbEJ1dHRvbi5hZGRDbGFzcyhcInRvb2x0aXAtZW5hYmxlZFwiKVxuXHRcdHJvbGxCdXR0b24uc2V0QXR0cmlidXRlKFwiZGF0YS10aXRsZVwiLCBcIlJvbGwgRGV0YWlsIENoZWNrIVwiKVxuXHRcdHJvbGxCdXR0b24uYWRkQ2xhc3MoXCJyaWdodC1idXR0b25cIilcblx0XHRldmVudF90aXRsZS5jbGFzc05hbWUgPSAnYnV0dG9uLXRpdGxlJ1xuXHRcdHJvbGxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0aGlzLnJ1bkRldGFpbENoZWNrQnV0dG9uKCk7XG5cdFx0fSlcblx0XHRldmVudF90aXRsZS5hcHBlbmRDaGlsZChyb2xsQnV0dG9uKTtcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoZXZlbnRfdGl0bGUpXG5cdH1cblx0c3RhdGlzdGljQ2hlY2sobW9kOiBudW1iZXIpIHtcblxuXHRcdGNvbnN0IHJvbGxSZXN1bHQgPSByYW5kb21JbnQoMSwgMTEpICsgcmFuZG9tSW50KDEsIDExKSArIG1vZDtcblx0XHRjb25zdCBwZXJjZW50YWdlUmFuZ2VzOiB7IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdOyBldmVudDogc3RyaW5nIH1bXSA9IFtcblx0XHRcdHsgcmFuZ2U6IFswLCAyXSwgZXZlbnQ6IFwiVkVSWSBXRUFLIC03NSVcIiB9LFxuXHRcdFx0eyByYW5nZTogWzMsIDRdLCBldmVudDogXCJXRUFLIC01MCVcIiB9LFxuXHRcdFx0eyByYW5nZTogWzUsIDZdLCBldmVudDogXCJMRVNTIC0xMCVcIiB9LFxuXHRcdFx0eyByYW5nZTogWzcsIDExXSwgZXZlbnQ6IFwiRVhQRUNURUQgQkFTRUxJTkVcIiB9LFxuXHRcdFx0eyByYW5nZTogWzEyLCAxNF0sIGV2ZW50OiBcIk1PUkUgKzEwJVwiIH0sXG5cdFx0XHR7IHJhbmdlOiBbMTUsIDE2XSwgZXZlbnQ6IFwiU1RST05HICs1MCVcIiB9LFxuXHRcdFx0eyByYW5nZTogWzE3LCAxOF0sIGV2ZW50OiBcIlZFUlkgU1RST05HICsxMDAlXCIgfSxcblx0XHRcdHsgcmFuZ2U6IFsxOSwgMjBdLCBldmVudDogXCJQQyBCQVNFTElORVwiIH0sXG5cdFx0XHR7IHJhbmdlOiBbMjEsIDIyXSwgZXZlbnQ6IFwiUEMgTU9SRSArMTAlXCIgfSxcblx0XHRcdHsgcmFuZ2U6IFsyMywgMjRdLCBldmVudDogXCJQQyBTVFJPTkcgKzUwJVwiIH0sXG5cdFx0XHR7IHJhbmdlOiBbMjUsIDI2XSwgZXZlbnQ6IFwiUEMgVkVSWSBTVFJPTkcgKzEwMCVcIiB9LFxuXHRcdF07XG5cblx0XHRmb3IgKGNvbnN0IHsgcmFuZ2UsIGV2ZW50IH0gb2YgcGVyY2VudGFnZVJhbmdlcykge1xuXHRcdFx0Y29uc3QgW21pblJvbGwsIG1heFJvbGxdID0gcmFuZ2U7XG5cdFx0XHRpZiAocm9sbFJlc3VsdCA+PSBtaW5Sb2xsICYmIHJvbGxSZXN1bHQgPD0gbWF4Um9sbCkge1xuXHRcdFx0XHRyZXR1cm4gZXZlbnQ7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBcIlVOS05PV05cIjtcblx0fVxuXG5cblx0ZHJhd1N0YXRpc3RpY0NoZWNrKCkge1xuXHRcdGNvbnN0IGRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG5cdFx0Y29uc3QgZHJvcGRvd25sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2g2Jyk7XG5cdFx0ZHJvcGRvd25sYWJlbC50ZXh0Q29udGVudCA9ICdTdGF0aXN0aWMgQ2hlY2snXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHsgXCJJbXBvcnRhbnQgTlBDXCI6IDIsIFwiV2VhayBBdHRyaWJ1dGVcIjogLTIsIFwiU3Ryb25nIEF0dHJpYnV0ZVwiOiAyLCBcIlByaW1lIEF0dHJpYnV0ZVwiOiA0IH07XG5cdFx0T2JqZWN0LmVudHJpZXMob3B0aW9ucykuZm9yRWFjaCgoW29wdGlvblRleHQsIG51bWVyaWNWYWx1ZV0pID0+IHtcblx0XHRcdGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuXHRcdFx0b3B0aW9uLnRleHRDb250ZW50ID0gb3B0aW9uVGV4dDtcblx0XHRcdG9wdGlvbi52YWx1ZSA9IG51bWVyaWNWYWx1ZS50b1N0cmluZygpO1xuXHRcdFx0ZHJvcGRvd24uYXBwZW5kQ2hpbGQob3B0aW9uKTtcblx0XHR9KTtcblx0XHRkcm9wZG93bmxhYmVsLmFwcGVuZENoaWxkKGRyb3Bkb3duKVxuXHRcdGNvbnN0IHJvbGxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHRjb25zdCBkaWNlSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcblx0XHRkaWNlSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtY2hhcnQtc2ltcGxlJztcblx0XHRkaWNlSWNvbi5hZGRDbGFzcyhcImljb25cIik7XG5cdFx0cm9sbEJ1dHRvbi5hcHBlbmRDaGlsZChkaWNlSWNvbik7XG5cdFx0cm9sbEJ1dHRvbi5hZGRDbGFzcyhcInRvb2x0aXAtZW5hYmxlZFwiKVxuXHRcdHJvbGxCdXR0b24uc2V0QXR0cmlidXRlKFwiZGF0YS10aXRsZVwiLCBcIlJvbGwgc3RhdGlzdGljIENoZWNrIVwiKVxuXHRcdGRyb3Bkb3dubGFiZWwuY2xhc3NOYW1lID0gJ2J1dHRvbi10aXRsZSc7XG5cdFx0cm9sbEJ1dHRvbi5hZGRDbGFzcyhcInJpZ2h0LWJ1dHRvblwiKVxuXHRcdGRyb3Bkb3dubGFiZWwuYXBwZW5kQ2hpbGQocm9sbEJ1dHRvbik7XG5cdFx0cm9sbEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMuc3RhdGlzdGljQ2hlY2socGFyc2VJbnQoKGRyb3Bkb3duLnZhbHVlKSkpXG5cdFx0XHR0aGlzLnN0b3JlUmVzdWx0KHJlc3VsdClcblx0XHR9KVxuXHRcdHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0uYXBwZW5kQ2hpbGQoZHJvcGRvd25sYWJlbClcblxuXHR9XG5cdGdldFN0YW5jZSgpIHtcblx0XHRjb25zdCBkaXNwID0gdGhpcy5jb250YWluZXJFbC5xdWVyeVNlbGVjdG9yKCcuaW5wdXQtZGlzcG9zaXRpb24nKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXHRcdGNvbnN0IGRpc3Bvc2l0aW9uX3ZhbHVlID0gcGFyc2VJbnQoZGlzcC52YWx1ZSk7XG5cdFx0Zm9yIChjb25zdCB7IHJhbmdlLCBzdGFuY2UsIG1vZCB9IG9mIGRpc3BSYW5nZXMpIHtcblx0XHRcdGNvbnN0IFttaW5Sb2xsLCBtYXhSb2xsXSA9IHJhbmdlO1xuXHRcdFx0aWYgKGRpc3Bvc2l0aW9uX3ZhbHVlID49IG1pblJvbGwgJiYgZGlzcG9zaXRpb25fdmFsdWUgPD0gbWF4Um9sbCkge1xuXHRcdFx0XHRyZXR1cm4gW21vZCwgc3RhbmNlXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIFstMiwgXCJicm9rZVwiXVxuXHR9XG5cdHVwZGF0ZURpc3Bvc2l0aW9uKG51bWJlcjogbnVtYmVyKSB7XG5cdFx0Y29uc3QgZGlzcCA9IHRoaXMuY29udGFpbmVyRWwucXVlcnlTZWxlY3RvcignLmlucHV0LWRpc3Bvc2l0aW9uJykgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRjb25zdCBkaXNwTGFiZWwgPSB0aGlzLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJy5kaXNwb3NpdGlvbkxhYmVsJykgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRsZXQgZGlzcG9zaXRpb25fdmFsdWUgPSBwYXJzZUludChkaXNwLnZhbHVlKTtcblx0XHRkaXNwb3NpdGlvbl92YWx1ZSArPSBudW1iZXI7XG5cdFx0ZGlzcC52YWx1ZSA9IGRpc3Bvc2l0aW9uX3ZhbHVlLnRvU3RyaW5nKClcblx0XHR0aGlzLnVwZGF0ZURpc3Bvc2l0aW9uRGlzcGxheShkaXNwTGFiZWwpXG5cdH1cblx0dXBkYXRlRGlzcG9zaXRpb25EaXNwbGF5KGRpc3BsYXk6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29uc3QgW18sIHN0YW5jZV0gPSB0aGlzLmdldFN0YW5jZSgpO1xuXHRcdGRpc3BsYXkudGV4dENvbnRlbnQgPSBzdGFuY2UgYXMgc3RyaW5nO1xuXHRcdGlmIChzdGFuY2UgPT09ICdQYXNzaXZlJykge1xuXHRcdFx0ZGlzcGxheS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnY3lhbic7XG5cdFx0fSBlbHNlIGlmIChzdGFuY2UgPT09ICdNb2RlcmF0ZScpIHtcblx0XHRcdGRpc3BsYXkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ2dyZXknO1xuXHRcdH0gZWxzZSBpZiAoc3RhbmNlID09PSAnQWN0aXZlJykge1xuXHRcdFx0ZGlzcGxheS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnb3JhbmdlJztcblx0XHR9XG5cdFx0ZWxzZSBpZiAoc3RhbmNlID09PSAnQWdncmVzc2l2ZScpIHtcblx0XHRcdGRpc3BsYXkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JlZCc7XG5cdFx0fVxuXG5cdH1cblx0ZHJhd0JlaGF2aW9yQ2hlY2soKSB7XG5cdFx0Y29uc3QgYXBwID0gdGhpcztcblx0XHRjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdO1xuXHRcdGNvbnN0IGV2ZW50X3RpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDYnKTtcblx0XHRldmVudF90aXRsZS5zZXRUZXh0KCdCZWhhdmlvciBDaGVjaycpO1xuXHRcdGNvbnN0IGRpc3Bvc2l0aW9uQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG5cdFx0Y29uc3QgZGlzcG9zaXRpb25JY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuXHRcdGRpc3Bvc2l0aW9uSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtZGljZSc7XG5cdFx0ZGlzcG9zaXRpb25JY29uLmFkZENsYXNzKFwiaWNvblwiKTtcblx0XHRkaXNwb3NpdGlvbkJ1dHRvbi5zdHlsZS5oZWlnaHQgPSAnMzBweCdcblx0XHRkaXNwb3NpdGlvbkJ1dHRvbi5zdHlsZS53aWR0aCA9ICczMHB4J1xuXHRcdGRpc3Bvc2l0aW9uSWNvbi5zdHlsZS5mb250U2l6ZSA9ICcxMHB4J1xuXHRcdGRpc3Bvc2l0aW9uQnV0dG9uLmFwcGVuZENoaWxkKGRpc3Bvc2l0aW9uSWNvbik7XG5cdFx0ZGlzcG9zaXRpb25CdXR0b24uYWRkQ2xhc3MoXCJ0b29sdGlwLWVuYWJsZWRcIilcblx0XHRjb25zdCBkaXNwb3Rpb25Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRkaXNwb3Rpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdmbGV4J1xuXHRcdGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRkaXNwb3NpdGlvbkJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRpdGxlXCIsIFwiUm9sbCBEaXNwb3NpdGlvbiFcIilcblx0XHRpbnB1dC5hZGRDbGFzcygnaW5wdXQtZGlzcG9zaXRpb24nKVxuXHRcdGlucHV0LnZhbHVlID0gJzAnXG5cdFx0aW5wdXQuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcidcblx0XHRpbnB1dC50eXBlID0gJ251bWJlcic7XG5cdFx0aW5wdXQuc3R5bGUud2lkdGggPSAnNDVweCc7XG5cdFx0aW5wdXQubWluID0gJzEnO1xuXHRcdGlucHV0Lm1heCA9ICc5OSc7XG5cdFx0aW5wdXQubWF4TGVuZ3RoID0gMjtcblx0XHRpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAodGhpcy52YWx1ZS5sZW5ndGggPiAyKSB7XG5cdFx0XHRcdHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnNsaWNlKDAsIDIpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodGhpcy52YWx1ZS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0dGhpcy52YWx1ZSA9ICcwJ1xuXHRcdFx0fVxuXHRcdFx0YXBwLnVwZGF0ZURpc3Bvc2l0aW9uRGlzcGxheShkaXNwb3NpdGlvbkxhYmVsKVxuXHRcdH0pO1xuXHRcdGNvbnN0IGRpY2VJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuXHRcdGNvbnN0IHJvbGxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHRkaWNlSWNvbi5jbGFzc05hbWUgPSAnZmEtc29saWQgZmEtcGVyc29uLWNpcmNsZS1xdWVzdGlvbic7XG5cdFx0ZGljZUljb24uYWRkQ2xhc3MoXCJpY29uXCIpO1xuXHRcdHJvbGxCdXR0b24uYXBwZW5kQ2hpbGQoZGljZUljb24pO1xuXHRcdHJvbGxCdXR0b24uYWRkQ2xhc3MoXCJ0b29sdGlwLWVuYWJsZWRcIilcblx0XHRyb2xsQnV0dG9uLnNldEF0dHJpYnV0ZShcImRhdGEtdGl0bGVcIiwgXCJSb2xsIEJlaGF2aW9yIENoZWNrIVwiKVxuXHRcdHJvbGxCdXR0b24uYWRkQ2xhc3MoXCJyaWdodC1idXR0b25cIilcblx0XHRjb25zdCBkaXNwb3NpdGlvbkxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdGRpc3Bvc2l0aW9uTGFiZWwuYWRkQ2xhc3MoJ2Rpc3Bvc2l0aW9uTGFiZWwnKVxuXHRcdGRpc3Bvc2l0aW9uTGFiZWwudGV4dENvbnRlbnQgPSAnUGFzc2l2ZSc7XG5cdFx0ZGlzcG9zaXRpb25MYWJlbC5zdHlsZS5jb2xvciA9ICdibGFjayc7XG5cdFx0ZGlzcG9zaXRpb25MYWJlbC5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkIGJsYWNrJ1xuXHRcdGRpc3Bvc2l0aW9uTGFiZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ2N5YW4nXG5cdFx0ZXZlbnRfdGl0bGUuY2xhc3NOYW1lID0gJ2J1dHRvbi10aXRsZSc7XG5cdFx0cm9sbEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGFwcC5iZWhhdmlvckNoZWNrKClcblx0XHR9KVxuXG5cdFx0ZGlzcG9zaXRpb25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0YXBwLnVwZGF0ZURpc3BsYXkocmFuZG9tSW50KDIsIDIxKSwgJy5pbnB1dC1kaXNwb3NpdGlvbicpXG5cdFx0XHRhcHAudXBkYXRlRGlzcG9zaXRpb25EaXNwbGF5KGRpc3Bvc2l0aW9uTGFiZWwpXG5cdFx0fSk7XG5cdFx0ZGlzcG90aW9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGRpc3Bvc2l0aW9uQnV0dG9uKVxuXHRcdGRpc3BvdGlvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChpbnB1dClcblx0XHRkaXNwb3Rpb25Db250YWluZXIuYXBwZW5kQ2hpbGQoZGlzcG9zaXRpb25MYWJlbClcblx0XHRldmVudF90aXRsZS5hcHBlbmRDaGlsZChkaXNwb3Rpb25Db250YWluZXIpXG5cdFx0ZXZlbnRfdGl0bGUuYXBwZW5kQ2hpbGQocm9sbEJ1dHRvbik7XG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGV2ZW50X3RpdGxlKVxuXG5cdH1cblx0YmVoYXZpb3JDaGVjaygpIHtcblx0XHRjb25zdCByb2xsID0gcmFuZG9tSW50KDEsIDExKTtcblx0XHRmb3IgKGNvbnN0IG9wdGlvbiBvZiBucGNBY3Rpb25UYWJsZTEpIHtcblx0XHRcdGNvbnN0IFttaW4sIG1heF0gPSBvcHRpb24ucmFuZ2U7XG5cdFx0XHRpZiAocm9sbCA+PSBtaW4gJiYgcm9sbCA8PSBtYXgpIHtcblx0XHRcdFx0Y29uc3QgYWN0aW9uID0gb3B0aW9uLmFjdGlvbjtcblx0XHRcdFx0dGhpcy5zdG9yZVJlc3VsdChhY3Rpb24pXG5cdFx0XHRcdGlmIChhY3Rpb24uY29udGFpbnMoXCIrMlwiKSkge1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlRGlzcG9zaXRpb24oMilcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChhY3Rpb24uY29udGFpbnMoXCItMlwiKSkge1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlRGlzcG9zaXRpb24oLTIpXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoYWN0aW9uLmNvbnRhaW5zKFwiLTRcIikpIHtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZURpc3Bvc2l0aW9uKC00KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGFjdGlvbi5jb250YWlucyhcIis0XCIpKSB7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVEaXNwb3NpdGlvbig0KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChhY3Rpb24uY29udGFpbnMoXCJOUEMgQWN0aW9uXCIpKSB7XG5cdFx0XHRcdFx0bGV0IFttb2QsIF9dID0gdGhpcy5nZXRTdGFuY2UoKVxuXHRcdFx0XHRcdG1vZCA9IG1vZCBhcyBudW1iZXI7XG5cdFx0XHRcdFx0Y29uc3Qgcm9sbCA9IHJhbmRvbUludCgxLCAxMSkgKyByYW5kb21JbnQoMSwgMTEpICsgbW9kO1xuXHRcdFx0XHRcdGZvciAoY29uc3Qgb3B0aW9uIG9mIG5wY0FjdGlvblRhYmxlMikge1xuXHRcdFx0XHRcdFx0Y29uc3QgW21pbiwgbWF4XSA9IG9wdGlvbi5yYW5nZTtcblx0XHRcdFx0XHRcdGlmIChyb2xsID49IG1pbiAmJiByb2xsIDw9IG1heCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBhY3Rpb24gPSBvcHRpb24uYWN0aW9uO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0b3JlUmVzdWx0KGFjdGlvbilcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XG5cblx0XHRjb250YWluZXIuY3JlYXRlRWwoXCJoNFwiLCB7IHRleHQ6IFwiTXl0aGljIEdhbWUgRW11bGF0b3JcIiB9KTtcblxuXHRcdC8vIGRyYXcgY29udHJvbHMgZmlyc3Rcblx0XHR0aGlzLmRyYXdDRklucHV0KCk7XG5cdFx0dGhpcy5kcmF3RmF0ZUNoZWNrKCk7XG5cdFx0dGhpcy5kcmF3RXZlbnRSb2xsKCk7XG5cdFx0dGhpcy5kcmF3RGV0YWlsQ2hlY2soKTtcblx0XHR0aGlzLmRyYXdTdGF0aXN0aWNDaGVjaygpO1xuXHRcdHRoaXMuZHJhd0JlaGF2aW9yQ2hlY2soKTtcblx0XHR0aGlzLmRyYXdTZW50ZW5jZVBpY2tlcigpO1xuXG5cdFx0Ly8g4qyH77iPIGJ1aWxkIFJlc3VsdHMgYXQgdGhlIGVuZCAob3IgbW92ZSBpdCBoZXJlIGlmIGFscmVhZHkgYnVpbHQpXG5cdFx0aWYgKCF0aGlzLnJlc3VsdHNDb250YWluZXIpIHtcblx0XHRcdHRoaXMucmVzdWx0c0NvbnRhaW5lciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJyZXN1bHRzLWNvbnRhaW5lclwiKTtcblxuXHRcdFx0Y29uc3QgcmVzdWx0SGVhZGVyID0gdGhpcy5yZXN1bHRzQ29udGFpbmVyLmNyZWF0ZURpdihcInJlc3VsdHMtaGVhZGVyXCIpO1xuXHRcdFx0Y29uc3QgcmVzdWx0VGl0bGUgPSByZXN1bHRIZWFkZXIuY3JlYXRlU3Bhbih7IGNsczogXCJyZXN1bHRzLXRpdGxlXCIgfSk7XG5cdFx0XHRyZXN1bHRUaXRsZS5zZXRUZXh0KFwiUmVzdWx0c1wiKTtcblxuXHRcdFx0Y29uc3QgY2xlYXJCdG4gPSByZXN1bHRIZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiYm9yZGVybGVzcy1idXR0b24gcmlnaHQtYnV0dG9uIHRvb2x0aXAtZW5hYmxlZFwiIH0pO1xuXHRcdFx0Y2xlYXJCdG4uc2V0QXR0cmlidXRlKFwiZGF0YS10aXRsZVwiLCBcIkRlbGV0ZSBhbGwgcmVzdWx0c1wiKTtcblx0XHRcdGNhbGN1bGF0ZUJ1dHRvblBhZGRpbmcoY2xlYXJCdG4pO1xuXHRcdFx0Y2xlYXJCdG4uY3JlYXRlRWwoXCJpXCIsIHsgY2xzOiBcImZhLXNvbGlkIGZhLXRyYXNoXCIgfSk7XG5cdFx0XHRjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnJlc3VsdHMgPSBbXTtcblx0XHRcdFx0dGhpcy5kcmF3TGlzdCgpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMubGlzdEVsID0gdGhpcy5yZXN1bHRzQ29udGFpbmVyLmNyZWF0ZUVsKFwidWxcIiwgeyBjbHM6IFwicmVzdWx0cy1saXN0XCIgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGlmIGl0IGFscmVhZHkgZXhpc3RzLCB0aGlzIG1vdmVzIGl0IHRvIHRoZSBib3R0b21cblx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnJlc3VsdHNDb250YWluZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMuZHJhd1Jlc3VsdHNMaXN0KCk7XG5cdH1cblxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gTm90aGluZyB0byBjbGVhbiB1cC5cblx0fVxufVxuXG4iXX0=