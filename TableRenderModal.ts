import {
	App,
	ButtonComponent,
	DropdownComponent,
	Modal,
	Setting,
	TextComponent,
	ToggleComponent,
} from 'obsidian';

import {
	LinkDirection,
	TableGenSettings,
} from './types';

import generateData from './generation';
import renderData from './rendering';

const DEFAULT_GEN_SETTINGS: TableGenSettings = {
	time_axis_path: "",
	inquire_axis_path: "",
	collect_links: "front",
	include_first: true,
	include_last: true,
};

export default class TableRenderModal extends Modal {
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
					.onClick((evt: MouseEvent) => {
						const data = generateData(this.settings, this.app.metadataCache.resolvedLinks);
						renderData(data);
					})
			);
	}

	// Called when the modal is closed in any way, cleanup view
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
