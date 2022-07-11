import {TFile} from 'obsidian';

import {TableGenData} from './types';

function dataAsMarkdown(data: TableGenData): string {
	let res : string = '';

	// Header with column names
	res += '| Inquiry File | ' + data.time_files.map(file => file.basename).join(' | ') + ' |\n';

	// Table alignment line
	res += '| --- | ' + data.time_files.map(() => '---').join(' | ') + ' |\n';

	// For each inquiry file, write the counts
	for (const map of data.maps) {
		res += '| ' + map.inquiry_file.basename + ' | ' + data.time_files.map(file => 
			(file.path in map.counts) ? map.counts[file.path] : ''
		).join(' | ') + ' |\n';
	}

	return res;
}

function setupFileLink(parentEl: HTMLElement, file: TFile): void {
	parentEl.createEl("a", {
		href: file.path,
		text: file.basename,
		cls: 'internal-link',
	});
}

export function dataIntoHtml(data: TableGenData, root: HTMLElement): void {
	const table = root.createEl("table");
	
	// Table head - Column headers
	const thead = table.createEl("thead");
	const theadrow = thead.createEl("tr");

	theadrow.createEl("th", {text: "Inquiry File"});
	if ('first_seen' in data.maps[0]) { // Could fail if first file has 0 counts; better to use settings
		theadrow.createEl("th", {text: "First seen"});
	}
	if ('last_seen' in data.maps[0]) { // Could fail if first file has 0 counts; better to use settings
		theadrow.createEl("th", {text: "Last seen"});
	}
	data.time_files.forEach(file => setupFileLink(theadrow.createEl("th"), file));

	// Table body - add data for each inquiry file
	const tbody = table.createEl("tbody");
	for (const map of data.maps) {
		const trow = tbody.createEl("tr");
		setupFileLink(trow.createEl("th"), map.inquiry_file);

		if ('first_seen' in map) {
			setupFileLink(trow.createEl("td"), map.first_seen!);
		}

		if ('last_seen' in map) {
			setupFileLink(trow.createEl("td"), map.last_seen!);
		}

		data.time_files.forEach(file => trow.createEl("td", (file.path in map.counts) ? {text: map.counts[file.path].toString()} : undefined));
	}

	// Add responsive table - horizontal scroll
	root.toggleClass("table-parent", true);
}

export function renderData(data: TableGenData) {
	navigator.clipboard.writeText(dataAsMarkdown(data));
}