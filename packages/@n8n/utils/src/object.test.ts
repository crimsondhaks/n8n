import { describe, expect, it } from 'vitest';

import { isObject } from './object';

describe('isObject', () => {
	it('returns true for plain object literals', () => {
		expect(isObject({})).toBe(true);
		expect(isObject({ a: 1 })).toBe(true);
	});

	it('returns true for Object.create(null)', () => {
		expect(isObject(Object.create(null))).toBe(true);
	});

	it('returns false for arrays', () => {
		expect(isObject([])).toBe(false);
		expect(isObject([1, 2])).toBe(false);
	});

	it('returns false for null and undefined', () => {
		expect(isObject(null)).toBe(false);
		expect(isObject(undefined)).toBe(false);
	});

	it('returns false for primitives', () => {
		expect(isObject(42)).toBe(false);
		expect(isObject('string')).toBe(false);
		expect(isObject(true)).toBe(false);
	});

	it('returns false for Date, Map, Set instances', () => {
		expect(isObject(new Date())).toBe(false);
		expect(isObject(new Map())).toBe(false);
		expect(isObject(new Set())).toBe(false);
	});

	it('returns false for class instances', () => {
		class Foo {}
		expect(isObject(new Foo())).toBe(false);
	});
});
