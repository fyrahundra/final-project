import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { publishThemeChanged } from '$lib/server/theme-stream';

export const POST: RequestHandler = async ({ request, locals }) => {
    const formData = await request.formData();
    const theme = formData.get('theme');

    if (!locals.user) {
        return json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    if (theme !== 'light' && theme !== 'dark') {
        return json({ success: false, message: 'Invalid theme' }, { status: 400 });
    }

    await db
        .update(userTable)
        .set({ theme })
        .where(eq(userTable.id, locals.user.id))
        .execute();

    locals.user.theme = theme;
    await publishThemeChanged({ userId: locals.user.id, theme });

    return json({ success: true, message: 'Theme updated successfully', theme });
};