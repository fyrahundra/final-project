import type { RequestHandler } from '@sveltejs/kit';
import {
	subscribeToAssignmentCreated,
	subscribeToAssignmentSubmitted,
	subscribeToProfilePicture,
	subscribeToTheme
} from '$lib/server/stream';
import { env } from '$env/dynamic/private';

function resolveAutosaveIntervalMs() {
	const raw = env.RTE_AUTOSAVE_INTERVAL_MS;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return 30000;
	return Math.max(5000, Math.round(parsed));
}

export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const encoder = new TextEncoder();
	const autosaveIntervalMs = resolveAutosaveIntervalMs();
	const userId = locals.user.id;
	const initialTheme: 'light' | 'dark' = locals.user.theme === 'dark' ? 'dark' : 'light';
	const initialProfilePicture = locals.user.profilePicture ?? null;
	let pingInterval: ReturnType<typeof setInterval> | undefined;
	let autosaveInterval: ReturnType<typeof setInterval> | undefined;
	let unsubscribeTheme: (() => void) | undefined;
	let unsubscribeProfilePicture: (() => void) | undefined;
	let unsubscribeAssignmentSubmitted: (() => void) | undefined;
	let unsubscribeAssignmentCreated: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let isClosed = false;

			const sendTheme = (theme: 'light' | 'dark') => {
				if (isClosed) return;
				const data = JSON.stringify({ theme });
				controller.enqueue(encoder.encode(`event: theme\ndata: ${data}\n\n`));
			};

			const sendProfilePicture = (profilePicture: string | null) => {
				if (isClosed) return;
				const data = JSON.stringify({ profilePicture });
				controller.enqueue(encoder.encode(`event: profile_picture\ndata: ${data}\n\n`));
			};

			const sendAssignmentSubmitted = (payload: {
				assignmentId: string;
				userAssignmentId: string;
				status: string;
			}) => {
				if (isClosed) return;
				const data = JSON.stringify(payload);
				controller.enqueue(encoder.encode(`event: assignment_submitted\ndata: ${data}\n\n`));
			};

			const sendAssignmentCreated = (payload: {
				courseId: string;
				assignment: {
					id: string;
					title: string;
					description: string | null;
					type: string;
					content: string;
					contentTitle: string | null;
					courseId: string;
					dueDate: Date | null;
					createdAt: Date;
					updatedAt: Date;
				};
			}) => {
				if (isClosed) return;
				const data = JSON.stringify(payload);
				controller.enqueue(encoder.encode(`event: assignment_created\ndata: ${data}\n\n`));
			};

			const sendAutosaveTick = () => {
				if (isClosed) return;
				const data = JSON.stringify({
					intervalMs: autosaveIntervalMs,
					timestamp: new Date().toISOString()
				});
				controller.enqueue(encoder.encode(`event: autosave_tick\ndata: ${data}\n\n`));
			};

			const cleanup = () => {
				if (isClosed) return;
				isClosed = true;

				if (pingInterval) {
					clearInterval(pingInterval);
					pingInterval = undefined;
				}
				if (autosaveInterval) {
					clearInterval(autosaveInterval);
					autosaveInterval = undefined;
				}
				if (unsubscribeTheme) {
					unsubscribeTheme();
					unsubscribeTheme = undefined;
				}
				if (unsubscribeProfilePicture) {
					unsubscribeProfilePicture();
					unsubscribeProfilePicture = undefined;
				}
				if (unsubscribeAssignmentSubmitted) {
					unsubscribeAssignmentSubmitted();
					unsubscribeAssignmentSubmitted = undefined;
				}
				if (unsubscribeAssignmentCreated) {
					unsubscribeAssignmentCreated();
					unsubscribeAssignmentCreated = undefined;
				}
			};

			request.signal.addEventListener('abort', cleanup);

			controller.enqueue(encoder.encode('retry: 3000\n\n'));
			sendTheme(initialTheme);
			sendProfilePicture(initialProfilePicture);
			sendAutosaveTick();

			unsubscribeTheme = subscribeToTheme(userId, ({ theme }) => {
				sendTheme(theme);
			});

			unsubscribeProfilePicture = subscribeToProfilePicture(userId, ({ profilePicture }) => {
				sendProfilePicture(profilePicture);
			});

			unsubscribeAssignmentSubmitted = subscribeToAssignmentSubmitted(
				userId,
				({ assignmentId, userAssignmentId, status }) => {
					sendAssignmentSubmitted({ assignmentId, userAssignmentId, status });
				}
			);

			unsubscribeAssignmentCreated = subscribeToAssignmentCreated(
				userId,
				({ courseId, assignment }) => {
					sendAssignmentCreated({ courseId, assignment });
				}
			);

			pingInterval = setInterval(() => {
				if (isClosed) return;
				controller.enqueue(encoder.encode(': ping\n\n'));
			}, 25000);

			autosaveInterval = setInterval(() => {
				sendAutosaveTick();
			}, autosaveIntervalMs);
		},
		cancel() {
			if (autosaveInterval) {
				clearInterval(autosaveInterval);
			}
			if (pingInterval) {
				clearInterval(pingInterval);
			}
			if (unsubscribeTheme) {
				unsubscribeTheme();
			}
			if (unsubscribeProfilePicture) {
				unsubscribeProfilePicture();
			}
			if (unsubscribeAssignmentSubmitted) {
				unsubscribeAssignmentSubmitted();
			}
			if (unsubscribeAssignmentCreated) {
				unsubscribeAssignmentCreated();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
