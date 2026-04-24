<script lang="ts">
	export let action = '?/createAssignment';

	let assignmentType = 'essay';

	let tempAssignment = {
		title: '',
		description: '',
		essayContent: '',
		codeContent: ''
	};

	let templateWindow: Window | null = null;
	let templateId = '';

	$: selectedTemplateContent =
		assignmentType === 'code' ? tempAssignment.codeContent : tempAssignment.essayContent;

	function generateTemplateId() {
		return `template_${Date.now()}_${Math.random().toString(36).substring(7)}`;
	}

	async function openTemplateEditor() {
		templateId = generateTemplateId();

		const response = await fetch('/api/editor-entry', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				target: 'RTE',
				params: { mode: 'template', templateId }
			})
		});

		if (!response.ok) {
			console.error('Failed to create template editor entry token');
			return;
		}

		const payload = (await response.json()) as { url?: string };
		if (!payload.url) {
			console.error('Template editor entry URL missing in response');
			return;
		}

		templateWindow = window.open(payload.url, 'rte_template');

		const checkTemplate = setInterval(() => {
			const stored = localStorage.getItem(templateId);
			if (!stored) {
				return;
			}

			const templateData = JSON.parse(stored) as { content: string };
			tempAssignment.essayContent = templateData.content;
			localStorage.removeItem(templateId);
			clearInterval(checkTemplate);

			if (templateWindow && !templateWindow.closed) {
				templateWindow.close();
			}

			templateWindow = null;
		}, 500);
	}

	async function openCodeTemplateEditor() {
		templateId = generateTemplateId();

		const response = await fetch('/api/editor-entry', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				target: 'code_editor',
				params: { mode: 'template', templateId }
			})
		});

		if (!response.ok) {
			console.error('Failed to create code template editor entry token');
			return;
		}

		const payload = (await response.json()) as { url?: string };
		if (!payload.url) {
			console.error('Code template editor entry URL missing in response');
			return;
		}

		templateWindow = window.open(payload.url, 'code_template');

		const checkTemplate = setInterval(() => {
			const stored = localStorage.getItem(templateId);
			if (!stored) {
				return;
			}

			const templateData = JSON.parse(stored) as { content: string };
			tempAssignment.codeContent = templateData.content;
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
		<label for="type">Assignment Type:</label>
		<select name="type" id="type" bind:value={assignmentType}>
			<option value="code">Code Assignment</option>
			<option value="essay">Essay Assignment</option>
		</select>

		{#if assignmentType === 'essay'}
			<label for="content">Assignment Template:</label>
			<button type="button" on:click={openTemplateEditor}>Create Template</button>
			{#if tempAssignment.essayContent}
				<p class="template-status">Template created</p>
			{/if}
		{:else}
			<label for="content">Code Template:</label>
			<button type="button" on:click={openCodeTemplateEditor}>Create Code Template</button>
			{#if tempAssignment.codeContent}
				<p class="template-status">Code template created</p>
			{/if}
		{/if}
		<input type="hidden" name="content" value={selectedTemplateContent} />
		<button type="submit" disabled={!selectedTemplateContent}>Create Assignment</button>
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
