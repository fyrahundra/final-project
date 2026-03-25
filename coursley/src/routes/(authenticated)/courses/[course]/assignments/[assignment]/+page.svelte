<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let data;
	const assignment = data.assignment;
	const isInstructorView = data.isInstructorView;
	const error = data.error;
	let userAssignment: any = data.userAssignment;
	let studentAssignments: any[] = data.studentAssignments ?? [];
	let source: EventSource | null = null;

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

			if (isInstructorView && studentAssignments.length) {
				studentAssignments = studentAssignments.map((submission) =>
					submission.id === payload.userAssignmentId
						? { ...submission, status: payload.status }
						: submission
				);
			}
		});
	});

	onDestroy(() => {
		source?.close();
	});

	function openInNewTab(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if error}
	<div class="error">
		<p>{error}</p>
	</div>
{:else if assignment && isInstructorView}
	<section class="assignment-card">
		<h1>{assignment?.title}</h1>
		<p>{assignment?.description}</p>
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
					<button class="open-btn" onclick={() => openInNewTab(`/RTE?id=${submission.id}`)}
						>Open Submission</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty-state">No student submissions yet.</p>
	{/if}
{:else if assignment && userAssignment}
	<section class="assignment-card">
		<h1>{assignment?.title}</h1>
		<p>{assignment?.description}</p>
		{#if userAssignment.status === 'submitted'}
			<p class="status-badge">Turned In</p>
			<div>
			<button class="open-btn" onclick={() => openInNewTab(`/RTE?id=${userAssignment?.id}&view=submission`)}
				>View Submission</button
			>
			<form action="?/takeBack" method="post">
				<button class="open-btn" type="submit">
					Take Back
				</button>
				<input type="hidden" name="userAssignmentId" value={userAssignment?.id} />
				<input type="hidden" name="assignmentId" value={assignment?.id} />
				<input type="hidden" name="courseId" value={assignment?.courseId} />
			</form>
			</div>
		{:else}
			<button class="open-btn" onclick={() => openInNewTab(`/RTE?id=${userAssignment?.id}`)}
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
