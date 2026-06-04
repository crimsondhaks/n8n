/**
 * Type guard for plain objects suitable for key-based traversal/serialization.
 *
 * Returns `true` for objects whose prototype is `Object.prototype` (object literals)
 * or `null` (`Object.create(null)`), and `false` for arrays, `Date`, `Map`, `Set`,
 * class instances, and other non-plain objects.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object') return false;
	if (Array.isArray(value)) return false;
	if (Object.prototype.toString.call(value) !== '[object Object]') return false;

	return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}
