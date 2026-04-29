<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let data;
	const assignment = data.assignment;
	const error = data.accessError ?? data.error;
	let userAssignment: any = data.userAssignment;
	let source: EventSource | null = null;

	function getEditorTarget() {
		return assignment?.type === 'code' ? 'code_editor' : 'RTE';
	}

	onMount(() => {
		source = new EventSource('/streams');

		source.addEventListener('assignment_submitted', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as {
				assignmentId: string;
				userAssignmentId: string;
				status: string;
			};

			if (payload.assignmentId !== assignment?.id) return;

			if (userAssignment?.id === payload.userAssignmentId) {
				userAssignment = {
					...userAssignment,
					status: payload.status
				};
			}
		});
	});

	onDestroy(() => {
		source?.close();
	});

	async function openEditor(params: Record<string, string> = {}) {
		const response = await fetch('/api/editor-entry', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ target: getEditorTarget(), params })
		});

		if (!response.ok) {
			console.error('Failed to create editor entry token');
			return;
		}

		const payload = (await response.json()) as { url?: string };
		if (!payload.url) {
			console.error('Editor entry URL missing in response');
			return;
		}

		window.open(payload.url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if error}
	<div class="error">
		<p>{error}</p>
	</div>
{:else if assignment && userAssignment}
	<section class="assignment-card">
		<h1>{assignment?.title}</h1>
		<p>{assignment?.description}</p>
		{#if userAssignment.status === 'submitted'}
			<p class="status-badge">Turned In</p>
			<div>
				<button
					class="open-btn"
					onclick={() =>
						openEditor({ id: String(userAssignment?.id ?? ''), view: 'only' })}
					>View Submission</button
				>
				<form action="?/takeBack" method="post">
					<button class="open-btn" type="submit"> Take Back </button>
					<input type="hidden" name="userAssignmentId" value={userAssignment?.id} />
					<input type="hidden" name="assignmentId" value={assignment?.id} />
					<input type="hidden" name="courseId" value={assignment?.courseId} />
				</form>
			</div>
		{:else}
			<button
				class="open-btn"
				onclick={() => openEditor({ id: String(userAssignment?.id ?? '') })}
				>Open Assignment</button
			>
		{/if}
	</section>
{:else}
	<p>Loading...</p>
{/if}

<style>
	.assignment-card {
		background: var(--card-color);
		border: 1px solid var(--text-color);
		border-radius: 0.75rem;
		padding: 1rem 1.2rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
		margin-bottom: 1rem;
	}

	.assignment-card h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.4rem;
	}

	.assignment-card p {
		margin: 0 0 1rem 0;
		color: var(--card-p);
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: var(--hover-color);
		color: var(--primary-color);
		text-transform: capitalize;
	}

	.open-btn {
		background: var(--primary-color);
		border: none;
		color: var(--text-color);
		padding: 0.45rem 0.8rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.open-btn:hover {
		opacity: 0.9;
	}
</style>
