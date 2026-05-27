import type { Actions } from '@sveltejs/kit';
import { getCourse } from '$lib/server/db/query';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { assignmentTable, enrollmentTable, courseTable, userAssignmentTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { publishAssignmentCreated } from '$lib/server/stream';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	createAssignment: async ({ request, params, locals }) => {
		const courseId = params.course;
		const data = await getCourse(courseId?.toString() || '');
		const user = locals.user;
		if (!user) {
			throw redirect(303, '/login');
		}
		if (user.id !== data?.instructorId) {
			throw redirect(303, '/courses');
		}
		if (!courseId) {
			throw new Error('Course ID is required');
		}
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const content = formData.get('content') as string;
		const type = formData.get('type') as string;

		if (!title || !description || !content || !type) {
			throw new Error('Title, description, content, and type are required');
		}

		const assignmentId = randomUUID();

		await db
			.insert(assignmentTable)
			.values({
				id: assignmentId,
				title,
				description,
				content,
				type,
				courseId: courseId.toString(),
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.execute();

		const enrollments = await db
			.select({ studentId: enrollmentTable.studentId })
			.from(enrollmentTable)
			.where(eq(enrollmentTable.courseId, courseId.toString()))
			.execute();

		const createdAt = new Date();
		const updatedAt = createdAt;
		const assignmentPayload = {
			id: assignmentId,
			title,
			description,
			type,
			content,
			contentTitle: null,
			courseId: courseId.toString(),
			dueDate: null,
			createdAt,
			updatedAt
		};

		const recipientUserIds = new Set<string>([user.id]);
		for (const enrollment of enrollments) {
			recipientUserIds.add(enrollment.studentId);
		}

		await Promise.all(
			Array.from(recipientUserIds).map((recipientUserId) =>
				publishAssignmentCreated({
					userId: recipientUserId,
					courseId: courseId.toString(),
					assignment: assignmentPayload
				})
			)
		);
	}
	,
	removeCourse: async ({ params, locals }) => {
		const courseId = params.course;
		const user = locals.user;

		if (!user) {
			throw redirect(303, '/login');
		}

		const data = await getCourse(courseId?.toString() || '');
		if (!data) {
			throw redirect(303, '/courses');
		}

		if (user.id !== data?.instructorId) {
			throw redirect(303, '/courses');
		}

		try {
			// Find assignments for the course
			const assignments = await db
				.select({ id: assignmentTable.id })
				.from(assignmentTable)
				.where(eq(assignmentTable.courseId, courseId?.toString() || ''))
				.execute();

			// Delete user assignments for each assignment
			for (const a of assignments) {
				if (a?.id) {
					await db.delete(userAssignmentTable).where(eq(userAssignmentTable.assignmentId, a.id)).execute();
				}
			}

			// Delete assignments
			await db.delete(assignmentTable).where(eq(assignmentTable.courseId, courseId?.toString() || '')).execute();

			// Delete enrollments
			await db.delete(enrollmentTable).where(eq(enrollmentTable.courseId, courseId?.toString() || '')).execute();

			// Delete the course
			await db.delete(courseTable).where(eq(courseTable.id, courseId?.toString() || '')).execute();

			// Redirect back to courses list
			throw redirect(303, '/courses');
		} catch (err) {
			console.error('Error removing course:', err);
			throw new Error('Failed to remove course');
		}
	}
};

