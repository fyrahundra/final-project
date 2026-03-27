import type { Actions } from '@sveltejs/kit';
import { getCourse } from '$lib/server/db/query';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { assignmentTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';

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

		if (!title || !description || !content) {
			throw new Error('Title, description, and content are required');
		}

		await db.insert(assignmentTable).values({
			id: randomUUID(),
			title,
			description,
			content,
			courseId: courseId.toString(),
			createdAt: new Date(),
			updatedAt: new Date()
		}).execute();
	}
};
