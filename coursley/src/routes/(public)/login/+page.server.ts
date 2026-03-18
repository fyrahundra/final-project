import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { sessionTable, userTable } from '$lib/server/db/schema'; // adjust import path as needed
import { getUserByName } from '$lib/server/db/query';
import argon2 from 'argon2';
import { createSession, destroySession, detectSuspiciousActivity } from '$lib/server/auth';

export const load: ServerLoad = async ({ locals }) => {
	// Your load function logic here
	try {
		const users = await db.select().from(userTable).execute();
		const sessions = await db.select().from(sessionTable).execute();
		return { users: users, sessions: sessions, user: locals.user, session: locals.session };
	} catch (error) {
		console.error('Error loading users:', error);
		return { users: [], user: locals.user, session: null, sessions: [] };
	}
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const userName = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (!userName || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		try {
			const users = await getUserByName(userName);
			if (users.length === 0) {
				return fail(400, { error: 'Invalid username or password' });
			}
			const user = users[0];
			const valid = await argon2.verify(user.passwordHash, password);
			if (!valid) {
				return fail(400, { error: 'Invalid username or password' });
			}

			let userAgent = request.headers.get('user-agent') || 'unknown';
			let clientAddress = getClientAddress();

			// Create session and set cookie
			const session = await createSession(user.id, clientAddress, userAgent, 14);
			if (!session) {
				return fail(500, { error: 'Failed to create session' });
			}
			await detectSuspiciousActivity(user.id);
			cookies.set('session_token', session.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});
		} catch (error) {
			console.error('Error logging in user:', error);
			return fail(400, { error: 'Invalid username or password' });
		}

		throw redirect(302, '/courses');
	},
	logout: async ({ cookies, locals }) => {
		if (locals.session) {
			await destroySession(locals.session.token);
		}
		locals.user = null;
		locals.session = null;
		cookies.delete('session_token', { path: '/' });

		throw redirect(302, '/login');
	}
};
