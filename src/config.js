// Central configuration for the feed generator.

import {
	extractFeatureSummary,
	extractLastUpdated,
	extractStableRelease,
} from './parse.js';

const DEVELOPER_ORIGIN = 'https://developer.chrome.com';
const CHROMESTATUS_ORIGIN = 'https://chromestatus.com';

// developer.chrome.com serves localized variants of a page non-deterministically
// (a plain request can come back in any language). Forcing the English locale
// makes both the title and the "Last updated" date stable across runs.
const DEVELOPER_QUERY = '?hl=en';

// Where the generated feed, its home page, and its icons are published.
const SITE_URL = 'https://pepelsbey.github.io/whats-new-in-chrome';

// The home page, linked as the feed’s alternate. Some feed readers look for
// icons there instead of in the feed.
export const FEED_HOME = `${SITE_URL}/`;

// Used for the feed id and self link.
export const FEED_URL = `${SITE_URL}/feed.xml`;

// Square icon that feed readers show next to the feed.
export const FEED_ICON = `${SITE_URL}/apple-touch-icon.png`;

export const FEED_TITLE = "What’s new in Chrome";
export const FEED_SUBTITLE =
	'Chrome release notes and “New in Chrome” blog posts, combined into one feed.';
export const FEED_AUTHOR = 'Google Chrome';

// Chrome versions are probed as integers. Nothing older than this floor is
// ever included, which keeps the daily scan bounded.
export const FIRST_VERSION = 100;

// Once inside the existing range, stop scanning upward after this many
// consecutive missing versions. This lets the top of the range grow
// automatically as new Chrome versions ship, without hardcoding the current
// version, while tolerating the occasional skipped version.
export const GAP_TOLERANCE = 5;

// Hard upper bound for the version scan, as an offset above FIRST_VERSION.
// Only reached if a source stops responding entirely; keeps the daily job from
// probing unbounded. FIRST_VERSION + 200 covers well over a decade of releases.
export const MAX_VERSION_OFFSET = 200;

// Maximum number of entries kept in the feed (most recent first).
export const MAX_ITEMS = 30;

// How many probes/fetches to run at once.
export const CONCURRENCY = 8;

// The sources. Each maps a Chrome version number to a page URL, turns the
// page’s raw <og:title> into a clean feed entry title, and reads the entry date.
// Every entry title starts with the source’s label, so readers can tell where
// it comes from: "Chrome Status: Chrome 155".
// Entries dated in the future (upcoming releases) are left out.
export const SOURCES = [
	{
		id: 'release-notes',
		category: 'Release notes',
		label: 'Release notes',
		origin: DEVELOPER_ORIGIN,
		query: DEVELOPER_QUERY,
		path: (version) => `/release-notes/${version}`,
		// og:title already reads "Chrome 150".
		title: (cleanTitle) => cleanTitle,
		date: extractLastUpdated,
	},
	{
		id: 'blog',
		category: 'Blog',
		label: 'Blog',
		origin: DEVELOPER_ORIGIN,
		query: DEVELOPER_QUERY,
		path: (version) => `/blog/new-in-chrome-${version}`,
		// og:title already reads "New in Chrome 150".
		title: (cleanTitle) => cleanTitle,
		date: extractLastUpdated,
	},
	{
		id: 'chromestatus',
		category: 'Release notes',
		label: 'Chrome Status',
		origin: CHROMESTATUS_ORIGIN,
		query: '',
		// Versions without a page here redirect to developer.chrome.com, which
		// version probing treats as missing.
		path: (version) => `/release-notes/${version}`,
		// og:title reads "Chrome 155 Release Notes" -> "Chrome 155".
		title: (cleanTitle) => cleanTitle.replace(/\s*release notes$/i, ''),
		// Pages exist ahead of time for upcoming milestones and only carry the
		// scheduled stable release date.
		date: extractStableRelease,
		// og:description is the same boilerplate on every page.
		summary: extractFeatureSummary,
		// Only fill in versions the developer.chrome.com release notes don’t have.
		fallbackFor: 'release-notes',
	},
];
