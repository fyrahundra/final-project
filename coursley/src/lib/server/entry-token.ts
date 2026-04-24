import { randomBytes, randomUUID } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
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

export async function issueEntryToken(input: {
	userId: string;
	target: EditorTarget;
	targetId?: string | null;
	ttlSeconds?: number;
}) {
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
	const record = await db.query.entryTokenTable.findFirst({
		where: (entryToken, { eq }) => eq(entryToken.token, input.token)
	});

	if (!record) {
		return false;
	}

	if (record.userId !== input.userId) {
		return false;
	}

	if (record.target !== input.target) {
		return false;
	}

	if ((record.targetId ?? null) !== (input.targetId ?? null)) {
		return false;
	}

	if (record.usedAt) {
		return false;
	}

	if (record.expiresAt <= new Date()) {
		return false;
	}

	const consumed = await db
		.update(entryTokenTable)
		.set({ usedAt: new Date() })
		.where(and(eq(entryTokenTable.id, record.id), isNull(entryTokenTable.usedAt)))
		.returning({ id: entryTokenTable.id });

	return consumed.length > 0;
}
