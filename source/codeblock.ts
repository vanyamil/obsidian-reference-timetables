import {Notice} from 'obsidian';

import {DEFAULT_GEN_SETTINGS, PLUGIN_TITLE} from './constants';
import generateData from './generation';
import {dataIntoHtml} from './rendering';

export default function codeblockProcessor(source: string, el: HTMLElement) {
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
				new Notice(`${PLUGIN_TITLE}: Unable to parse gen setting key ${key}`);
			}
		} else if (line.length > 0) {
			new Notice(`${PLUGIN_TITLE}: Unable to parse line ${line} as a gen setting`);
		}
	});
	console.debug("Generating with settings:", settings);
	// Generate data
	const data = generateData(settings, this.app.metadataCache.resolvedLinks);
	console.debug("Generated data:", data);
	// Render on the el as root
	dataIntoHtml(data, el);
}