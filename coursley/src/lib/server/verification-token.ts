import { db } from './db/index';
import { verificationTokenTable } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

function generateToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export async function issueVerificationToken(
	userId: string,
	type: string,
	expiresInHours: number = 24
): Promise<string> {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

	await db.insert(verificationTokenTable).values({
		id: crypto.randomUUID(),
		token,
		userId,
		type,
		expiresAt,
		createdAt: new Date()
	});

	return token;
}

export async function consumeVerificationToken(
	token: string,
	userId: string,
	type: string
) {
	const result = await db
		.select()
		.from(verificationTokenTable)
		.where(eq(verificationTokenTable.token, token));

	const record = result[0];

	if (
		!record ||
		record.userId !== userId ||
		record.type !== type ||
		record.usedAt ||
		new Date(record.expiresAt) < new Date()
	) {
		return null;
	}

	await db
		.update(verificationTokenTable)
		.set({ usedAt: new Date() })
		.where(eq(verificationTokenTable.token, token));

	return record;
}

export async function validateVerificationToken(
	token: string,
	userId: string,
	type: string
) {
	const result = await db
		.select()
		.from(verificationTokenTable)
		.where(eq(verificationTokenTable.token, token));

	const record = result[0];

	if (
		!record ||
		record.userId !== userId ||
		record.type !== type ||
		record.usedAt ||
		new Date(record.expiresAt) < new Date()
	) {
		return null;
	}

	return record;
}

export async function pruneVerificationTokens(): Promise<void> {
	await db
		.delete(verificationTokenTable)
		.where(
			sql`${verificationTokenTable.expiresAt} < CURRENT_TIMESTAMP OR ${verificationTokenTable.usedAt} IS NOT NULL`
		);
}

export async function getVerificationToken(tokenId: string) {
	const result = await db
		.select()
		.from(verificationTokenTable)
		.where(eq(verificationTokenTable.id, tokenId));

	return result[0] || null;
}

export async function getUserVerificationTokens(userId: string, type: string) {
	return db
		.select()
		.from(verificationTokenTable)
		.where(eq(verificationTokenTable.userId, userId) && eq(verificationTokenTable.type, type));
}
