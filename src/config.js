// Central configuration for the feed generator.

export const SITE_ORIGIN = 'https://developer.chrome.com';

// developer.chrome.com serves localized variants of a page non-deterministically
// (a plain request can come back in any language). Forcing the English locale
// makes both the title and the "Last updated" date stable across runs.
export const CONTENT_QUERY = '?hl=en';

// Where the generated feed is published. Used for the feed id and self link.
export const FEED_URL =
	'https://pepelsbey.github.io/whats-new-in-chrome/feed.xml';
export const SITE_URL = 'https://pepelsbey.github.io/whats-new-in-chrome/';

export const FEED_TITLE = "What’s new in Chrome";
export const FEED_SUBTITLE =
	'Chrome release notes and “New in Chrome” blog posts, combined into one feed.';
export const FEED_AUTHOR = 'developer.chrome.com';

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

// The two sources. Each maps a Chrome version number to a page URL and turns
// the page’s raw <og:title> into a clean feed entry title.
export const SOURCES = [
	{
		id: 'release-notes',
		category: 'Release notes',
		path: (version) => `/release-notes/${version}`,
		// og:title looks like "Chrome 150" -> keep as-is, add a suffix so the
		// entry is distinguishable from the blog post for the same version.
		title: (cleanTitle) => `${cleanTitle} release notes`,
	},
	{
		id: 'blog',
		category: 'Blog',
		path: (version) => `/blog/new-in-chrome-${version}`,
		// og:title already reads "New in Chrome 150".
		title: (cleanTitle) => cleanTitle,
	},
];
