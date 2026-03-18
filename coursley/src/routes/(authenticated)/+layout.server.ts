import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	let user = await requireAuth(locals, cookies);

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
