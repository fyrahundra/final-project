import type { RequestHandler } from './$types';
import { redirect, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { courseTable, enrollmentTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');

    if (typeof title !== 'string' || typeof description !== 'string') {
        return json({ success: false, message: 'Invalid form data' }, { status: 400 });
    }

    if (!locals.user) {
        return json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    if (locals.user.role !== 'instructor') {
        return json({ success: false, message: 'User not authorized' }, { status: 403 });
    }

    const [course] = await db.insert(courseTable).values({
        id: randomUUID(),
        title,
        description,
        instructorId: locals.user.id,
    })
    .returning({ id: courseTable.id })
    .execute();

    await db.insert(enrollmentTable).values({
        id: randomUUID(),
        studentId: locals.user.id,
        courseId: course.id,
    }).execute();

    throw redirect(303, '/courses');
};
