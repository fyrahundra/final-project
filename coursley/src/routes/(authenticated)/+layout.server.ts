import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { InferSelectModel } from 'drizzle-orm';
import { courseTable } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth';
import { getCourseStudentCount } from '$lib/server/db/query';

type CourseWithCount = InferSelectModel<typeof courseTable> & {
	studentCount: number;
	isInstructor: boolean;
};

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const user = await requireAuth(locals, cookies);

	const enrollments = await db.query.enrollmentTable.findMany({
		where: (enrollment, { eq }) => eq(enrollment.studentId, user.id),
		with: {
			course: true
		}
	});

	const instructorCourses = await db.query.courseTable.findMany({
		where: (course, { eq }) => eq(course.instructorId, user.id)
	});

	const enrolledCourses = await Promise.all(
		enrollments.map(async (enrollment) => {
			const c = enrollment.course as InferSelectModel<typeof courseTable>;
			return {
				id: c.id,
				title: c.title,
				description: c.description ?? null,
				joinId: c.joinId,
				instructorId: c.instructorId,
				studentCount: await getCourseStudentCount(c.id),
				isInstructor: false
			} as CourseWithCount;
		})
	);

	const instructedCourses = await Promise.all(
		instructorCourses.map(async (course) => {
			const c = course as InferSelectModel<typeof courseTable>;
			return {
				id: c.id,
				title: c.title,
				description: c.description ?? null,
				joinId: c.joinId,
				instructorId: c.instructorId,
				studentCount: await getCourseStudentCount(c.id),
				isInstructor: true
			} as CourseWithCount;
		})
	);

	// Combine and deduplicate courses (in case user is both instructor and enrolled)
	const courseMap = new Map<string, CourseWithCount>();

	for (const course of enrolledCourses) {
		courseMap.set(course.id, course);
	}

	for (const course of instructedCourses) {
		if (courseMap.has(course.id)) {
			// User is both instructor and student - mark as instructor
			const existing = courseMap.get(course.id)!; // non-null since we checked with has()
			courseMap.set(course.id, { ...existing, isInstructor: true });
		} else {
			courseMap.set(course.id, course);
		}
	}

	const courses = Array.from(courseMap.values());

	return {
		user,
		courses
	};
};
