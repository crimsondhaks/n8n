/**
 * Strips a single trailing `/` from the given path or URL string.
 */
export function removeTrailingSlash(path: string): string {
	return path.endsWith('/') ? path.slice(0, -1) : path;
}
