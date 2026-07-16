import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mapLimit } from '../src/fetch.js';

test('mapLimit preserves input order', async () => {
	const input = [5, 4, 3, 2, 1];
	const out = await mapLimit(input, 2, async (n) => {
		await new Promise((resolve) => setTimeout(resolve, n));
		return n * 10;
	});
	assert.deepEqual(out, [50, 40, 30, 20, 10]);
});

test('mapLimit respects the concurrency limit', async () => {
	let active = 0;
	let peak = 0;
	const input = Array.from({ length: 20 }, (_, i) => i);
	await mapLimit(input, 3, async () => {
		active++;
		peak = Math.max(peak, active);
		await new Promise((resolve) => setTimeout(resolve, 1));
		active--;
	});
	assert.ok(peak <= 3, `peak concurrency ${peak} exceeded limit`);
});

test('mapLimit handles an empty list', async () => {
	assert.deepEqual(await mapLimit([], 4, async (x) => x), []);
});
