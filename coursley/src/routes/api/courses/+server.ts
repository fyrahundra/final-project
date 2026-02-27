import type { RequestHandler } from './$types';
import { redirect, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { courseTable, enrollmentTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const title = formData.get('title');
	const description = formData.get('description');
	const action = formData.get('action');

	if (!locals.user) {
		return json({ success: false, message: 'User not authenticated' }, { status: 401 });
	}

	// Join course with joinId
	if (action === 'join') {
		const joinId = formData.get('joinId');

		if (typeof joinId !== 'string' || !joinId.trim()) {
			return json({ success: false, message: 'Invalid join ID' }, { status: 400 });
		}

		// Find course by joinId
		const [course] = await db
			.select()
			.from(courseTable)
			.where(eq(courseTable.joinId, joinId.trim()))
			.execute();

		if (!course) {
			return json({ success: false, message: 'Course not found' }, { status: 404 });
		}

		// Check if user is already enrolled
		const [existing] = await db
			.select()
			.from(enrollmentTable)
			.where(
				and(eq(enrollmentTable.studentId, locals.user.id), eq(enrollmentTable.courseId, course.id))
			)
			.execute();

		if (existing) {
			return json({ success: false, message: 'Already enrolled in this course' }, { status: 400 });
		}

		// Create enrollment
		await db
			.insert(enrollmentTable)
			.values({
				id: randomUUID(),
				studentId: locals.user.id,
				courseId: course.id
			})
			.execute();

		return json({ success: true, message: 'Successfully joined course' }, { status: 200 });
	}

	// Create new course (instructor only)
	if (typeof title !== 'string' || typeof description !== 'string') {
		return json({ success: false, message: 'Invalid form data' }, { status: 400 });
	}

	if (locals.user.role !== 'instructor') {
		return json({ success: false, message: 'User not authorized' }, { status: 403 });
	}

	const [course] = await db
		.insert(courseTable)
		.values({
			id: randomUUID(),
			title,
			description,
			joinId: randomUUID(),
			instructorId: locals.user.id
		})
		.returning({ id: courseTable.id })
		.execute();

	await db
		.insert(enrollmentTable)
		.values({
			id: randomUUID(),
			studentId: locals.user.id,
			courseId: course.id
		})
		.execute();

	throw redirect(303, '/courses');
};
