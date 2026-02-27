<script lang="ts">
	export let data;

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
		templateWindow = window.open(
			`/RTE?mode=template&templateId=${templateId}`,
			'rte_template',
		);

		// Listen for storage changes to get template back
		const checkTemplate = setInterval(() => {
			const stored = localStorage.getItem(templateId);
			if (stored) {
				const templateData = JSON.parse(stored);
				tempAssignment.content = templateData.content;
				localStorage.removeItem(templateId);
				clearInterval(checkTemplate);
				if (templateWindow && templateWindow.closed) {
					// Window is closed, template ready
					templateWindow = null;
				} else {
					// Window still open, close it
					templateWindow?.close();
				}
			}
		}, 500);
	}
</script>

<h1>{data.course?.title}</h1>
<h3>{data.course?.description}</h3>

<h2>Assignments</h2>
<ul>
	{#each data.assignments as assignment}
		<li>
			<a href={`/courses/${data.course?.id}/assignments/${assignment.id}`}>{assignment.title}</a>
		</li>
	{/each}
</ul>

{#if data.user?.role === 'instructor'}
	<form action="?/createAssignment" method="POST">
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
		<button type="button" onclick={openTemplateEditor}>Create Template</button>
		{#if tempAssignment.content}
			<p>✓ Template created</p>
		{/if}
		<input type="hidden" name="content" value={tempAssignment.content} />
		<button type="submit" disabled={!tempAssignment.content}>Create Assignment</button>
	</form>
{/if}
