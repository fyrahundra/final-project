import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { userAssignmentTable, enrollmentTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ params, locals }) => {
	const assignmentId = params.assignment;
	const courseId = params.course;
	const userId = locals.user?.id;

	if (!userId) {
		return { assignment: null, userAssignment: null, error: 'Not authenticated' };
	}

	// Get the assignment template
	const assignment = await db.query.assignmentTable.findFirst({
		where: (assignment, { eq }) => eq(assignment.id, assignmentId),
		with: {
			course: true
		}
	});

	if (!assignment) {
		return { assignment: null, userAssignment: null, error: 'Assignment not found' };
	}

	// Check if user is enrolled in the course
	const enrollment = await db.query.enrollmentTable.findFirst({
		where: (enrollment, { and, eq }) =>
			and(eq(enrollment.studentId, userId), eq(enrollment.courseId, courseId))
	});

	if (!enrollment && locals.user?.role !== 'instructor' && locals.user?.role !== 'admin') {
		return { assignment, userAssignment: null, error: 'Not enrolled in this course' };
	}

	// Get or create user assignment
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

	return { assignment, userAssignment };
};
