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
	role: roleEnum('role').notNull(),
})

// Assignment table
export const assignmentTable = pgTable('assignment', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	content: text('content').notNull(),
	courseId: integer('course_id').references(() => courseTable.id).notNull(),
})

// Course table
export const courseTable = pgTable('course', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	instructorId: text('instructor_id').references(() => userTable.id).notNull(),
})

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => userTable.id).notNull(),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// Define relations
export const userReltions = relations(userTable, ({ many }) => ({
	courses: many(courseTable),
	sessions: many(sessionTable),
}))

export const sessionRelations = relations(sessionTable, ({ one }) => ({
	user: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id],
	}),
}))

export const courseRelations = relations(courseTable, ({ one, many }) => ({
	instructor: one(userTable, {
		fields: [courseTable.instructorId],
		references: [userTable.id],
	}),
	students: many(userTable),
	assignments: many(assignmentTable),
}))

export const assignmentRelations = relations(assignmentTable, ({ one }) => ({
	course: one(courseTable, {
		fields: [assignmentTable.courseId],
		references: [courseTable.id],
	}),
}))

