import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { adminRequestTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
    try {
        const adrequests = await db.query.adminRequestTable.findMany({
            with: {
                user: true
            },
            orderBy: (request, { desc }) => [desc(request.createdAt)]
        });
        return { adrequests };
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        throw new Error('Failed to fetch admin requests');
    }
};

export const actions: Actions = {
    approve: async ({ request }) => {
        const formData = await request.formData();
        const requestId = formData.get('requestId') as string;
        const userId = formData.get('userId') as string;
        try {
            // Update the request status to 'approved'
            await db.update(adminRequestTable)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(adminRequestTable.id, requestId))
                .execute();
            try {
                await db.update(userTable)
                    .set({role: 'instructor'})
                    .where(eq(userTable.id, userId))
                    .execute();
                try {
                    await db.delete(adminRequestTable)
                        .where(eq(adminRequestTable.id, requestId))
                        .execute();
                } catch (error) {
                    console.error('Error deleting request:', error);
                    return { error: 'Error deleting request: ' + (error instanceof Error ? error.message : String(error)) };
                }
            } catch (error) {
                console.error('Error updating user role:', error);
                return { error: 'Error updating user role: ' + (error instanceof Error ? error.message : String(error)) };
            }
            return { success: 'Request approved successfully' };
        } catch (error) {
            console.error('Error approving request:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            return { error: 'Failed to approve request: ' + errorMsg };
        }
    },
    reject: async ({ request }) => {
        const formData = await request.formData();
        const requestId = formData.get('requestId') as string;
        try {
            // Update the request status to 'rejected'
            await db.update(adminRequestTable)
                .set({ status: 'rejected', updatedAt: new Date() })
                .where(eq(adminRequestTable.id, requestId))
                .execute();
            try {
                await db.delete(adminRequestTable)
                    .where(eq(adminRequestTable.id, requestId))
                    .execute();
            } catch (deleteError) {
                console.error('Error deleting request:', deleteError);
                return { error: 'Error deleting request: ' + (deleteError instanceof Error ? deleteError.message : String(deleteError)) };
            }
            return { success: 'Request rejected successfully' };
        } catch (error) {
            console.error('Error rejecting request:', error);
            return { error: 'Failed to reject request: ' + (error instanceof Error ? error.message : String(error)) };
        }
    }
};