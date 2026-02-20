// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { InferSelectModel } from 'drizzle-orm';
import type { userTable, sessionTable } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			user: InferSelectModel<typeof userTable> | null;
			session: InferSelectModel<typeof sessionTable> | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.svg' {
	const content: string;
	export default content;
}

export {};
