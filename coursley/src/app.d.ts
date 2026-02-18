// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: InterSelectModel<typeof userTable> | null;
			session: InterSelectModel<typeof sessionTable> | null;
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
