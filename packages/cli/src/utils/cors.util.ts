import type { Request, Response } from 'express';

/**
 * Apply permissive CORS headers for waiting-form and waiting-webhook responses.
 *
 * SECURITY NOTE: This deliberately allows any origin because waiting webhook
 * forms are always submitted cross-origin from a sandboxed iframe whose CSP
 * requires CORS. Do NOT use this utility for authenticated API endpoints or
 * any route that returns sensitive data — use `CorsService` with an explicit
 * allowlist instead.
 */
export function applyCors(req: Request, res: Response) {
	if (res.getHeader('Access-Control-Allow-Origin')) {
		return;
	}

	const origin = req.headers.origin;

	if (!origin || origin === 'null') {
		res.setHeader('Access-Control-Allow-Origin', '*');
	} else {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}

	res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
