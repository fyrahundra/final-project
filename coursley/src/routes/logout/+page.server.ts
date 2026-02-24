import type { Action } from './$types';
import { destroySession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions: Action = async ({ locals }) => {};
