import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const user = await requireAuth(locals, cookies);

	if (user.isAdmin == false) {
		throw error(403, 'Forbidden');
	}

	return { user };
};
