type ThemeMode = 'light' | 'dark';

type ThemePayload = {
	userId: string;
	theme: ThemeMode;
};

type ProfilePicturePayload = {
	userId: string;
	profilePicture: string | null;
};

type AssignmentSubmittedPayload = {
	userId: string;
	assignmentId: string;
	userAssignmentId: string;
	status: string;
};

type ThemeListener = (payload: ThemePayload) => void;
type ProfilePictureListener = (payload: ProfilePicturePayload) => void;
type AssignmentSubmittedListener = (payload: AssignmentSubmittedPayload) => void;

const THEME_CHANNEL = 'theme:changed';
const PROFILE_PICTURE_CHANNEL = 'profile-picture:changed';
const ASSIGNMENT_SUBMITTED_CHANNEL = 'assignment:submitted';
const localListeners = new Map<string, Set<ThemeListener>>();
const localProfilePictureListeners = new Map<string, Set<ProfilePictureListener>>();
const localAssignmentSubmittedListeners = new Map<string, Set<AssignmentSubmittedListener>>();

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

function notifyLocalProfilePicture(payload: ProfilePicturePayload) {
	const listeners = localProfilePictureListeners.get(payload.userId);
	if (!listeners) return;
	for (const listener of listeners) {
		listener(payload);
	}
}

function notifyLocalAssignmentSubmitted(payload: AssignmentSubmittedPayload) {
	const listeners = localAssignmentSubmittedListeners.get(payload.userId);
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

		await subscriber.subscribe(PROFILE_PICTURE_CHANNEL, (message) => {
			try {
				const payload = JSON.parse(message) as ProfilePicturePayload;
				notifyLocalProfilePicture(payload);
			} catch (error) {
				console.error('Failed to parse profile picture event:', error);
			}
		});

		await subscriber.subscribe(ASSIGNMENT_SUBMITTED_CHANNEL, (message) => {
			try {
				const payload = JSON.parse(message) as AssignmentSubmittedPayload;
				notifyLocalAssignmentSubmitted(payload);
			} catch (error) {
				console.error('Failed to parse assignment submitted event:', error);
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

export function subscribeToProfilePicture(userId: string, listener: ProfilePictureListener) {
	void initRedis();

	const listeners = localProfilePictureListeners.get(userId) ?? new Set<ProfilePictureListener>();
	listeners.add(listener);
	localProfilePictureListeners.set(userId, listeners);

	return () => {
		const userListeners = localProfilePictureListeners.get(userId);
		if (!userListeners) return;
		userListeners.delete(listener);
		if (userListeners.size === 0) {
			localProfilePictureListeners.delete(userId);
		}
	};
}

export function subscribeToAssignmentSubmitted(
	userId: string,
	listener: AssignmentSubmittedListener
) {
	void initRedis();

	const listeners = localAssignmentSubmittedListeners.get(userId) ?? new Set<AssignmentSubmittedListener>();
	listeners.add(listener);
	localAssignmentSubmittedListeners.set(userId, listeners);

	return () => {
		const userListeners = localAssignmentSubmittedListeners.get(userId);
		if (!userListeners) return;
		userListeners.delete(listener);
		if (userListeners.size === 0) {
			localAssignmentSubmittedListeners.delete(userId);
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

export async function publishProfilePictureChanged(payload: ProfilePicturePayload) {
	notifyLocalProfilePicture(payload);
	await initRedis();

	if (!redisReady || !redisPublisher) {
		return;
	}

	await redisPublisher.publish(PROFILE_PICTURE_CHANNEL, JSON.stringify(payload));
}

export async function publishAssignmentSubmitted(payload: AssignmentSubmittedPayload) {
	notifyLocalAssignmentSubmitted(payload);
	await initRedis();

	if (!redisReady || !redisPublisher) {
		return;
	}

	await redisPublisher.publish(ASSIGNMENT_SUBMITTED_CHANNEL, JSON.stringify(payload));
}
