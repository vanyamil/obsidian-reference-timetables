import {Plugin} from 'obsidian';

import {PLUGIN_TITLE} from './source/constants';
import codeblockProcessor from './source/codeblock';

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
		/*
		this.addRibbonIcon('lines-of-text', PLUGIN_TITLE, (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new TableRenderModal(this.app).open();
		});
		*/

		// Register a renderer of ```reftables blocks
		this.registerMarkdownCodeBlockProcessor("reftables", codeblockProcessor);

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
