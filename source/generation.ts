import {
	mapValues as _mapValues,
	mapKeys as _mapKeys,
	mergeWith as _mergeWith,
	pick as _pick,
} from 'lodash-es';

import {normalizePath} from 'obsidian';

import {
	CountMap,
	LinkMap,
	LinkDirection,
	TableDataPerInquiry,
	TableGenData,
	TableGenSettings,
} from './types';

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
	console.debug("generating back links");
	const source_checked = _pick(resolvedLinks, targets);
	console.debug("only with source", Object.keys(source_checked));
	const dest_checked = _mapValues(source_checked, val_map => _pick(val_map, sources));
	console.debug("after filter", dest_checked);
	return dest_checked;
}

// Used with _.mergeWith, allows merging of front and back links by adding the counts together
function mergeCustomizer(objValue: any, srcValue: any): number|undefined {
	if (typeof objValue === "number" && typeof srcValue === "number") {
		return objValue + srcValue;
	}
}

// Returns the list of paths with the given prefix sorted in natural alphanumeric order
function sortedPaths(resolvedLinks: LinkMap, prefix: string): string[] {
	let files: string[] = Object.keys(resolvedLinks).filter(path => path.startsWith(normalizePath(prefix)));
	return files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
}

// Get just the basename of the file path (assuming file exists)
function basename(filepath: string) {
	const last_slash = filepath.lastIndexOf('/') + 1;
	const last_dot = filepath.lastIndexOf('.');
	return filepath.substring(last_slash, last_dot);
}

// Generate the table data based on settings
export default function generateData(settings: TableGenSettings, resolvedLinks: LinkMap): TableGenData {
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
		const back_links = generateBackLinks(resolvedLinks, time_files, inquire_files);
		_mergeWith(final_links, back_links, mergeCustomizer);
	}

	console.debug("Final links", final_links);

	// Assemble a map inquire_axis -> time_data
	// time_data has aggregates and a map time_axis -> count
	const maps: TableDataPerInquiry[] = inquire_files.map(file => {
		let res: TableDataPerInquiry = {
			inquiry_file: basename(file),
			counts: _mapKeys(final_links[file], (val, key) => basename(key)) ?? {},
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

	console.debug(maps);

	return {
		time_files: time_files.map(key => basename(key)),
		maps
	};
}
