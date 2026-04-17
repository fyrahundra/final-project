<script lang="ts">
	import { enhance } from '$app/forms';
	export let action = '?/createAssignment';

	let tempAssignment = {
		title: '',
		description: '',
		content: ''
	};

	let templateWindow: Window | null = null;
	let templateId = '';

	function generateTemplateId() {
		return `template_${Date.now()}_${Math.random().toString(36).substring(7)}`;
	}

	function openTemplateEditor() {
		templateId = generateTemplateId();
		templateWindow = window.open(`/RTE?mode=template&templateId=${templateId}`, 'rte_template');

		const checkTemplate = setInterval(() => {
			const stored = localStorage.getItem(templateId);
			if (!stored) {
				return;
			}

			const templateData = JSON.parse(stored) as { content: string };
			tempAssignment.content = templateData.content;
			localStorage.removeItem(templateId);
			clearInterval(checkTemplate);

			if (templateWindow && !templateWindow.closed) {
				templateWindow.close();
			}

			templateWindow = null;
		}, 500);
	}
</script>

<div class="assignment-create">
	<h1 class="title">Create Assignment</h1>
	<form class="assignment-form" method="POST" {action}>
		<label for="title">Assignment Title:</label>
		<input
			type="text"
			name="title"
			placeholder="Assignment Title"
			bind:value={tempAssignment.title}
			required
		/>
		<label for="description">Assignment Description:</label>
		<input
			type="text"
			name="description"
			placeholder="Assignment Description"
			bind:value={tempAssignment.description}
			required
		/>
		<label for="content">Assignment Template:</label>
		<button type="button" on:click={openTemplateEditor}>Create Template</button>
		{#if tempAssignment.content}
			<p class="template-status">Template created</p>
		{/if}
		<input type="hidden" name="content" value={tempAssignment.content} />
		<button type="submit" disabled={!tempAssignment.content}>Create Assignment</button>
	</form>
</div>

<style>
	.assignment-create {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
		color: #333333;
	}

	.title {
		text-align: center;
		margin-bottom: 20px;
	}

	.assignment-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.assignment-form input {
		margin-bottom: 10px;
		padding: 10px;
		font-size: 1rem;
	}

	.assignment-form button {
		padding: 10px;
		font-size: 1rem;
		background-color: #0070f3;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.assignment-form button:hover {
		background-color: #005bb5;
	}

	.assignment-form button:disabled {
		background-color: #94a3b8;
		cursor: not-allowed;
	}

	.template-status {
		margin: 0;
		color: #15803d;
		font-weight: 600;
	}
</style>
