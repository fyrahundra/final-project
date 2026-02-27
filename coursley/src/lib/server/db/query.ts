import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { db } from './index';
import { eq } from 'drizzle-orm';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

//query user data
export function getUser(userId: string) {
	return db.query.userTable.findFirst({
		where: (user, { eq }) => eq(user.id, userId),
		with: {
			enrollments: {
				with: {
					course: true
				}
			}
		}
	});
}

export function getUserByName(name: string) {
	return db.select().from(schema.userTable).where(eq(schema.userTable.name, name)).execute();
}

//query course data
export function getCourse(courseId: string) {
	return db.query.courseTable.findFirst({
		where: (course, { eq }) => eq(course.id, courseId),
		with: {
			instructor: true,
			assignments: true
		}
	});
}

//query assignment data
export function getAssignment(assignmentId: string) {
	return db.query.assignmentTable.findFirst({
		where: (assignment, { eq }) => eq(assignment.id, assignmentId),
		with: {
			course: true
		}
	});
}

//query session data
export function getSession(token: string) {
	return db.query.sessionTable.findFirst({
		where: (session, { eq }) => eq(session.token, token),
		with: {
			user: true
		}
	});
}

//query user assignment data
export function getUserAssignment(userAssignmentId: string) {
	return db.query.userAssignmentTable.findFirst({
		where: (userAssignment, { eq }) => eq(userAssignment.id, userAssignmentId),
		with: {
			assignment: {
				with: {
					course: true
				}
			},
			user: true
		}
	});
}

export function getUserAssignmentByUserAndAssignment(userId: string, assignmentId: string) {
	return db.query.userAssignmentTable.findFirst({
		where: (userAssignment, { and, eq }) =>
			and(eq(userAssignment.userId, userId), eq(userAssignment.assignmentId, assignmentId)),
		with: {
			assignment: {
				with: {
					course: true
				}
			}
		}
	});
}
