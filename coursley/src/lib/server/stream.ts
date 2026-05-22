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

type AssignmentCreatedPayload = {
	userId: string;
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
};
type AdminRequestChangedPayload = {
	event: 'created' | 'approved' | 'rejected';
	requestId: string;
};
type UserRoleChangedPayload = {
	userId: string;
	role: string;
	pendingInstructor: boolean;
};

type ThemeListener = (payload: ThemePayload) => void;
type ProfilePictureListener = (payload: ProfilePicturePayload) => void;
type AssignmentSubmittedListener = (payload: AssignmentSubmittedPayload) => void;
type AssignmentCreatedListener = (payload: AssignmentCreatedPayload) => void;
type AdminRequestChangedListener = (payload: AdminRequestChangedPayload) => void;

type UserRoleChangedListener = (payload: UserRoleChangedPayload) => void;

type StudentCountChangedPayload = {
	courseId: string;
	count: number;
};

type StudentCountChangedListener = (payload: StudentCountChangedPayload) => void;

const localListeners = new Map<string, Set<ThemeListener>>();
const localProfilePictureListeners = new Map<string, Set<ProfilePictureListener>>();
const localAssignmentSubmittedListeners = new Map<string, Set<AssignmentSubmittedListener>>();
const localAssignmentCreatedListeners = new Map<string, Set<AssignmentCreatedListener>>();
const localAdminRequestListeners = new Set<AdminRequestChangedListener>();
const localUserRoleListeners = new Map<string, Set<UserRoleChangedListener>>();
const localStudentCountListeners = new Map<string, Set<StudentCountChangedListener>>();

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

function notifyLocalAssignmentCreated(payload: AssignmentCreatedPayload) {
	const listeners = localAssignmentCreatedListeners.get(payload.userId);
	if (!listeners) return;
	for (const listener of listeners) {
		listener(payload);
	}
}

function notifyLocalAdminRequestChanged(payload: AdminRequestChangedPayload) {
	for (const listener of localAdminRequestListeners) {
		listener(payload);
	}
}

function notifyLocalUserRoleChanged(payload: UserRoleChangedPayload) {
	const listeners = localUserRoleListeners.get(payload.userId);
	if (!listeners) return;
	for (const listener of listeners) {
		listener(payload);
	}
}

function notifyLocalStudentCountChanged(payload: StudentCountChangedPayload) {
	const listeners = localStudentCountListeners.get(payload.courseId);
	if (!listeners) return;
	for (const listener of listeners) {
		listener(payload);
	}
}

export function subscribeToTheme(userId: string, listener: ThemeListener) {
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
	const listeners =
		localAssignmentSubmittedListeners.get(userId) ?? new Set<AssignmentSubmittedListener>();
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

export function subscribeToAssignmentCreated(userId: string, listener: AssignmentCreatedListener) {
	const listeners =
		localAssignmentCreatedListeners.get(userId) ?? new Set<AssignmentCreatedListener>();
	listeners.add(listener);
	localAssignmentCreatedListeners.set(userId, listeners);

	return () => {
		const userListeners = localAssignmentCreatedListeners.get(userId);
		if (!userListeners) return;
		userListeners.delete(listener);
		if (userListeners.size === 0) {
			localAssignmentCreatedListeners.delete(userId);
		}
	};
}

export async function publishThemeChanged(payload: ThemePayload) {
	notifyLocal(payload);
}

export async function publishProfilePictureChanged(payload: ProfilePicturePayload) {
	notifyLocalProfilePicture(payload);
}

export async function publishAssignmentSubmitted(payload: AssignmentSubmittedPayload) {
	notifyLocalAssignmentSubmitted(payload);
}

export async function publishAssignmentCreated(payload: AssignmentCreatedPayload) {
	notifyLocalAssignmentCreated(payload);
}

export function subscribeToAdminRequest(listener: AdminRequestChangedListener) {
	localAdminRequestListeners.add(listener);

	return () => {
		localAdminRequestListeners.delete(listener);
	};
}

export async function publishAdminRequestChanged(payload: AdminRequestChangedPayload) {
	notifyLocalAdminRequestChanged(payload);
}

export function subscribeToUserRoleChanged(userId: string, listener: UserRoleChangedListener) {
	const listeners = localUserRoleListeners.get(userId) ?? new Set<UserRoleChangedListener>();
	listeners.add(listener);
	localUserRoleListeners.set(userId, listeners);

	return () => {
		const userListeners = localUserRoleListeners.get(userId);
		if (!userListeners) return;
		userListeners.delete(listener);
		if (userListeners.size === 0) {
			localUserRoleListeners.delete(userId);
		}
	};
}

export async function publishUserRoleChanged(payload: UserRoleChangedPayload) {
	notifyLocalUserRoleChanged(payload);
}

export function subscribeToStudentCountChanged(
	courseId: string,
	listener: StudentCountChangedListener
) {
	const listeners =
		localStudentCountListeners.get(courseId) ?? new Set<StudentCountChangedListener>();
	listeners.add(listener);
	localStudentCountListeners.set(courseId, listeners);

	return () => {
		const courseListeners = localStudentCountListeners.get(courseId);
		if (!courseListeners) return;
		courseListeners.delete(listener);
		if (courseListeners.size === 0) {
			localStudentCountListeners.delete(courseId);
		}
	};
}

export async function publishStudentCountChanged(payload: StudentCountChangedPayload) {
	notifyLocalStudentCountChanged(payload);
}
