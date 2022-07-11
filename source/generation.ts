import {
	mapValues as _mapValues,
	mapKeys as _mapKeys,
	mergeWith as _mergeWith,
	pick as _pick,
} from 'lodash-es';

import {
	App,
	normalizePath,
	TFile,
} from 'obsidian';

import {
	CountMap,
	LinkMap,
	LinkDirection,
	TableDataPerInquiry,
	TableGenData,
	TableGenSettings,
} from './types';

export default class DataGenerator {
	app: App;

	constructor(app: App) {
		this.app = app;

		this.safeFileFromPath = this.safeFileFromPath.bind(this);
	}

	// Returns TFile for a path - works for paths coming from resolvedLinks
	safeFileFromPath(path: string): TFile {
		const f = this.app.vault.getAbstractFileByPath(path);
		if (!(f instanceof TFile)) {
			throw 'Impossible case';
		}
		return f;
	}

	// Find links from sources to targets but invert it in the result
	generateFrontLinks(sources: TFile[], targets: TFile[]): LinkMap {
		const resolvedLinks = this.app.metadataCache.resolvedLinks;
		let res: LinkMap = {};
		for (const target of targets) {
			res[target.path] = {};
			for (const source of sources) {
				if (source.path in resolvedLinks && target.path in resolvedLinks[source.path]) {
					res[target.path][source.path] = resolvedLinks[source.path][target.path];
				}
			}
		}
		return res;
	}

	// Find links from targets to sources
	generateBackLinks(sources: TFile[], targets: TFile[]): LinkMap {
		const resolvedLinks = this.app.metadataCache.resolvedLinks;
		console.debug("generating back links");
		const source_checked = _pick(resolvedLinks, targets.map(target => target.path));
		console.debug("only with source", Object.keys(source_checked));
		const dest_checked = _mapValues(source_checked, val_map => _pick(val_map, sources.map(source => source.path)));
		console.debug("after filter", dest_checked);
		return dest_checked;
	}

	// Used with _.mergeWith, allows merging of front and back links by adding the counts together
	mergeCustomizer(objValue: any, srcValue: any): number|undefined {
		if (typeof objValue === "number" && typeof srcValue === "number") {
			return objValue + srcValue;
		}
	}

	// Returns the list of paths with the given prefix sorted in natural alphanumeric order
	sortedPaths(prefix: string): TFile[] {
		const resolvedLinks = this.app.metadataCache.resolvedLinks;
		let files: string[] = Object.keys(resolvedLinks).filter(path => path.startsWith(normalizePath(prefix)));
		files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
		return files.map(this.safeFileFromPath);
	}

	// Generate the table data based on settings
	generateData(settings: TableGenSettings): TableGenData {
		let final_links: LinkMap = {};
		// Get sorted lists of both axes of files
		const time_files: TFile[] = this.sortedPaths(settings.time_axis_path);
		const inquire_files: TFile[] = this.sortedPaths(settings.inquire_axis_path);

		// Collect frontlinks if needed (time to inquiry)
		if (settings.collect_links != 'back') {
			const forward_links = this.generateFrontLinks(time_files, inquire_files);
			_mergeWith(final_links, forward_links, this.mergeCustomizer);
		}

		// Collect backlinks if needed (inquiry to time)
		if (settings.collect_links != 'front') {
			const back_links = this.generateBackLinks(time_files, inquire_files);
			_mergeWith(final_links, back_links, this.mergeCustomizer);
		}

		console.debug("Final links", final_links);

		// Assemble a map inquire_axis -> time_data
		// time_data has aggregates and a map time_axis -> count
		const maps: TableDataPerInquiry[] = inquire_files.map(file => {
			let res: TableDataPerInquiry = {
				inquiry_file: file,
				counts: final_links[file.path] ?? {},
			};
			// Also do some aggregates
			const keys = Object.keys(res.counts);
			if (keys.length > 0) {
				if (settings.include_first) {
					res.first_seen = this.safeFileFromPath(keys[0]);
				}
				if (settings.include_last) {
					res.last_seen = this.safeFileFromPath(keys[keys.length - 1]);
				}
			}
			return res;
		});

		console.debug(maps);

		return {
			time_files,
			maps
		};
	}
}
