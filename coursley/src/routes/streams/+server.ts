import type { RequestHandler } from '@sveltejs/kit';
import {
	subscribeToAssignmentSubmitted,
	subscribeToProfilePicture,
	subscribeToTheme
} from '$lib/server/stream';

export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const encoder = new TextEncoder();
	const userId = locals.user.id;
	const initialTheme: 'light' | 'dark' = locals.user.theme === 'dark' ? 'dark' : 'light';
	const initialProfilePicture = locals.user.profilePicture ?? null;
	let pingInterval: ReturnType<typeof setInterval> | undefined;
	let unsubscribeTheme: (() => void) | undefined;
	let unsubscribeProfilePicture: (() => void) | undefined;
	let unsubscribeAssignmentSubmitted: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const sendTheme = (theme: 'light' | 'dark') => {
				const data = JSON.stringify({ theme });
				controller.enqueue(encoder.encode(`event: theme\ndata: ${data}\n\n`));
			};

			const sendProfilePicture = (profilePicture: string | null) => {
				const data = JSON.stringify({ profilePicture });
				controller.enqueue(encoder.encode(`event: profile_picture\ndata: ${data}\n\n`));
			};

			const sendAssignmentSubmitted = (payload: {
				assignmentId: string;
				userAssignmentId: string;
				status: string;
			}) => {
				const data = JSON.stringify(payload);
				controller.enqueue(encoder.encode(`event: assignment_submitted\ndata: ${data}\n\n`));
			};

			const cleanup = () => {
				if (pingInterval) {
					clearInterval(pingInterval);
					pingInterval = undefined;
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
			};

			request.signal.addEventListener('abort', cleanup);

			controller.enqueue(encoder.encode('retry: 3000\n\n'));
			sendTheme(initialTheme);
			sendProfilePicture(initialProfilePicture);

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

			pingInterval = setInterval(() => {
				controller.enqueue(encoder.encode(': ping\n\n'));
			}, 25000);
		},
		cancel() {
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