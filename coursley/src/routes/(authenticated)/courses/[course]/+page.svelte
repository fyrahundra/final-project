<script lang="ts">
	import AssignmentCreate from '$lib/components/assignment_create.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { resolve } from '$app/paths';

	export let data;

	let showCreateAssignment = false;
	let assignments = data.assignments ?? [];
	let studentCount = data.studentCount;
	type AssignmentItem = (typeof assignments)[number];
	let source: EventSource | null = null;

	onMount(() => {
		source = new EventSource('/streams');

		source.addEventListener('assignment_created', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as {
				courseId: string;
				assignment: AssignmentItem;
			};

			if (payload.courseId !== String(data.course?.id)) return;
			if (assignments.some((assignment) => assignment.id === payload.assignment.id)) return;

			assignments = [...assignments, payload.assignment];
		});

		source.addEventListener('student_count_changed', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as { courseId: string; count: number };

			if (payload.courseId !== String(data.course?.id)) return;
			studentCount = payload.count;
		});
	});

	onDestroy(() => {
		source?.close();
	});
</script>

<h1>{data.course?.title}</h1>
<h3>{data.course?.description}</h3>

<div class="course-meta-row">
	{#if data.isInstructor}
		<div class="meta-info">
			<h4>Course ID: {data.course?.joinId}</h4>
			<h4>Students: {studentCount}</h4>
		</div>
		<button class="create-btn" on:click={() => (showCreateAssignment = true)}
			>Create Assignment</button
		>
	{:else}
		<h4>Students: {studentCount}</h4>
	{/if}
</div>

<h2>Assignments</h2>
{#if assignments?.length === 0}
	<p class="empty-state">No assignments yet.</p>
{:else}
	<ul class="assignment-list">
		{#each assignments as assignment (assignment.id)}
			<li class="assignment-card">
				<a
					class="assignment-link"
					href={resolve(`/courses/${data.course?.id}/assignments/${assignment.id}`)}
					>{assignment.title}</a
				>
			</li>
		{/each}
	</ul>
{/if}
{#if showCreateAssignment}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="assignment-create-backdrop" on:click={() => (showCreateAssignment = false)}>
		<div class="assignment-create-modal" on:click|stopPropagation>
			<AssignmentCreate action="?/createAssignment" />
		</div>
	</div>
{/if}

<style>
	.course-meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.course-meta-row h4 {
		margin: 0;
	}

	.meta-info {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.meta-info h4 {
		margin: 0;
	}

	.assignment-list {
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

	.assignment-list::-webkit-scrollbar {
		display: none;
	}

	.assignment-card {
		background: var(--card-color);
		border: 1px solid var(--text-color);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: box-shadow 0.15s ease;
	}

	.assignment-card:hover {
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	}

	.assignment-link {
		text-decoration: none;
		color: var(--primary-color);
		font-weight: 600;
		font-size: 1rem;
	}

	.assignment-link:hover {
		text-decoration: underline;
	}

	.empty-state {
		color: var(--text-color);
		background: var(--card-color);
		border: 1px dashed var(--text-color);
		padding: 1rem;
		border-radius: 0.75rem;
	}

	.create-btn {
		padding: 0.45rem 0.8rem;
		border: none;
		border-radius: 0.5rem;
		background: var(--primary-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.create-btn:hover {
		opacity: 0.92;
	}

	.assignment-create-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.assignment-create-modal {
		width: min(92vw, 640px);
		background: var(--background-color);
		border-radius: 10px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		padding: 1rem;
	}
</style>
