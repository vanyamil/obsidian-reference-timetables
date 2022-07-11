import {TFile} from 'obsidian'

export type CountMap = Record<string, number>;
export type LinkMap = Record<string, CountMap>;
export type LinkDirection = 'front' | 'back' | 'both';

export type TableDataPerInquiry = {
	inquiry_file: TFile,
	counts: CountMap,
	first_seen?: TFile,
	last_seen?: TFile,
};

export type TableGenData = {
	maps: TableDataPerInquiry[],
	time_files: TFile[],
};

export type TableGenSettings = {
	time_axis_path: string,
	inquire_axis_path: string,
	collect_links: LinkDirection,
	include_first: boolean,
	include_last: boolean,
};