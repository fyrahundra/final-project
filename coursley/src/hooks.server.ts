import { validateSession } from '$lib/server/auth';
import { pruneEntryTokens } from '$lib/server/entry-token';
import { pruneVerificationTokens } from '$lib/server/verification-token';
import type { Handle } from '@sveltejs/kit';

declare global {
	// eslint-disable-next-line no-var
	var __entryTokenPruneInterval: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__entryTokenPruneInterval) {
	void pruneEntryTokens();
	void pruneVerificationTokens();
	globalThis.__entryTokenPruneInterval = setInterval(() => {
		void pruneEntryTokens();
		void pruneVerificationTokens();
	}, 60_000);
	globalThis.__entryTokenPruneInterval.unref?.();
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session_token');

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const session = await validateSession(sessionToken);

	if (!session) {
		event.cookies.delete('session_token', { path: '/' });
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	event.locals.user = session.user;
	event.locals.session = session;

	return resolve(event);
};
