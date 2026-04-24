import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { consumeEntryToken, type EditorTarget } from '$lib/server/entry-token';

const EDITOR_ACCESS_COOKIE_PREFIX = 'editor_access_grant';

function createGrantCookieName(target: EditorTarget, targetId: string | null) {
    const encodedTargetId = encodeURIComponent(targetId ?? 'root');
    return `${EDITOR_ACCESS_COOKIE_PREFIX}_${target}_${encodedTargetId}`;
}

function createGrantValue(userId: string, target: EditorTarget, targetId: string | null) {
    return `${userId}:${target}:${targetId ?? ''}`;
}

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const path = url.pathname;
    const target: EditorTarget | null =
        path === '/RTE' ? 'RTE' : path === '/code_editor' ? 'code_editor' : null;

    if (!target) {
        throw redirect(302, '/courses');
    }

    const targetId =
        url.searchParams.get('id')?.trim() || url.searchParams.get('templateId')?.trim() || null;
    const grantCookieName = createGrantCookieName(target, targetId);
    const expectedGrant = createGrantValue(locals.user.id, target, targetId);
    const existingGrant = cookies.get(grantCookieName);

    if (existingGrant !== expectedGrant) {
        const entryToken = url.searchParams.get('entry')?.trim();
        if (!entryToken) {
            throw redirect(302, '/courses');
        }

        const isValid = await consumeEntryToken({
            token: entryToken,
            userId: locals.user.id,
            target,
            targetId
        });

        if (!isValid) {
            throw redirect(302, '/courses');
        }

        cookies.set(grantCookieName, expectedGrant, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: url.protocol === 'https:'
        });
    }

    return {
        user: locals.user
    };
};