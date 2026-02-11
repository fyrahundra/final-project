import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";
import { db } from "./index";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

//query user data
export function getUser(userId: number) {
    return db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.id, userId),
        with: {
            courses: true,
        },
    });
}

//query course data
export function getCourse(courseId: number) {
    return db.query.courseTable.findFirst({
        where: (course, { eq }) => eq(course.id, courseId),
        with: {
            instructor: true,
            assignments: true,
        },
    });
}

//query assignment data
export function getAssignment(assignmentId: number) {
    return db.query.assignmentTable.findFirst({
        where: (assignment, { eq }) => eq(assignment.id, assignmentId),
        with: {
            course: true,
        },
    });
}
