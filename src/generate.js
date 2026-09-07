// Entry point: discover versions, fetch pages, build feed.xml + index.html.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAtom, escapeXml, sortEntries } from './atom.js';
import {
	CONCURRENCY,
	CONTENT_QUERY,
	FEED_TITLE,
	FEED_URL,
	FIRST_VERSION,
	MAX_ITEMS,
	SITE_ORIGIN,
	SOURCES,
} from './config.js';
import { discoverVersions, fetchPage, mapLimit } from './fetch.js';
import { parsePage } from './parse.js';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

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

	const atom = buildAtom(entries);
	const index = renderIndex(entries);

	await mkdir(OUTPUT_DIR, { recursive: true });
	await writeFile(join(OUTPUT_DIR, 'feed.xml'), atom, 'utf8');
	await writeFile(join(OUTPUT_DIR, 'index.html'), index, 'utf8');

	console.log(
		`Wrote ${entries.length} entrie(s) to public/feed.xml (newest: ${entries[0].title}).`,
	);
}

function renderIndex(entries) {
	const items = entries
		.map(
			(entry) =>
				`\t\t\t<li>\n\t\t\t\t<a href="${escapeXml(entry.url)}">${escapeXml(entry.title)}</a>\n\t\t\t\t<time datetime="${entry.updated}">${entry.updated.slice(0, 10)}</time>\n\t\t\t</li>`,
		)
		.join('\n');

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>${FEED_TITLE}</title>
		<link rel="alternate" type="application/atom+xml" title="${FEED_TITLE}" href="${FEED_URL}">
		<style>
			body { font: 1rem/1.5 system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
			li { margin-block: 0.5rem; }
			time { color: #666; margin-inline-start: 0.5rem; font-variant-numeric: tabular-nums; }
		</style>
	</head>
	<body>
		<h1>${FEED_TITLE}</h1>
		<p>Chrome release notes and “New in Chrome” blog posts, combined. Subscribe to the <a href="feed.xml">Atom feed</a>.</p>
		<ul>
${items}
		</ul>
	</body>
</html>
`;
}

generate().catch((error) => {
	console.error(error);
	process.exit(1);
});
