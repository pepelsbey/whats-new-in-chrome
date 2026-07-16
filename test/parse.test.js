import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SOURCES } from '../src/config.js';
import {
	cleanTitle,
	decodeEntities,
	extractLastUpdated,
	getMeta,
	normalizeWhitespace,
	parsePage,
} from '../src/parse.js';
import { blogHtml, incompleteHtml, releaseNotesHtml } from './fixtures.js';

const releaseNotesSource = SOURCES.find((s) => s.id === 'release-notes');
const blogSource = SOURCES.find((s) => s.id === 'blog');

test('decodeEntities handles named and numeric entities', () => {
	assert.equal(decodeEntities('a &amp; b'), 'a & b');
	assert.equal(decodeEntities('&nbsp;x&nbsp;'), ' x ');
	assert.equal(decodeEntities('&#39;quote&#39;'), "'quote'");
	assert.equal(decodeEntities('&#x2F;slash'), '/slash');
	assert.equal(decodeEntities('no entities'), 'no entities');
});

test('decodeEntities collapses double-encoded entities', () => {
	// Older blog descriptions arrive as "there&amp;#39;s".
	assert.equal(decodeEntities('there&amp;#39;s'), "there's");
	assert.equal(decodeEntities('a &amp;amp; b'), 'a & b');
});

test('normalizeWhitespace collapses and trims', () => {
	assert.equal(normalizeWhitespace('  a   b\n\tc '), 'a b c');
});

test('getMeta reads property and name meta tags', () => {
	assert.equal(
		getMeta(releaseNotesHtml, 'og:description'),
		'CSS text-fit property, background-clip border-area, Focusgroup, and more.',
	);
	assert.equal(getMeta(releaseNotesHtml, 'missing'), null);
});

test('cleanTitle strips the breadcrumb suffix', () => {
	assert.equal(
		cleanTitle('Chrome 150 | Release notes | Chrome for Developers'),
		'Chrome 150',
	);
	assert.equal(cleanTitle(getMeta(blogHtml, 'og:title')), 'New in Chrome 150');
	assert.equal(cleanTitle(null), null);
});

test('extractLastUpdated returns an ISO timestamp', () => {
	assert.equal(extractLastUpdated(releaseNotesHtml), '2026-06-30T00:00:00Z');
	assert.equal(extractLastUpdated('no date here'), null);
});

test('parsePage builds a release-notes entry', () => {
	const entry = parsePage(releaseNotesHtml, {
		version: 150,
		source: releaseNotesSource,
		url: 'https://developer.chrome.com/release-notes/150',
	});
	assert.deepEqual(entry, {
		sourceId: 'release-notes',
		category: 'Release notes',
		version: 150,
		title: 'Chrome 150 release notes',
		summary:
			'CSS text-fit property, background-clip border-area, Focusgroup, and more.',
		url: 'https://developer.chrome.com/release-notes/150',
		updated: '2026-06-30T00:00:00Z',
	});
});

test('parsePage builds a blog entry with the native title', () => {
	const url = 'https://developer.chrome.com/blog/new-in-chrome-150';
	const entry = parsePage(blogHtml, { version: 150, source: blogSource, url });
	assert.equal(entry.title, 'New in Chrome 150');
	assert.equal(entry.url, url);
	assert.equal(
		entry.summary,
		'CSS text-fit property, Focusgroup declarative keyboard navigation & more.',
	);
});

test('parsePage returns null when required data is missing', () => {
	assert.equal(
		parsePage(incompleteHtml, {
			version: 1,
			source: blogSource,
			url: 'https://example.com/x',
		}),
		null,
	);
});
