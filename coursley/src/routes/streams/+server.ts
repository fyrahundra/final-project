import type { RequestHandler } from '@sveltejs/kit';
import { subscribeToTheme } from '$lib/server/theme-stream';

export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const encoder = new TextEncoder();
	const userId = locals.user.id;
	const initialTheme: 'light' | 'dark' = locals.user.theme === 'dark' ? 'dark' : 'light';
	let pingInterval: ReturnType<typeof setInterval> | undefined;
	let unsubscribe: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const sendTheme = (theme: 'light' | 'dark') => {
				const data = JSON.stringify({ theme });
				controller.enqueue(encoder.encode(`event: theme\ndata: ${data}\n\n`));
			};

			const cleanup = () => {
				if (pingInterval) {
					clearInterval(pingInterval);
					pingInterval = undefined;
				}
				if (unsubscribe) {
					unsubscribe();
					unsubscribe = undefined;
				}
			};

			request.signal.addEventListener('abort', cleanup);

			controller.enqueue(encoder.encode('retry: 3000\n\n'));
			sendTheme(initialTheme);

			unsubscribe = subscribeToTheme(userId, ({ theme }) => {
				sendTheme(theme);
			});

			pingInterval = setInterval(() => {
				controller.enqueue(encoder.encode(': ping\n\n'));
			}, 25000);
		},
		cancel() {
			if (pingInterval) {
				clearInterval(pingInterval);
			}
			if (unsubscribe) {
				unsubscribe();
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