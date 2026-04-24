import { pgTable, pgEnum, serial, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the role enum for user roles
export const roleEnum = pgEnum('role', ['student', 'instructor']);

// User table
export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	profilePicture: text('profile_picture'),
	role: roleEnum('role').notNull(),
	isAdmin: boolean('is_admin').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	theme: text('theme').notNull().default('light') // light or dark
});

// Assignment table
export const assignmentTable = pgTable('assignment', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	type: text('type').notNull().default('essay'),
	content: text('content').notNull(),
	contentTitle: text('content_title'),
	courseId: text('course_id')
		.references(() => courseTable.id, { onDelete: 'cascade' })
		.notNull(),
	dueDate: timestamp('due_date', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Course table
export const courseTable = pgTable('course', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	joinId: text('join_id').notNull().unique(),
	instructorId: text('instructor_id')
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull()
});

// Session table
export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull(),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
	clientAddress: text('client_address'),
	userAgent: text('user_agent'),
	deviceName: text('device_name')
});

// Entry Token table
export const entryTokenTable = pgTable('entry_token', {
	id: text('id').primaryKey(),
	token: text('token').notNull().unique(),
	userId: text('user_id')
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull(),
	target: text('target').notNull(),
	targetId: text('target_id'),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Enrollment table (junction table for students and courses)
export const enrollmentTable = pgTable('enrollment', {
	id: text('id').primaryKey(),
	studentId: text('student_id')
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull(),
	courseId: text('course_id')
		.references(() => courseTable.id, { onDelete: 'cascade' })
		.notNull(),
	enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow()
});

// User Assignment table (stores individual student work on assignments)
export const userAssignmentTable = pgTable('user_assignment', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull(),
	assignmentId: text('assignment_id')
		.references(() => assignmentTable.id, { onDelete: 'cascade' })
		.notNull(),
	content: text('content').notNull(),
	contentTitle: text('content_title'),
	status: text('status').notNull().default('in_progress'), // in_progress, submitted, graded
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	turnedInAt: timestamp('turned_in_at', { withTimezone: true }),
	savedAt: timestamp('saved_at', { withTimezone: true })
});

// Define relations
export const userReltions = relations(userTable, ({ many }) => ({
	instructorCourses: many(courseTable),
	sessions: many(sessionTable),
	enrollments: many(enrollmentTable),
	userAssignments: many(userAssignmentTable)
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

export const assignmentRelations = relations(assignmentTable, ({ one, many }) => ({
	course: one(courseTable, {
		fields: [assignmentTable.courseId],
		references: [courseTable.id]
	}),
	userAssignments: many(userAssignmentTable)
}));

export const userAssignmentRelations = relations(userAssignmentTable, ({ one }) => ({
	user: one(userTable, {
		fields: [userAssignmentTable.userId],
		references: [userTable.id]
	}),
	assignment: one(assignmentTable, {
		fields: [userAssignmentTable.assignmentId],
		references: [assignmentTable.id]
	})
}));
