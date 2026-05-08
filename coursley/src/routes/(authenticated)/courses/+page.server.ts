import type { Actions } from "./$types";
import { db } from "$lib/server/db/index";
import { adminRequestTable } from "$lib/server/db/schema";
import { randomUUID } from "crypto";

export const actions: Actions = {
    handleInstructorRequest: async ({ request, locals }) => {
        const user = locals.user;
        const formData = await request.formData();
        const type = formData.get("type") as string;

        if (!user) {
            return { error: 'User not authenticated' };
        }
        try {
            await db.insert(adminRequestTable).values({
                id: randomUUID(),
                userId: user.id,
                type: type,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }).execute();
            return { success: 'Instructor access request submitted successfully' };
        } catch (error) {
            console.error('Error submitting instructor access request:', error);
            return { error: 'Failed to submit instructor access request' };
        }
    }
};

