import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const assignmentId = params.assignment;
	const courseId = params.course;
	const userId = locals.user?.id;

	if (!userId) {
		return {
			assignment: null,
			isInstructorView: false,
			studentAssignments: [],
			accessError: 'Not authenticated'
		};
	}

	const assignment = await db.query.assignmentTable.findFirst({
		where: (assignment, { eq }) => eq(assignment.id, assignmentId),
		with: {
			course: true
		}
	});

	if (!assignment) {
		return {
			assignment: null,
			isInstructorView: false,
			studentAssignments: [],
			accessError: 'Assignment not found'
		};
	}

	const isCourseInstructor = assignment.course?.instructorId === userId;
	const isAdmin = locals.user?.isAdmin === true;
	const canViewInstructorData = isCourseInstructor || isAdmin;

	const enrollment = await db.query.enrollmentTable.findFirst({
		where: (enrollment, { and, eq }) =>
			and(eq(enrollment.studentId, userId), eq(enrollment.courseId, courseId))
	});

	if (!enrollment && !canViewInstructorData) {
		return {
			assignment,
			isInstructorView: false,
			studentAssignments: [],
			accessError: 'Not enrolled in this course'
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
			isInstructorView: true,
			studentAssignments,
			accessError: null
		};
	}

	return {
		assignment,
		isInstructorView: false,
		studentAssignments: [],
		accessError: null
	};
};
