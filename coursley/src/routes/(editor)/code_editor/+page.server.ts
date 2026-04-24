import type { ServerLoad } from "@sveltejs/kit";

const editorName = 'code_editor';

export const load: ServerLoad = async ({ url, locals }) => {
    const mode = url.searchParams.get('mode');
    const templateId = url.searchParams.get('templateId');

    if (!locals.user) {
        return {
            user: null,
            isTemplate: false,
            templateId: null
        }
    }

    return {
        user: locals.user,
        isTemplate: mode === 'template',
        templateId: templateId ?? null
    }
};