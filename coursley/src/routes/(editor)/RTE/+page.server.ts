import type { Actions, ServerLoad } from '@sveltejs/kit';
import { assignmentTable, userAssignmentTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { publishAssignmentSubmitted } from '$lib/server/stream';

const editorName = 'RTE';

async function isCourseInstructorForDocument(id: string, userId?: string) {
	if (!id || !userId) return false;

	const userAssignment = await db.query.userAssignmentTable.findFirst({
		where: (ua, { eq }) => eq(ua.id, id),
		with: {
			assignment: {
				with: {
					course: true
				}
			}
		}
	});

	if (userAssignment?.assignment?.course?.instructorId) {
		return userAssignment.assignment.course.instructorId === userId;
	}

	const assignment = await db.query.assignmentTable.findFirst({
		where: (a, { eq }) => eq(a.id, id),
		with: {
			course: true
		}
	});

	return assignment?.course?.instructorId === userId;
}

export const load: ServerLoad = async ({ url, locals }) => {
	const id = url.searchParams.get('id')?.trim() || null;
	const mode = url.searchParams.get('mode');
	const templateId = url.searchParams.get('templateId');
	const view = url.searchParams.get('view');

	if (!locals.user) {
		return {
			assignment: null,
			userAssignment: null,
			isTemplate: false,
			isViewingSubmission: false,
			isInstructorReadOnly: false
		};
	}

	// Template mode - no database lookup needed
	if (mode === 'template') {
		return {
			assignment: null,
			userAssignment: null,
			isTemplate: true,
			templateId: templateId,
			isInstructorReadOnly: false
		};
	}

	if (!id) {
		return {
			assignment: null,
			userAssignment: null,
			isTemplate: false,
			isViewingSubmission: false,
			isInstructorReadOnly: false
		};
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
			isTemplate: false,
			isViewingSubmission: false,
			isInstructorReadOnly: await isCourseInstructorForDocument(id, locals.user?.id)
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
		isTemplate: false,
		isViewingSubmission: false,
		isInstructorReadOnly: false
	};
};

export const actions: Actions = {
	changeTitle: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		const title = String(formData.get('title') || '');

		const userAssignment = await db
			.select()
			.from(userAssignmentTable)
			.where(eq(userAssignmentTable.id, String(id)))
			.execute();

		if (userAssignment.length > 0 && (await isCourseInstructorForDocument(id, locals.user?.id))) {
			return { success: false, error: 'Course instructors have read-only access to submissions' };
		}

		try {
			if (userAssignment.length > 0) {
				const [updated] = await db
					.update(userAssignmentTable)
					.set({
						contentTitle: title,
						updatedAt: sql`CURRENT_TIMESTAMP`
					})
					.where(eq(userAssignmentTable.id, String(id)))
					.returning();
				return { success: true, userAssignment: updated };
			}

			const [assignment] = await db
				.update(assignmentTable)
				.set({ title })
				.where(eq(assignmentTable.id, String(id)))
				.returning();
			return { success: true, assignment: assignment };
		} catch (error) {
			console.error('Error updating title:', error);
			return { success: false, error: 'Failed to update title' };
		}
	},

	saveDocument: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		const userAssignment = await db
			.select()
			.from(userAssignmentTable)
			.where(eq(userAssignmentTable.id, String(id)))
			.execute();

		if (userAssignment.length > 0 && (await isCourseInstructorForDocument(id, locals.user?.id))) {
			return { success: false, error: 'Course instructors have read-only access to submissions' };
		}
		const content = formData.get('content');

		try {
			if (userAssignment.length > 0) {
				const [updated] = await db
					.update(userAssignmentTable)
					.set({
						content: String(content),
						updatedAt: sql`CURRENT_TIMESTAMP`,
						savedAt: sql`CURRENT_TIMESTAMP`
					})
					.where(eq(userAssignmentTable.id, String(id)))
					.returning();
				return { success: true, userAssignment: updated };
			}

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
	},

	turnIn: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		const userAssignment = await db
			.select()
			.from(userAssignmentTable)
			.where(eq(userAssignmentTable.id, String(id)))
			.execute();

		if (!userAssignment.length) {
			return { success: false, error: 'Legacy assignments cannot be submitted from the editor' };
		}

		if (await isCourseInstructorForDocument(id, locals.user?.id)) {
			return { success: false, error: 'Course instructors have read-only access to submissions' };
		}

		try {
			const [updated] = await db
				.update(userAssignmentTable)
				.set({
					status: 'submitted',
					updatedAt: sql`CURRENT_TIMESTAMP`,
					turnedInAt: sql`CURRENT_TIMESTAMP`
				})
				.where(eq(userAssignmentTable.id, String(id)))
				.returning();

			await publishAssignmentSubmitted({
				userId: updated.userId,
				assignmentId: updated.assignmentId,
				userAssignmentId: updated.id,
				status: updated.status
			});

			const assignmentForCourse = await db.query.assignmentTable.findFirst({
				where: (a, { eq }) => eq(a.id, updated.assignmentId),
				with: {
					course: true
				}
			});

			const instructorId = assignmentForCourse?.course?.instructorId;
			if (instructorId && instructorId !== updated.userId) {
				await publishAssignmentSubmitted({
					userId: instructorId,
					assignmentId: updated.assignmentId,
					userAssignmentId: updated.id,
					status: updated.status
				});
			}

			return { success: true, userAssignment: updated };
		} catch (error) {
			console.error('Error turning in assignment:', error);
			return { success: false, error: 'Failed to turn in assignment' };
		}
	}
};
