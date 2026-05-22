import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { hash } from 'argon2';
import { db } from '$lib/server/db/index';
import { userTable, sessionTable } from '$lib/server/db/schema';
import { createSession, detectSuspiciousActivity, validatePassword } from '$lib/server/auth';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';

export const load: ServerLoad = async ({ locals }) => {
	// Your load function logic here
	try {
		const users = await db.select().from(userTable).execute();
		const sessions = await db.select().from(sessionTable).execute();
		return { users: users, user: locals.user, session: locals.session, sessions: sessions };
	} catch (error) {
		console.error('Error loading users:', error);
		return { users: [], user: locals.user, session: null, sessions: [] };
	}
};

export const actions: Actions = {
	// Your action function logic here
	register: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Name, email, and password are required' });
		}

		const validationError = validatePassword(password, name, email);
		if (validationError.length > 0) {
			return fail(400, { error: validationError });
		}

		const passwordHash = await hash(password);

		if (!passwordHash) {
			return fail(500, { error: 'Failed to hash password' });
		}

		const userId = randomUUID();

		try {
			// Check for case-insensitive username/email collisions
			const existingUsers = await db
				.select()
				.from(userTable)
				.where(
					sql`(lower(${userTable.name}) = lower(${name}) OR lower(${userTable.email}) = lower(${email}))`
				)
				.execute();

			if (existingUsers.length > 0) {
				// Determine which field conflicts to give a clearer error
				const nameTaken = existingUsers.some(
					(u: any) => u.name && u.name.toLowerCase() === name.toLowerCase()
				);
				const emailTaken = existingUsers.some(
					(u: any) => u.email && u.email.toLowerCase() === email.toLowerCase()
				);
				if (nameTaken) return fail(400, { error: 'Username already in use' });
				if (emailTaken) return fail(400, { error: 'Email already in use' });
				return fail(400, { error: 'Name or email already in use' });
			}
			await db.insert(userTable).values({
				id: userId,
				name,
				email,
				passwordHash,
				role: 'student',
				createdAt: new Date()
			});

			const userAgent = request.headers.get('user-agent') || 'unknown';
			const clientAddress = request.headers.get('x-forwarded-for') || 'unknown';

			const session = await createSession(userId, clientAddress, userAgent, 14);
			if (!session) {
				return fail(500, { error: 'Failed to create session' });
			}
			await detectSuspiciousActivity(userId);
			cookies.set('session_token', session.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: false,
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});
		} catch (error) {
			console.error('Error creating user:', error);
			const message = error instanceof Error ? error.message : String(error);
			return fail(500, { error: `Failed to create user: ${message}` });
		}

		throw redirect(302, '/courses');
	}
};
