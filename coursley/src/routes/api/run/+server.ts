import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

type RunnerResult = {
	stdout?: string;
	stderr?: string;
	error?: string;
	plots?: string[];
	exit_code?: number;
};

function resolveRunnerUrl() {
	if (!env.PYTHON_RUN_API_URL) {
		if (dev) {
			return 'http://localhost:8000/run';
		}

		throw new Error('PYTHON_RUN_API_URL is not set');
	}

	return env.PYTHON_RUN_API_URL;
}

export const POST: RequestHandler = async ({ request }) => {
	let payload: { code?: unknown };

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	if (typeof payload.code !== 'string') {
		return json({ error: 'Missing code' }, { status: 400 });
	}

	try {
		const response = await fetch(resolveRunnerUrl(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code: payload.code })
		});

		const rawBody = await response.text();
		let body: RunnerResult;
		try {
			body = JSON.parse(rawBody) as RunnerResult;
		} catch {
			return json({ error: 'Invalid response from code runner' }, { status: 502 });
		}

		return json(body, { status: response.status });
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to run code'
			},
			{ status: 502 }
		);
	}
};
