import type { Actions, ServerLoad } from '@sveltejs/kit';
import { assignmentTable, userAssignmentTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: ServerLoad = async ({ url }) => {
	const id = url.searchParams.get('id');
	const mode = url.searchParams.get('mode');
	const templateId = url.searchParams.get('templateId');

	// Template mode - no database lookup needed
	if (mode === 'template') {
		return {
			assignment: null,
			userAssignment: null,
			isTemplate: true,
			templateId: templateId
		};
	}

	if (!id) {
		return { assignment: null, userAssignment: null, isTemplate: false };
	}

	// Check if it's a user assignment (new flow) or regular assignment (legacy)
	const userAssignment = await db
		.select()
		.from(userAssignmentTable)
		.where(eq(userAssignmentTable.id, id))
		.execute();

	if (userAssignment.length > 0) {
		return {
			assignment: null,
			userAssignment: userAssignment[0],
			isTemplate: false
		};
	}

	// Fallback to legacy assignment table for backwards compatibility
	const assignment = await db
		.select()
		.from(assignmentTable)
		.where(eq(assignmentTable.id, id))
		.execute();

	return {
		assignment: assignment[0] || null,
		userAssignment: null,
		isTemplate: false
	};
};

export const actions: Actions = {
	changeTitle: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title');
		const id = formData.get('id');

		try {
			// Try to update user assignment first
			const userAssignment = await db
				.select()
				.from(userAssignmentTable)
				.where(eq(userAssignmentTable.id, String(id)))
				.execute();

			if (userAssignment.length > 0) {
				const [updated] = await db
					.update(userAssignmentTable)
					.set({
						contentTitle: String(title),
						updatedAt: new Date()
					})
					.where(eq(userAssignmentTable.id, String(id)))
					.returning();
				return { success: true, userAssignment: updated };
			}

			// Fallback to assignment table for legacy support
			const [assignment] = await db
				.update(assignmentTable)
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
			// Try to update user assignment first
			const userAssignment = await db
				.select()
				.from(userAssignmentTable)
				.where(eq(userAssignmentTable.id, String(id)))
				.execute();

			if (userAssignment.length > 0) {
				const [updated] = await db
					.update(userAssignmentTable)
					.set({
						content: String(content),
						updatedAt: new Date()
					})
					.where(eq(userAssignmentTable.id, String(id)))
					.returning();
				return { success: true, userAssignment: updated };
			}

			// Fallback to assignment table for legacy support
			const [assignment] = await db
				.update(assignmentTable)
				.set({ content: String(content) })
				.where(eq(assignmentTable.id, String(id)))
				.returning();
			return { success: true, assignment: assignment };
		} catch (error) {
			console.error('Error saving document:', error);
			return { success: false, error: 'Failed to save document' };
		}
	},

	saveTemplate: async ({ request }) => {
		const formData = await request.formData();
		const content = formData.get('content');
		const templateId = formData.get('templateId');

		try {
			// Return the template content to be stored in localStorage on client
			return { success: true, content, templateId };
		} catch (error) {
			console.error('Error saving template:', error);
			return { success: false, error: 'Failed to save template' };
		}
	}
};
