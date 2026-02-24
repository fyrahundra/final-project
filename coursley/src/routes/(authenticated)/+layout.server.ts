import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	const enrollments = await db.query.enrollmentTable.findMany({
		where: (enrollment, { eq }) => eq(enrollment.studentId, user.id),
		with: {
			course: true
		}
	});

	const courses = enrollments.map((enrollment) => enrollment.course);

	return {
		user,
		courses
	};
};
