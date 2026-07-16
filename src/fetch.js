// Network access: version discovery and page fetching.

import {
	CONCURRENCY,
	GAP_TOLERANCE,
	MAX_VERSION_OFFSET,
	SITE_ORIGIN,
} from './config.js';

const USER_AGENT =
	'whats-new-in-chrome-feed (+https://github.com/pepelsbey/whats-new-in-chrome)';

// Statuses worth retrying: rate limiting and transient server errors. A 404 is
// a definitive answer (used by version probing) and is never retried.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const RETRIES = 4;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with exponential backoff on transient failures (network errors, rate
 * limiting, 5xx). This matters for determinism: under concurrency the server
 * occasionally returns a transient error for a page we know exists, and
 * silently dropping it would make the feed’s contents flap between runs. On
 * persistent failure this throws, so the build fails loudly rather than
 * publishing a feed with entries missing.
 */
async function request(url, { method = 'GET', retries = RETRIES } = {}) {
	let lastError;
	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			// 250ms, 500ms, 1s, 2s… plus jitter to avoid a thundering herd.
			const backoff = 250 * 2 ** (attempt - 1);
			await sleep(backoff + Math.floor(Math.random() * 100));
		}
		try {
			const response = await fetch(url, {
				method,
				headers: { 'user-agent': USER_AGENT },
				redirect: 'follow',
			});
			if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
				lastError = new Error(`HTTP ${response.status} for ${url}`);
				continue;
			}
			return response;
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

/** Run tasks with a bounded concurrency, preserving input order in results. */
async function mapLimit(items, limit, task) {
	const results = new Array(items.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
		(async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await task(items[index], index);
			}
		})(),
	);
	await Promise.all(workers);
	return results;
}

/** True if a version page exists (HTTP 200), via a cheap HEAD request. */
async function versionExists(source, version) {
	const response = await request(SITE_ORIGIN + source.path(version), {
		method: 'HEAD',
	});
	return response.status === 200;
}

/**
 * Discover which versions of a source exist by scanning upward from
 * `firstVersion` in concurrent batches. A source’s pages start at some version
 * and run contiguously to the newest one, so we ignore missing versions until
 * the first hit, then stop once `GAP_TOLERANCE` versions in a row are missing.
 * A hard ceiling bounds the scan if the source stops responding entirely.
 */
export async function discoverVersions(source, firstVersion) {
	const ceiling = firstVersion + MAX_VERSION_OFFSET;
	const found = [];
	let version = firstVersion;
	let misses = 0;

	while (version <= ceiling) {
		const batch = Array.from({ length: CONCURRENCY }, (_, i) => version + i);
		const exists = await mapLimit(batch, CONCURRENCY, (v) =>
			versionExists(source, v),
		);

		for (let i = 0; i < batch.length; i++) {
			if (exists[i]) {
				found.push(batch[i]);
				misses = 0;
			} else if (found.length > 0) {
				// Only count gaps once we're inside the existing range, so the
				// unused version numbers below a source’s first release don't end
				// the scan prematurely.
				misses++;
			}
		}

		if (found.length > 0 && misses >= GAP_TOLERANCE) break;
		version += CONCURRENCY;
	}

	return found;
}

/** Fetch a page’s HTML. Returns null on a non-200 response. */
export async function fetchPage(url) {
	const response = await request(url);
	if (response.status !== 200) return null;
	return response.text();
}

export { mapLimit };
