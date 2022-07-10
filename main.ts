import {
	App,
	ButtonComponent,
	DropdownComponent,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent,
	ToggleComponent,
	Vault
} from 'obsidian';

import {
	filter as _filter,
	map as _map,
	mapValues as _mapValues,
	mergeWith as _mergeWith,
	pick as _pick,
} from 'lodash-es';

// Plugin.app
// App.vault
// App.metadataCache
// MetadataCache.getCache ?
// MetadataCache.resolvedLinks: Record<string, Record<string, number>>;
// Vault.recurseChildren(TFolder, TAbstractFile => any)

// Note - search functionality is not available because it is part of an internal plugin
// However, there are ways to extract it out if it is enabled
// Example: https://github.com/qawatake/obsidian-core-search-assistant-plugin/blob/main/src/interfaces/SearchComponentInterface.ts
// or https://github.com/mrjackphil/obsidian-text-expand/blob/master/src/main.ts

// Console - Ctrl-Shift-I

// For render: https://github.com/marcusolsson/obsidian-plugin-docs/blob/841b734e903a6192fc4841e976a5f1370cd4bc46/docs/guides/custom-views.md

type CountMap = Record<string, number>;
type LinkMap = Record<string, CountMap>;
type LinkDirection = 'front' | 'back' | 'both';

type TableGenSettings = {
	time_axis_path: string,
	inquire_axis_path: string,
	collect_links: LinkDirection,
	include_first: boolean,
	include_last: boolean,
}

type TableDataPerInquiry = {
	inquiry_file: string,
	counts: CountMap,
	first_seen?: string,
	last_seen?: string,
}

type TableGenData = {
	maps: TableDataPerInquiry[],
	time_files: string[],
}

// Find links from sources to targets but invert it in the result
function generateFrontLinks(resolvedLinks: LinkMap, sources: string[], targets: string[]): LinkMap {
	let res: LinkMap = {};
	for (const target of targets) {
		res[target] = {};
		for (const source of sources) {
			if (source in resolvedLinks && target in resolvedLinks[source]) {
				res[target][source] = resolvedLinks[source][target];
			}
		}
	}
	return res;
}

// Find links from targets to sources
function generateBackLinks(resolvedLinks: LinkMap, sources: string[], targets: string[]): LinkMap {
	const source_checked = _pick(resolvedLinks, targets);
	const dest_checked = _mapValues(source_checked, val_map => _pick(val_map, targets));
	return dest_checked;
}

function mergeCustomizer(objValue: any, srcValue: any): number|undefined {
	if (typeof objValue === "number" && typeof srcValue === "number") {
		return objValue + srcValue;
	}
}

function sortedPaths(resolvedLinks: LinkMap, prefix: string): string[] {
	let files: string[] = _filter(Object.keys(resolvedLinks), path => path.startsWith(prefix));
	return files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
}

// Generate the table data based on settings (no render)
function generateData(settings: TableGenSettings, resolvedLinks: LinkMap): TableGenData {
	let final_links: LinkMap = {};
	// Get sorted lists of both axes of files
	const time_files: string[] = sortedPaths(resolvedLinks, settings.time_axis_path);
	const inquire_files: string[] = sortedPaths(resolvedLinks, settings.inquire_axis_path);

	// Collect frontlinks if needed (time to inquiry)
	if (settings.collect_links != 'back') {
		const forward_links = generateFrontLinks(resolvedLinks, time_files, inquire_files);
		_mergeWith(final_links, forward_links, mergeCustomizer);
	}

	// Collect backlinks if needed (inquiry to time)
	if (settings.collect_links != 'front') {
		const back_links = generateBackLinks(resolvedLinks, inquire_files, time_files);
		_mergeWith(final_links, back_links, mergeCustomizer);
	}

	// Assemble a map inquire_axis -> time_data
	// time_data has aggregates and a map time_axis -> count
	const maps: TableDataPerInquiry[] = _map(inquire_files, file => {
		let res: TableDataPerInquiry = {
			inquiry_file: file,
			counts: final_links[file] ?? [],
		};
		// Also do some aggregates
		if (settings.include_first && res.counts.length > 0) {
			res.first_seen = Object.keys(res.counts)[0];
		}
		if (settings.include_last && res.counts.length > 0) {
			res.last_seen = Object.keys(res.counts)[res.counts.length - 1];
		}
		return res;
	});

	console.log(maps);

	return {
		time_files,
		maps
	};
}

const DEFAULT_GEN_SETTINGS: TableGenSettings = {
	time_axis_path: "",
	inquire_axis_path: "",
	collect_links: "front",
	include_first: true,
	include_last: true,
};

class TableRenderModal extends Modal {
	settings: TableGenSettings;

	constructor(app: App) {
		super(app);
		this.settings = DEFAULT_GEN_SETTINGS;
	}

	// Called when the modal is given the open() call, generate view
	onOpen() {
		const {contentEl} = this;
		
		contentEl.createEl("h1", {text: "Generate Reference Timetable"});

		// https://marcus.se.net/obsidian-plugin-docs/api/classes/Setting
		new Setting(contentEl)
			.setName("Time axis")
			.addText((text: TextComponent) => 
				text.onChange(value => {
					this.settings.time_axis_path = value;
				})
			);

		new Setting(contentEl)
			.setName("Inquire axis")
			.addText((text: TextComponent) => 
				text.onChange(value => {
					this.settings.inquire_axis_path = value;
				})
			);

		new Setting(contentEl)
			.setName("Link direction")
			.addDropdown((cp : DropdownComponent) => 
				cp
					.addOption("front", "Time to inquire")
					.addOption("back", "Inquire to time")
					.addOption("both", "Both directions")
					.onChange((value: LinkDirection) => {
						this.settings.collect_links = value;
					})
			);

		new Setting(contentEl)
			.setName("Include first")
			.addToggle((cp: ToggleComponent) => 
				cp.onChange(value => {
					this.settings.include_first = value;
				})
			);

		new Setting(contentEl)
			.setName("Include last")
			.addToggle((cp: ToggleComponent) => 
				cp.onChange(value => {
					this.settings.include_last = value;
				})
			);

		new Setting(contentEl)
			.addButton((btn: ButtonComponent) => 
				btn
					.setCta()
					.setButtonText("Generate")
					.onClick((evt: MouseEvent) => generateData(this.settings, this.app.metadataCache.resolvedLinks))
			);
	}

	// Called when the modal is closed in any way, cleanup view
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export default class ReferenceTimetables extends Plugin {
	settings: object;
	// Boilerplate
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('lines-of-text', 'Reference Timetables', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new TableRenderModal(this.app).open();
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign(
			{}, 
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


// SAMPLE CODE
// Remember to rename these classes and interfaces!
/*
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
*/