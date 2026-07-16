import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAtom, escapeXml, sortEntries } from '../src/atom.js';

const sample = [
	{
		sourceId: 'release-notes',
		category: 'Release notes',
		version: 150,
		title: 'Chrome 150 release notes',
		summary: 'A & B < C',
		url: 'https://developer.chrome.com/release-notes/150',
		updated: '2026-06-30T00:00:00Z',
	},
	{
		sourceId: 'blog',
		category: 'Blog',
		version: 149,
		title: 'New in Chrome 149',
		summary: '',
		url: 'https://developer.chrome.com/blog/new-in-chrome-149',
		updated: '2026-05-27T00:00:00Z',
	},
];

test('escapeXml escapes all five entities', () => {
	assert.equal(escapeXml(`<a href="x" y='z'>&`), '&lt;a href=&quot;x&quot; y=&apos;z&apos;&gt;&amp;');
});

test('sortEntries orders newest-first with deterministic tie-breaks', () => {
	const tie = [
		{ updated: '2026-06-30T00:00:00Z', version: 150, sourceId: 'release-notes' },
		{ updated: '2026-06-30T00:00:00Z', version: 150, sourceId: 'blog' },
		{ updated: '2026-06-30T00:00:00Z', version: 151, sourceId: 'blog' },
		{ updated: '2026-01-01T00:00:00Z', version: 200, sourceId: 'blog' },
	];
	const sorted = sortEntries(tie);
	assert.deepEqual(
		sorted.map((e) => [e.version, e.sourceId]),
		[
			[151, 'blog'],
			[150, 'blog'],
			[150, 'release-notes'],
			[200, 'blog'],
		],
	);
});

test('buildAtom produces a well-formed document', () => {
	const xml = buildAtom(sortEntries(sample));
	assert.match(xml, /^<\?xml version="1.0" encoding="utf-8"\?>/);
	assert.match(xml, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
	// Feed-level updated uses the newest entry.
	assert.match(xml, /<updated>2026-06-30T00:00:00Z<\/updated>/);
	// Two entries, escaped summary, no empty summary element for the blog entry.
	assert.equal((xml.match(/<entry>/g) ?? []).length, 2);
	assert.match(xml, /<summary type="text">A &amp; B &lt; C<\/summary>/);
	assert.match(xml, /<id>https:\/\/developer\.chrome\.com\/release-notes\/150<\/id>/);
	assert.match(xml, /<link rel="self"[^>]+feed\.xml"\/>/);
});

test('buildAtom handles an empty feed with a fallback timestamp', () => {
	const xml = buildAtom([]);
	assert.match(xml, /<updated>1970-01-01T00:00:00Z<\/updated>/);
	assert.equal((xml.match(/<entry>/g) ?? []).length, 0);
});
