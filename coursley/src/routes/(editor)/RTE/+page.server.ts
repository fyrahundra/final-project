import type { Actions, ServerLoad } from '@sveltejs/kit';
import { assignmentTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
    
export const load: ServerLoad = async ({ params }) => {
    const assignment = await db.select().from(assignmentTable).where(eq(assignmentTable.id, String(params.assignment)));
    return {
        assignment: assignment[0]
    };
};

export const actions: Actions = {
    changeTitle: async ({ request }) => {
        const formData = await request.formData();
        const title = formData.get('title');
        const id = formData.get('id');

        const assignment = await db.update(assignmentTable)
            .set({ title: String(title) })
            .where(eq(assignmentTable.id, String(id)))
            .returning();
    }
};