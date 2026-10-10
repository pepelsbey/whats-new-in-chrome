// Pure HTML/text parsing helpers. No network access, so these are easy to test.

const NAMED_ENTITIES = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
};

function decodeOnce(text) {
	return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
		if (entity[0] === '#') {
			const codePoint =
				entity[1] === 'x' || entity[1] === 'X'
					? parseInt(entity.slice(2), 16)
					: parseInt(entity.slice(1), 10);
			return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
		}
		const named = NAMED_ENTITIES[entity.toLowerCase()];
		return named === undefined ? match : named;
	});
}

/**
 * Decode the HTML entities that appear in Chrome’s meta tags to plain text,
 * including numeric ones like &#39; and &#x2F;. Some older blog descriptions
 * are double-encoded (e.g. "&amp;#39;"), so decode repeatedly until stable,
 * with a small bound to guarantee termination.
 */
export function decodeEntities(text) {
	let current = text;
	for (let pass = 0; pass < 3; pass++) {
		const next = decodeOnce(current);
		if (next === current) break;
		current = next;
	}
	return current;
}

/** Collapse runs of whitespace and trim. */
export function normalizeWhitespace(text) {
	return text.replace(/\s+/g, ' ').trim();
}

/**
 * Read the content of a <meta property="..."> or <meta name="..."> tag.
 * Returns the decoded, whitespace-normalized value or null.
 */
export function getMeta(html, property) {
	const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(
		`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
		'i',
	);
	const tag = html.match(pattern)?.[0];
	if (!tag) return null;
	const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
	if (content == null) return null;
	return normalizeWhitespace(decodeEntities(content));
}

/**
 * Turn an og:title like "Chrome 150 | Release notes | Chrome for Developers"
 * into just "Chrome 150" by dropping the breadcrumb suffix.
 */
export function cleanTitle(ogTitle) {
	if (!ogTitle) return null;
	return normalizeWhitespace(ogTitle.split('|')[0]);
}

/**
 * Extract the "Last updated YYYY-MM-DD UTC" date the docs footer renders.
 * Returns an ISO 8601 UTC timestamp (midnight) or null.
 */
export function extractLastUpdated(html) {
	const match = html.match(/Last updated (\d{4}-\d{2}-\d{2}) UTC/i);
	if (!match) return null;
	return `${match[1]}T00:00:00Z`;
}

const MONTHS = [
	'january', 'february', 'march', 'april', 'may', 'june',
	'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * Extract the "Scheduled Stable Release October 6, 2026" date chromestatus
 * renders under the page title. Returns an ISO 8601 UTC timestamp (midnight)
 * or null.
 */
export function extractStableRelease(html) {
	const match = html.match(
		/Scheduled Stable Release\s+([a-z]+)\s+(\d{1,2}),\s+(\d{4})/i,
	);
	if (!match) return null;
	const month = MONTHS.indexOf(match[1].toLowerCase());
	if (month === -1) return null;
	const date = new Date(Date.UTC(Number(match[3]), month, Number(match[2])));
	return date.toISOString().replace('.000Z', 'Z');
}

/**
 * Summarize a chromestatus release notes page by its first few feature names,
 * in the style of the developer.chrome.com descriptions. Returns null when the
 * page lists no features.
 */
export function extractFeatureSummary(html, limit = 3) {
	const pattern = /<a[^>]+class="feature-name"[^>]*>([^<]*)<\/a>/gi;
	const names = [...html.matchAll(pattern)]
		.map((match) => normalizeWhitespace(decodeEntities(match[1])))
		.filter(Boolean);
	if (names.length === 0) return null;
	if (names.length <= limit) return names.join(', ') + '.';
	return names.slice(0, limit).join(', ') + ', and more.';
}

/**
 * Build a feed entry from a fetched page. `url` is the page’s clean, canonical
 * URL (the caller already knows it). Returns null when the page is missing the
 * title or date we need — which signals the page markup changed rather than a
 * normal "not an entry" case.
 */
export function parsePage(html, { version, source, url }) {
	const title = cleanTitle(getMeta(html, 'og:title'));
	if (!title) return null;

	const updated = source.date(html);
	if (!updated) return null;

	return {
		sourceId: source.id,
		category: source.category,
		version,
		title: `${source.label}: ${source.title(title)}`,
		summary: source.summary?.(html) ?? getMeta(html, 'og:description') ?? '',
		url,
		updated,
	};
}
