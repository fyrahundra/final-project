import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { userAssignmentTable } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { publishAssignmentSubmitted } from '$lib/server/stream';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const assignmentId = params.assignment;
	const userId = locals.user?.id;
	const parentData = await parent();
	const assignment = parentData.assignment;
	const isInstructorView = parentData.isInstructorView;
	const accessError = parentData.accessError;

	if (!userId) {
		return { userAssignment: null, error: 'Not authenticated' };
	}

	if (accessError || !assignment || isInstructorView) {
		return {
			userAssignment: null,
			error: null
		};
	}

	let userAssignment = await db.query.userAssignmentTable.findFirst({
		where: (userAssignment, { and, eq }) =>
			and(eq(userAssignment.userId, userId), eq(userAssignment.assignmentId, assignmentId))
	});

	if (!userAssignment) {
		// Create a new user assignment by copying from the template
		const [newUserAssignment] = await db
			.insert(userAssignmentTable)
			.values({
				id: nanoid(),
				userId,
				assignmentId,
				content: assignment.content,
				contentTitle: assignment.contentTitle || assignment.title,
				status: 'in_progress'
			})
			.returning();

		userAssignment = newUserAssignment;
	}

	return {
		userAssignment,
		error: null
	};
};

export const actions: Actions = {
	takeBack: async ({ params, locals }) => {
		const assignmentId = params.assignment;
		const userId = locals.user?.id;

		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		try {
			const [updated] = await db
				.update(userAssignmentTable)
				.set({
					status: 'in_progress',
					updatedAt: sql`CURRENT_TIMESTAMP`,
					turnedInAt: null
				})
				.where(
					and(
						eq(userAssignmentTable.assignmentId, assignmentId),
						eq(userAssignmentTable.userId, userId)
					)
				)
				.returning();

			if (updated) {
				await publishAssignmentSubmitted({
					userId: updated.userId,
					assignmentId: updated.assignmentId,
					userAssignmentId: updated.id,
					status: updated.status
				});

				const assignmentForCourse = await db.query.assignmentTable.findFirst({
					where: (assignment, { eq }) => eq(assignment.id, updated.assignmentId),
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
			}

			return { success: true, userAssignment: updated };
		} catch (error) {
			return { success: false, error: 'Failed to take back assignment' };
		}
	}
};
