import {TableGenData} from './types';

function dataAsMarkdown(data: TableGenData) {
	let res : string = '';

	// Header with column names
	res += '| Inquiry File | ' + data.time_files.join(' | ') + ' |\n';

	// Table alignment line
	res += '| --- | ' + data.time_files.map(() => '---').join(' | ') + ' |\n';

	// For each inquiry file, write the counts
	for (const map of data.maps) {
		res += '| ' + map.inquiry_file + ' | ' + data.time_files.map(file => 
			(file in map.counts) ? map.counts[file] : ''
		).join(' | ') + ' |\n';
	}

	return res;
}

export function dataAsHtml(data: TableGenData, root: HTMLElement) {
	const table = root.createEl("table");
	
	// Table head - Column headers
	const thead = table.createEl("thead");
	const theadrow = thead.createEl("tr");

	theadrow.createEl("th", {text: "Inquiry File"});
	data.time_files.forEach(file => theadrow.createEl("th", {text: file}));

	// Table body - add data for each inquiry file
	const tbody = table.createEl("tbody");
	for (const map of data.maps) {
		const trow = tbody.createEl("tr");
		trow.createEl("th", {text: map.inquiry_file});
		data.time_files.forEach(file => trow.createEl("td", (file in map.counts) ? {text: map.counts[file].toString()} : undefined));
	}
}

export function renderData(data: TableGenData) {
	navigator.clipboard.writeText(dataAsMarkdown(data));
}