import { pgTable, pgEnum, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the role enum for user roles
export const roleEnum = pgEnum('role', ['student', 'instructor', 'admin']);

// Define tables

// User table
export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	profilePicture: text('profile_picture'),
	role: roleEnum('role').notNull()
});

// Assignment table
export const assignmentTable = pgTable('assignment', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	content: text('content').notNull(),
	courseId: text('course_id')
		.references(() => courseTable.id)
		.notNull()
});

// Course table
export const courseTable = pgTable('course', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	instructorId: text('instructor_id')
		.references(() => userTable.id)
		.notNull()
});

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => userTable.id)
		.notNull(),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

// Enrollment table (junction table for students and courses)
export const enrollmentTable = pgTable('enrollment', {
	id: text('id').primaryKey(),
	studentId: text('student_id')
		.references(() => userTable.id)
		.notNull(),
	courseId: text('course_id')
		.references(() => courseTable.id)
		.notNull(),
	enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow()
});

// Define relations
export const userReltions = relations(userTable, ({ many }) => ({
	instructorCourses: many(courseTable),
	sessions: many(sessionTable),
	enrollments: many(enrollmentTable)
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
	user: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id]
	})
}));

export const courseRelations = relations(courseTable, ({ one, many }) => ({
	instructor: one(userTable, {
		fields: [courseTable.instructorId],
		references: [userTable.id]
	}),
	enrollments: many(enrollmentTable),
	assignments: many(assignmentTable)
}));

export const enrollmentRelations = relations(enrollmentTable, ({ one }) => ({
	student: one(userTable, {
		fields: [enrollmentTable.studentId],
		references: [userTable.id]
	}),
	course: one(courseTable, {
		fields: [enrollmentTable.courseId],
		references: [courseTable.id]
	})
}));

export const assignmentRelations = relations(assignmentTable, ({ one }) => ({
	course: one(courseTable, {
		fields: [assignmentTable.courseId],
		references: [courseTable.id]
	})
}));
