import { db } from "./db";
import { sessionTable } from "./db/schema";
import { randomBytes, randomUUID } from "crypto";
import { getSession } from "./db/query";
import { eq } from "drizzle-orm";

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