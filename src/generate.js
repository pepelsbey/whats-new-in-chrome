// Entry point: discover versions, fetch pages, build feed.xml.

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAtom, mergeSources, sortEntries } from './atom.js';
import { CONCURRENCY, FIRST_VERSION, MAX_ITEMS, SOURCES } from './config.js';
import { discoverVersions, fetchPage, mapLimit } from './fetch.js';
import { parsePage } from './parse.js';

const OUTPUT_FILE = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'feed.xml',
);

async function fetchEntry(source, version) {
	const url = source.origin + source.path(version);
	const html = await fetchPage(url + source.query);
	if (!html) {
		console.warn(`  ! skipped ${source.id} ${version}: no page returned`);
		return null;
	}
	const entry = parsePage(html, { version, source, url });
	if (!entry) {
		console.warn(`  ! skipped ${source.id} ${version}: unrecognized markup`);
		return null;
	}
	return entry;
}

async function collectSource(source, now) {
	const versions = await discoverVersions(source, FIRST_VERSION);
	console.log(
		`  ${source.id}: found ${versions.length} version(s)` +
			(versions.length ? ` (${versions[0]}–${versions.at(-1)})` : ''),
	);

	// Walk newest-first in batches and stop once we have as many released
	// entries as we might keep. Some sources publish pages for upcoming
	// versions, so the newest pages aren’t necessarily entries yet.
	const entries = [];
	let end = versions.length;
	while (end > 0 && entries.length < MAX_ITEMS) {
		const batch = versions.slice(Math.max(0, end - CONCURRENCY), end);
		const results = await mapLimit(batch, CONCURRENCY, (version) =>
			fetchEntry(source, version),
		);
		entries.push(...results.filter((entry) => entry && entry.updated <= now));
		end -= batch.length;
	}

	return entries;
}

async function generate() {
	console.log('Generating feed…');

	const now = new Date().toISOString();
	const perSource = await Promise.all(
		SOURCES.map((source) => collectSource(source, now)),
	);
	const entries = sortEntries(mergeSources(SOURCES, perSource)).slice(
		0,
		MAX_ITEMS,
	);

	if (entries.length === 0) {
		throw new Error('No feed entries were collected; refusing to write feed.');
	}

	await writeFile(OUTPUT_FILE, buildAtom(entries), 'utf8');

	console.log(
		`Wrote ${entries.length} entrie(s) to feed.xml (newest: ${entries[0].title}).`,
	);
}

generate().catch((error) => {
	console.error(error);
	process.exit(1);
});
