// Entry point: discover versions, fetch pages, build feed.xml.

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAtom, sortEntries } from './atom.js';
import {
	CONCURRENCY,
	CONTENT_QUERY,
	FIRST_VERSION,
	MAX_ITEMS,
	SITE_ORIGIN,
	SOURCES,
} from './config.js';
import { discoverVersions, fetchPage, mapLimit } from './fetch.js';
import { parsePage } from './parse.js';

const OUTPUT_FILE = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'feed.xml',
);

async function collectSource(source) {
	const versions = await discoverVersions(source, FIRST_VERSION);
	console.log(
		`  ${source.id}: found ${versions.length} version(s)` +
			(versions.length ? ` (${versions[0]}–${versions.at(-1)})` : ''),
	);

	// Only fetch the pages we might actually keep.
	const recent = versions.slice(-MAX_ITEMS);
	const entries = await mapLimit(recent, CONCURRENCY, async (version) => {
		const url = SITE_ORIGIN + source.path(version);
		const html = await fetchPage(url + CONTENT_QUERY);
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
	});

	return entries.filter(Boolean);
}

async function generate() {
	console.log('Generating feed…');

	const perSource = await Promise.all(SOURCES.map(collectSource));
	const entries = sortEntries(perSource.flat()).slice(0, MAX_ITEMS);

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
