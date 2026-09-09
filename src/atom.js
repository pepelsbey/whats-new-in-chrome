// Atom 1.0 feed serialization. Pure functions, no network.

import {
	FEED_AUTHOR,
	FEED_SUBTITLE,
	FEED_TITLE,
	FEED_URL,
} from './config.js';

/** Escape text for use in XML character data / attribute values. */
export function escapeXml(text) {
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Sort entries newest-first. Ties (same day) are broken by version, then by
 * source id, so the output is fully deterministic for the same input.
 */
export function sortEntries(entries) {
	return [...entries].sort((a, b) => {
		if (a.updated !== b.updated) return a.updated < b.updated ? 1 : -1;
		if (a.version !== b.version) return b.version - a.version;
		return a.sourceId < b.sourceId ? -1 : 1;
	});
}

function renderEntry(entry) {
	const summary = entry.summary
		? `\n\t\t<summary type="text">${escapeXml(entry.summary)}</summary>`
		: '';

	return `	<entry>
		<title>${escapeXml(entry.title)}</title>
		<link rel="alternate" type="text/html" href="${escapeXml(entry.url)}"/>
		<id>${escapeXml(entry.url)}</id>
		<updated>${escapeXml(entry.updated)}</updated>
		<published>${escapeXml(entry.updated)}</published>
		<category term="${escapeXml(entry.category)}"/>${summary}
	</entry>`;
}

/**
 * Build the full Atom document. `entries` should already be filtered/sorted
 * newest-first. `updated` is the feed-level timestamp (defaults to the newest
 * entry, or the Unix epoch when the feed is empty).
 */
export function buildAtom(entries, { updated } = {}) {
	const feedUpdated = updated ?? entries[0]?.updated ?? '1970-01-01T00:00:00Z';
	const body = entries.length
		? entries.map(renderEntry).join('\n') + '\n'
		: '';

	return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>${escapeXml(FEED_TITLE)}</title>
	<subtitle>${escapeXml(FEED_SUBTITLE)}</subtitle>
	<id>${escapeXml(FEED_URL)}</id>
	<link rel="self" type="application/atom+xml" href="${escapeXml(FEED_URL)}"/>
	<updated>${escapeXml(feedUpdated)}</updated>
	<author>
		<name>${escapeXml(FEED_AUTHOR)}</name>
	</author>
${body}</feed>
`;
}
