import { db } from "./db";
import { sessionTable } from "./db/schema";
import { randomBytes, randomUUID } from "crypto";
import { getSession } from "./db/query";
import { eq } from "drizzle-orm";
import { fail } from "@sveltejs/kit";

export function generateSessionToken() {
    return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [session] = await db
        .insert(sessionTable)
        .values({
            id: randomUUID(),
            userId: userId,
            token,
            expiresAt,
        })
        .returning({ id: sessionTable.id, token: sessionTable.token })
        .execute();

    return session;
}

export async function validateSession(token: string) {
    const session = await getSession(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
        await destroySession(token);
        return null;
    }
    return session;
}

export async function refreshSession(token: string) {
    const session = await validateSession(token);
    if (!session) return null;
    const newToken = generateSessionToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend session for another 7 days

    await db
        .update(sessionTable)
        .set({
            token: newToken,
            expiresAt: newExpiresAt,
        })
        .where(eq(sessionTable.token, token))
        .execute();

    return newToken;
}

export async function destroySession(token: string) {
    await db.delete(sessionTable).where(eq(sessionTable.token, token)).execute();
}

export function validatePassword(password: string, name: string, email: string) {
    // Implement password validation logic (e.g., check length, complexity)
    let errorMessage = [];
    if (password.length < 8) {
        errorMessage.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errorMessage.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errorMessage.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errorMessage.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errorMessage.push("Password must contain at least one special character");
    }
    if (name.toLowerCase().includes(password.toLowerCase())) {
        errorMessage.push("Password should not contain your name");
    }
    if (email.toLocaleLowerCase().includes(password.toLocaleLowerCase())) {
        errorMessage.push("Password should not contain your email");
    }
    return errorMessage;
}