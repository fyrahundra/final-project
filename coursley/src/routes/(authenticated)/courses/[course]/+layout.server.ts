import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCourse } from '$lib/server/db/query';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const courseId = params.course;
	const user = locals.user;

	if (!user) {
		throw redirect(303, '/login');
	}

	const course = await getCourse(courseId);

	if (!course) {
		throw redirect(303, '/courses');
	}

	const isInstructor = course.instructorId === user.id;
	const isAdmin = user.isAdmin === true;

	const enrollment = await db.query.enrollmentTable.findFirst({
		where: (enrollment, { and, eq }) =>
			and(eq(enrollment.courseId, courseId.toString()), eq(enrollment.studentId, user.id))
	});

	const hasAccess = isInstructor || isAdmin || !!enrollment;

	if (!hasAccess) {
		throw redirect(303, '/courses');
	}

	const assignments = await db.query.assignmentTable.findMany({
		where: (assignment, { eq }) => eq(assignment.courseId, courseId.toString())
	});

	return {
		course,
		assignments,
		user,
		isInstructor,
		isAdmin,
		hasAccess
	};
};