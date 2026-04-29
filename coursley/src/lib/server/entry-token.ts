import { randomBytes, randomUUID } from 'crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { entryTokenTable } from '$lib/server/db/schema';

export type EditorTarget = 'RTE' | 'code_editor';

const ENTRY_TOKEN_TTL_SECONDS = 60;

type ConsumeEntryTokenInput = {
	token: string;
	userId: string;
	target: EditorTarget;
	targetId?: string | null;
};

function createTokenValue() {
	return randomBytes(32).toString('hex');
}

export async function pruneEntryTokens() {
	await db.execute(sql`
		DELETE FROM entry_token
		WHERE used_at IS NOT NULL
		   OR expires_at <= CURRENT_TIMESTAMP
	`);
}

export async function issueEntryToken(input: {
	userId: string;
	target: EditorTarget;
	targetId?: string | null;
	ttlSeconds?: number;
}) {
	await pruneEntryTokens();

	const ttlSeconds = input.ttlSeconds ?? ENTRY_TOKEN_TTL_SECONDS;
	const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
	const token = createTokenValue();

	await db.insert(entryTokenTable).values({
		id: randomUUID(),
		token: token,
		userId: input.userId,
		target: input.target,
		targetId: input.targetId ?? null,
		expiresAt: expiresAt
	});

	return { token, expiresAt };
}

export async function consumeEntryToken(input: ConsumeEntryTokenInput) {
	const targetId = input.targetId;
	const baseConditions = [
		eq(entryTokenTable.token, input.token),
		eq(entryTokenTable.userId, input.userId),
		eq(entryTokenTable.target, input.target),
		isNull(entryTokenTable.usedAt),
		sql`${entryTokenTable.expiresAt} > CURRENT_TIMESTAMP`
	];

	let consumed;

	if (targetId == null) {
		consumed = await db
			.delete(entryTokenTable)
			.where(and(...baseConditions, isNull(entryTokenTable.targetId)))
			.returning({ id: entryTokenTable.id });
	} else {
		consumed = await db
			.delete(entryTokenTable)
			.where(and(...baseConditions, eq(entryTokenTable.targetId, targetId)))
			.returning({ id: entryTokenTable.id });
	}

	if (consumed.length > 0) {
		await pruneEntryTokens();
	}

	return consumed.length > 0;
}
