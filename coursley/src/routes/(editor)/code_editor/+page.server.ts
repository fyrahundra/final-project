import type { Actions, ServerLoad } from '@sveltejs/kit';
import { assignmentTable, userAssignmentTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { publishAssignmentSubmitted } from '$lib/server/stream';

const editorName = 'code_editor';

export const load: ServerLoad = async ({ url, locals }) => {
    const mode = url.searchParams.get('mode');
    const templateId = url.searchParams.get('templateId');
    const view = url.searchParams.get('view');
    const id = url.searchParams.get('id')?.trim() || null;
    const draftKey =
		url.searchParams.get('id')?.trim() || templateId || 'code_editor_draft';

    if (!locals.user) {
        return {
            user: null,
            isTemplate: false,
            templateId: null,
			isViewOnly: false,
            draftKey: null,
            content: null,
            documentId: null
        }
    }

    if (mode === 'template') {
        return {
            user: locals.user,
            isTemplate: true,
            templateId: templateId ?? null,
            isViewOnly: false,
            draftKey,
            content: null,
            documentId: null
        };
    }

    if (!id) {
        return {
            user: locals.user,
            isTemplate: false,
            templateId: templateId ?? null,
            isViewOnly: view === 'only',
            draftKey,
            content: null,
            documentId: null
        };
    }

    const userAssignment = await db
        .select()
        .from(userAssignmentTable)
        .where(eq(userAssignmentTable.id, id))
        .execute();

    if (userAssignment.length > 0) {
        return {
            user: locals.user,
            isTemplate: false,
            templateId: templateId ?? null,
            isViewOnly: view === 'only',
            draftKey,
            content: userAssignment[0].content,
            documentId: id
        };
    }

    const assignment = await db
        .select()
        .from(assignmentTable)
        .where(eq(assignmentTable.id, id))
        .execute();

    return {
        user: locals.user,
        isTemplate: false,
        templateId: templateId ?? null,
		isViewOnly: view === 'only',
        draftKey,
        content: assignment[0]?.content ?? null,
        documentId: id
    }
};

export const actions: Actions = {
    saveDocument: async ({ request, url, locals }) => {
        if (!locals.user) {
            return { success: false, error: 'You must be signed in to save code' };
        }

        const formData = await request.formData();
        const id = String(formData.get('id') || '').trim();
        const content = String(formData.get('content') || '');
        const view = url.searchParams.get('view');

        if (!id) {
            return { success: false, error: 'Missing document id' };
        }

        if (view === 'only') {
            return { success: false, error: 'This document is read-only' };
        }

        const userAssignment = await db
            .select()
            .from(userAssignmentTable)
            .where(eq(userAssignmentTable.id, id))
            .execute();

        try {
            if (userAssignment.length > 0) {
                const [updated] = await db
                    .update(userAssignmentTable)
                    .set({
                        content,
                        updatedAt: sql`CURRENT_TIMESTAMP`,
                        savedAt: sql`CURRENT_TIMESTAMP`
                    })
                    .where(eq(userAssignmentTable.id, id))
                    .returning();

                return { success: true, userAssignment: updated };
            }

            const [updated] = await db
                .update(assignmentTable)
                .set({ content })
                .where(eq(assignmentTable.id, id))
                .returning();

            return { success: true, assignment: updated };
        } catch (error) {
            console.error('Error saving code document:', error);
            return { success: false, error: 'Failed to save code document' };
        }
    },

    turnIn: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = String(formData.get('id') || '');

        const userAssignment = await db
            .select()
            .from(userAssignmentTable)
            .where(eq(userAssignmentTable.id, String(id)))
            .execute();

        if (!userAssignment.length) {
            return { success: false, error: 'Legacy assignments cannot be submitted from the editor' };
        }

        // Prevent instructors from turning in student submissions
        const assignmentRow = await db.query.assignmentTable.findFirst({
            where: (a, { eq }) => eq(a.id, userAssignment[0].assignmentId),
            with: { course: true }
        });

        if (assignmentRow?.course?.instructorId === locals.user?.id) {
            return { success: false, error: 'Course instructors have read-only access to submissions' };
        }

        try {
            const [updated] = await db
                .update(userAssignmentTable)
                .set({
                    status: 'submitted',
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                    turnedInAt: sql`CURRENT_TIMESTAMP`
                })
                .where(eq(userAssignmentTable.id, String(id)))
                .returning();

            await publishAssignmentSubmitted({
                userId: updated.userId,
                assignmentId: updated.assignmentId,
                userAssignmentId: updated.id,
                status: updated.status
            });

            const assignmentForCourse = await db.query.assignmentTable.findFirst({
                where: (a, { eq }) => eq(a.id, updated.assignmentId),
                with: { course: true }
            });

            const instructorId = assignmentForCourse?.course?.instructorId;
            if (instructorId && instructorId !== updated.userId) {
                await publishAssignmentSubmitted({
                    userId: instructorId,
                    assignmentId: updated.assignmentId,
                    userAssignmentId: updated.id,
                    status: updated.status
                });
            }

            return { success: true, userAssignment: updated };
        } catch (error) {
            console.error('Error turning in assignment:', error);
            return { success: false, error: 'Failed to turn in assignment' };
        }
    }
};