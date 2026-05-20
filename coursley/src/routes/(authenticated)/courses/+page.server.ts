import type { Actions } from './$types';
import { db } from '$lib/server/db/index';
import { adminRequestTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { publishAdminRequestChanged } from '$lib/server/stream';

export const actions: Actions = {
	handleInstructorRequest: async ({ request, locals }) => {
		const user = locals.user;
		const formData = await request.formData();
		const type = formData.get('type') as string;

		if (!user) {
			return { error: 'User not authenticated' };
		}
		try {
			const requestId = randomUUID();
			await db
				.insert(adminRequestTable)
				.values({
					id: requestId,
					userId: user.id,
					type: type,
					status: 'pending',
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.execute();

			// Publish event for real-time updates
			await publishAdminRequestChanged({
				event: 'created',
				requestId
			});

			return { success: 'Instructor access request submitted successfully' };
		} catch (error) {
			console.error('Error submitting instructor access request:', error);
			return { error: 'Failed to submit instructor access request' };
		}
	}
};
