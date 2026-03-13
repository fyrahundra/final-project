import { validateSession } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

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
