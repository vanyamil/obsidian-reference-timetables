import {
	Plugin,
} from 'obsidian';

import {
	DEFAULT_GEN_SETTINGS,
	PLUGIN_TITLE,
} from './source/constants';
import TableRenderModal from './source/TableRenderModal';
import generateData from './source/generation';
import {dataAsHtml} from './source/rendering';

// Note - search functionality is not available because it is part of an internal plugin
// However, there are ways to extract it out if it is enabled
// Example: https://github.com/qawatake/obsidian-core-search-assistant-plugin/blob/main/src/interfaces/SearchComponentInterface.ts
// or https://github.com/mrjackphil/obsidian-text-expand/blob/master/src/main.ts

// Console - Ctrl-Shift-I

// For render: https://github.com/marcusolsson/obsidian-plugin-docs/blob/841b734e903a6192fc4841e976a5f1370cd4bc46/docs/guides/custom-views.md

export default class ReferenceTimetables extends Plugin {
	settings: object;
	// Boilerplate
	async onload() {
		console.info(PLUGIN_TITLE, "plugin loading");

		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('lines-of-text', PLUGIN_TITLE, (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new TableRenderModal(this.app).open();
		});

		// Register a renderer of ```reftables blocks
		this.registerMarkdownCodeBlockProcessor("reftables", (source: string, el: HTMLElement) => {
			// Split source into gen settings
			const lines = source.split("\n");
			let settings = Object.assign({}, DEFAULT_GEN_SETTINGS);
			lines.forEach(line => {
				if (line.includes(":")) {
					const [key, value] = line.split(":", 2);
					if (key in settings) {
						// @ts-ignore
						settings[key] = value.trim();
					} else {
						console.warn("Unable to parse gen setting key [%s]", key);
					}
				} else {
					console.warn("Unable to parse line [%s] as a gen setting", line);
				}
			});
			console.debug("Generating with settings:", settings);
			// Generate data
			const data = generateData(settings, this.app.metadataCache.resolvedLinks);
			console.debug("Generated data:", data);
			// Render on the el as root
			dataAsHtml(data, el);
		});

		console.info(PLUGIN_TITLE, "plugin loaded");
	}

	onunload() {
		console.info(PLUGIN_TITLE, "plugin unloaded");
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
