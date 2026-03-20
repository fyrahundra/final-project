<script lang="ts">
	import AssignmentCreate from '$lib/components/assignment_create.svelte';

	import Colorpicker from '$lib/components/colorpicker.svelte';

	export let data;

	let showCreateAssignment = false;
</script>

<h1>{data.course?.title}</h1>
<h3>{data.course?.description}</h3>
<h4>Course ID: {data.course?.joinId}</h4>

<h2>Assignments</h2>
	{#if data.assignments?.length === 0}
		<p>No assignments yet.</p>
	{:else}
		<ul>
			{#each data.assignments as assignment}
				<li>
					<a href={`/courses/${data.course?.id}/assignments/${assignment.id}`}>{assignment.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

{#if data.course?.instructorId === data.user?.id}
	<button on:click={() => (showCreateAssignment = true)}>Create Assignment</button>
{/if}
{#if showCreateAssignment}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="assignment-create-backdrop" on:click={() => (showCreateAssignment = false)}>
		<div class="assignment-create-modal" on:click|stopPropagation>
			<AssignmentCreate action={`?/createAssignment`} />
		</div>
	</div>
{/if}

<style>
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
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		padding: 1rem;
	}
</style>
