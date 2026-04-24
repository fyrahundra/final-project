import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { issueEntryToken, type EditorTarget } from '$lib/server/entry-token';

const TARGET_PATH: Record<EditorTarget, string> = {
	RTE: '/RTE',
	code_editor: '/code_editor'
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, message: 'User not authenticated' }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as
		| {
				target?: EditorTarget;
				params?: Record<string, string>;
		  }
		| null;

	const target = body?.target;
	if (!target || (target !== 'RTE' && target !== 'code_editor')) {
		return json({ success: false, message: 'Invalid editor target' }, { status: 400 });
	}

	const params = body?.params ?? {};
	const allowedKeys = new Set(['id', 'view', 'mode', 'templateId']);
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (!allowedKeys.has(key)) {
			continue;
		}
		if (!value) {
			continue;
		}
		search.set(key, value);
	}

	const targetId = search.get('id') || search.get('templateId') || null;
	const { token } = await issueEntryToken({
		userId: locals.user.id,
		target,
		targetId
	});

	search.set('entry', token);
	const url = `${TARGET_PATH[target]}?${search.toString()}`;

	return json({ success: true, url });
};
