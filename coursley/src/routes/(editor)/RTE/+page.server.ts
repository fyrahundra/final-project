import type { Actions, ServerLoad } from '@sveltejs/kit';
import { assignmentTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
    
export const load: ServerLoad = async ({ url }) => {
    const assignmentId = url.searchParams.get('id');
    if (!assignmentId) {
        return { assignment: null };
    }
    const assignment = await db
        .select()
        .from(assignmentTable)
        .where(eq(assignmentTable.id, assignmentId))
        .execute();
    return {
        assignment: assignment[0]
    };
};

export const actions: Actions = {
    changeTitle: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const id = formData.get('id');

        try {
            const [assignment] = await db.update(assignmentTable)
                .set({ contentTitle: String(title) })
                .where(eq(assignmentTable.id, String(id)))
                .returning();
            return { success: true, assignment: assignment };
        } catch (error) {
            console.error('Error updating title:', error);
            return { success: false, error: 'Failed to update title' };
        }
    },

    saveDocument: async ({ request }) => {
        const formData = await request.formData();
        const content = formData.get('content');
        const id = formData.get('id');
        
        try {
            const [assignment] = await db.update(assignmentTable)
                .set({ content: String(content) })
                .where(eq(assignmentTable.id, String(id)))
                .returning();
            return { success: true, assignment: assignment };
        } catch (error) {
            console.error('Error saving document:', error);
            return { success: false, error: 'Failed to save document' };
        }
    }
};