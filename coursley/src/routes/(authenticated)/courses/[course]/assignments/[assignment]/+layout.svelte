<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let data;

	const assignment = data.assignment;
	const isInstructorView = data.isInstructorView;
	const accessError = data.accessError;
	let studentAssignments: any[] = data.studentAssignments ?? [];
	let source: EventSource | null = null;

	function getEditorTarget() {
		return assignment?.type === 'code' ? 'code_editor' : 'RTE';
	}

	onMount(() => {
		if (!isInstructorView) return;

		source = new EventSource('/streams');

		source.addEventListener('assignment_submitted', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as {
				assignmentId: string;
				userAssignmentId: string;
				status: string;
			};

			if (payload.assignmentId !== assignment?.id) return;

			studentAssignments = studentAssignments.map((submission) =>
				submission.id === payload.userAssignmentId
					? { ...submission, status: payload.status }
					: submission
			);
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

{#if accessError}
	<div class="error">
		<p>{accessError}</p>
	</div>
{:else if assignment && isInstructorView}
	<section class="assignment-card">
		<h1>{assignment?.title}</h1>
		<p>{assignment?.description}</p>
		<button class="open-btn" onclick={() => openEditor({ id: String(assignment?.id) })}>
			Open Assignment
		</button>
	</section>

	<h4 class="section-title">Student submissions</h4>
	{#if studentAssignments?.length}
		<ul class="submission-list">
			{#each studentAssignments as submission}
				<li class="submission-card">
					<div class="submission-meta">
						<strong>{submission.user?.name || submission.user?.email || submission.userId}</strong>
						<span class="status-badge">{submission.status}</span>
					</div>
					<button
						class="open-btn"
						onclick={() => openEditor({ id: String(submission.id), view: 'only' })}
						>Open Submission</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty-state">No student submissions yet.</p>
	{/if}
{:else}
	<slot></slot>
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
		margin: 0;
		color: var(--card-p);
	}

	.section-title {
		margin: 1rem 0 0.75rem 0;
		font-size: 1rem;
		color: var(--text-color);
	}

	.submission-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.7rem;
		max-height: min(58vh, 560px);
		overflow-y: auto;
		padding-right: 0.25rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.submission-list::-webkit-scrollbar {
		display: none;
	}

	.submission-card {
		background: var(--card-color);
		border: 1px solid var(--text-color);
		border-radius: 0.75rem;
		padding: 0.8rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
	}

	.submission-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
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

	.empty-state {
		color: var(--text-color);
		background: var(--card-color);
		border: 1px dashed var(--text-color);
		padding: 0.8rem;
		border-radius: 0.75rem;
	}
</style>
