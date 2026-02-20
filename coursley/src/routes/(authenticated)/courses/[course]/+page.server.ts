import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';
import { getCourse } from '$lib/server/db/query';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { create } from 'domain';
import { assignmentTable } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ params, locals }) => {
    const courseId = params.course;
    const user = locals.user;

    if (!user) {
        return { course: null };
    }

    const course = await getCourse(courseId);

    const enrollment = await db.query.enrollmentTable.findFirst({
        where: (enrollment, { eq }) => eq(enrollment.courseId, courseId.toString()) && eq(enrollment.studentId, user.id),
    })

    if (!enrollment) {
        throw redirect(303, '/courses');
    }

    const assignments = await db.query.assignmentTable.findMany({
        where: (assignment, { eq }) => eq(assignment.courseId, courseId.toString()),
    });

    return { course, assignments };
}

export const actions: Actions = {
    createAssignment: async ({ request, params, locals }) => {
        const courseId = params.course;
        const user = locals.user;
        if (!user) {
            throw redirect(303, '/login');
        }
        if (user.role !== 'instructor') {
            throw redirect(303, '/courses');
        }
        if (!courseId) {
            throw new Error("Course ID is required");
        }
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const content = formData.get('content') as string;

        if (!title || !description || !content) {
            throw new Error("Title, description, and content are required");
        }

        await db.insert(assignmentTable).values({
            id: randomUUID(),
            title,
            description,
            content,
            courseId: courseId.toString(),
        });
    }
};

