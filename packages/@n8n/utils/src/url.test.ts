import { describe, expect, it } from 'vitest';

import { removeTrailingSlash } from './url';

describe('removeTrailingSlash', () => {
	it('removes a single trailing slash', () => {
		expect(removeTrailingSlash('https://example.com/')).toBe('https://example.com');
	});

	it('leaves strings without trailing slash unchanged', () => {
		expect(removeTrailingSlash('https://example.com')).toBe('https://example.com');
	});

	it('only removes one trailing slash', () => {
		expect(removeTrailingSlash('https://example.com//')).toBe('https://example.com/');
	});

	it('handles empty string', () => {
		expect(removeTrailingSlash('')).toBe('');
	});

	it('handles root slash', () => {
		expect(removeTrailingSlash('/')).toBe('');
	});
});
