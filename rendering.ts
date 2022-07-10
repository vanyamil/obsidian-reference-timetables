import {
	TableGenData,
} from './types'

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

export default function renderData(data: TableGenData) {
	navigator.clipboard.writeText(dataAsMarkdown(data));
}