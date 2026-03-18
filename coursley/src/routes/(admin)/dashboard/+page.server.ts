import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const now = new Date();

	const activeSessions = await db.query.sessionTable.findMany({
		where: (session, { gt }) => gt(session.expiresAt, new Date()),
		with: { user: true },
		orderBy: (session, { desc }) => [desc(session.lastUsedAt)]
	});

	return { activeSessions };
};
