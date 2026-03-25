import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { userAssignmentTable, enrollmentTable } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { publishAssignmentSubmitted } from '$lib/server/stream';

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
		return {
			assignment: null,
			userAssignment: null,
			studentAssignments: [],
			isInstructorView: false,
			error: 'Assignment not found'
		};
	}

	const isCourseInstructor = assignment.course?.instructorId === userId;
	const isAdmin = locals.user?.isAdmin === true;
	const canViewInstructorData = isCourseInstructor || isAdmin;

	// Check if user is enrolled in the course
	const enrollment = await db.query.enrollmentTable.findFirst({
		where: (enrollment, { and, eq }) =>
			and(eq(enrollment.studentId, userId), eq(enrollment.courseId, courseId))
	});

	if (!enrollment && !canViewInstructorData) {
		return {
			assignment,
			userAssignment: null,
			studentAssignments: [],
			isInstructorView: false,
			error: 'Not enrolled in this course'
		};
	}

	if (canViewInstructorData) {
		const studentAssignments = await db.query.userAssignmentTable.findMany({
			where: (userAssignment, { eq }) => eq(userAssignment.assignmentId, assignmentId),
			with: {
				user: true
			},
			orderBy: (userAssignment, { desc }) => [desc(userAssignment.updatedAt)]
		});

		return {
			assignment,
			userAssignment: null,
			studentAssignments,
			isInstructorView: true,
			error: null
		};
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

	return {
		assignment,
		userAssignment,
		studentAssignments: [],
		isInstructorView: false,
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
