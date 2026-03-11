type ThemeMode = 'light' | 'dark';

type ThemePayload = {
	userId: string;
	theme: ThemeMode;
};

type ThemeListener = (payload: ThemePayload) => void;

const THEME_CHANNEL = 'theme:changed';
const localListeners = new Map<string, Set<ThemeListener>>();

let redisReady = false;
let redisInitStarted = false;
let redisPublisher: import('redis').RedisClientType | null = null;

function notifyLocal(payload: ThemePayload) {
	const listeners = localListeners.get(payload.userId);
	if (!listeners) return;
	for (const listener of listeners) {
		listener(payload);
	}
}

async function initRedis() {
	if (redisReady || redisInitStarted) return;
	const redisUrl = process.env.REDIS_URL;
	if (!redisUrl) return;

	redisInitStarted = true;

	try {
		const { createClient } = await import('redis');
		const subscriber = createClient({ url: redisUrl });
		redisPublisher = createClient({ url: redisUrl });

		subscriber.on('error', (error) => {
			console.error('Redis subscriber error:', error);
		});
		redisPublisher.on('error', (error) => {
			console.error('Redis publisher error:', error);
		});

		await Promise.all([subscriber.connect(), redisPublisher.connect()]);

		await subscriber.subscribe(THEME_CHANNEL, (message) => {
			try {
				const payload = JSON.parse(message) as ThemePayload;
				notifyLocal(payload);
			} catch (error) {
				console.error('Failed to parse theme event:', error);
			}
		});

		redisReady = true;
	} catch (error) {
		console.error('Redis theme stream disabled:', error);
	}
}

export function subscribeToTheme(userId: string, listener: ThemeListener) {
	void initRedis();

	const listeners = localListeners.get(userId) ?? new Set<ThemeListener>();
	listeners.add(listener);
	localListeners.set(userId, listeners);

	return () => {
		const userListeners = localListeners.get(userId);
		if (!userListeners) return;
		userListeners.delete(listener);
		if (userListeners.size === 0) {
			localListeners.delete(userId);
		}
	};
}

export async function publishThemeChanged(payload: ThemePayload) {
	notifyLocal(payload);
	await initRedis();

	if (!redisReady || !redisPublisher) {
		return;
	}

	await redisPublisher.publish(THEME_CHANNEL, JSON.stringify(payload));
}
