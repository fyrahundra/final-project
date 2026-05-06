<script lang="ts">
	import MonacoCode from '$lib/components/monaco_code.svelte';
	import { enhance } from '$app/forms';

	let output = '';
	let plots: string[] = [];
	let running = false;
	let saveMessage = '';
	let saveMessageTimer: ReturnType<typeof setTimeout> | undefined;
	let saveForm: HTMLFormElement;
	let monacoComponent: MonacoCode;
	let turnedIn = false;

	export let data;

	const isTemplate = Boolean(data?.isTemplate);
	const isViewOnly = Boolean(data?.isViewOnly);
	const templateId = String(data?.templateId ?? '');
	const documentId = String(data?.documentId ?? '');
	const defaultCode = "print('Hello, World!')\n";
	const initialCode = String(data?.content ?? defaultCode);

	function saveTemplate() {
		if (!isTemplate || !templateId) {
			return;
		}

		const code = monacoComponent.getCode();
		localStorage.setItem(templateId, JSON.stringify({ content: code }));
		window.close();
	}

	function saveCode() {
		if (isViewOnly) {
			return;
		}

		saveMessage = '';
		saveForm?.requestSubmit();
	}

	function handleSave({ formData }: { formData: FormData }) {
		formData.set('id', documentId);
		formData.set('content', monacoComponent.getCode());

		if (saveMessageTimer) {
			clearTimeout(saveMessageTimer);
		}

		const clearSaveMessage = () => {
			saveMessageTimer = setTimeout(() => {
				saveMessage = '';
			}, 2000);
		};

		return async ({ result }: { result: { type: string; data?: { success?: boolean; error?: string } } }) => {
			if (result.type === 'success' && result.data?.success) {
				saveMessage = 'Saved to database.';
				clearSaveMessage();
				return;
			}

			saveMessage = result.type === 'success'
				? result.data?.error ?? 'Save failed.'
				: 'Save failed.';
			clearSaveMessage();
		};
	}

	function handleTurnIn({ formData }: { formData: FormData }) {
		formData.set('id', documentId);

		if (saveMessageTimer) clearTimeout(saveMessageTimer);
		const clearSaveMessage = () => {
			saveMessageTimer = setTimeout(() => (saveMessage = ''), 2000);
		};

		return async ({ result }: { result: { type: string; data?: any } }) => {
			if (result.type === 'success' && result.data?.success) {
				saveMessage = 'Turned in.';
				turnedIn = true;
				clearSaveMessage();
				return;
			}

			saveMessage = result.type === 'success' ? result.data?.error ?? 'Turn in failed.' : 'Turn in failed.';
			clearSaveMessage();
		};
	}

	async function runCode() {
        plots = [];
		running = true;
		output = 'Running...';
		try {
			const code = monacoComponent.getCode();

			const res = await fetch('/api/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: code })
			});

			const data = await res.json();
            console.log('Response from server:', data);
			output = data.stdout || data.stderr || data.error || 'No output';
            if (data.plots) {
                console.log('Received plots:', data.plots);
                plots = data.plots; // Assuming this is an array of base64-encoded images
                console.log('Updated plots state:', plots);
            }
		} catch (err: any) {
			console.error('Error:', err.message);
			output = 'An error occurred while running the code.';
		} finally {
			running = false;
		}
	}

	function resolvePlotSrc(plot: string) {
		return plot.startsWith('data:') ? plot : `data:image/png;base64,${plot}`;
	}
</script>

<main>
	<div class="page-container">
		<h2 class="page-title">Code Editor</h2>

		<div class="editor-container">
			<div class="panel editor-panel">
				<div class="panel-header">
					<h3 class="panel-title">Code</h3>
					{#if saveMessage}
							<p class="save-status">{saveMessage}</p>
					{/if}
					{#if isTemplate}
						<p class="view-only-badge">Template Mode</p>
					{:else if isViewOnly}
						<p class="view-only-badge">View Only</p>
					{/if}
				</div>
				<div class="editor-wrapper">
					<MonacoCode bind:this={monacoComponent} {data} {initialCode} readOnly={isViewOnly} />
				</div>
				<div class="panel-footer">
					{#if isTemplate}
						<button class="save-button" on:click={saveTemplate}>Save Template</button>
					{:else if !isViewOnly}
						{#if !turnedIn}
							<button class="save-button" on:click={saveCode}>Save</button>
							<form method="POST" action="?/turnIn" class="turnin-form" use:enhance={handleTurnIn}>
								<input type="hidden" name="id" value={documentId} />
								<button class="save-button turnin-button" type="submit">Turn In</button>
							</form>
						{:else}
							<p class="save-status">Submission turned in.</p>
						{/if}
					{:else}
						<div class="view-only-spacer"></div>
					{/if}
					<button class="run-button" on:click={runCode} disabled={running}>
						{running ? 'Running...' : '▶ Run Code'}
					</button>
				</div>
				<form
					bind:this={saveForm}
					class="save-form"
					method="POST"
					action="?/saveDocument"
					use:enhance={handleSave}
				>
					<input type="hidden" name="id" value={documentId} />
					<input type="hidden" name="content" value={initialCode} />
				</form>
			</div>

			<div class="panel output-panel">
				<div class="panel-header">
					<h3 class="panel-title">Output</h3>
				</div>
				<div class="output-body">
					<div class="plots-container">
						{#if plots.length > 0}
							{#each plots as plot}
								<img src={resolvePlotSrc(plot)} alt="Plot" class="plot-image" />
							{/each}
						{:else}
							<p class="plots-empty">No plots yet. Run code that generates a plot.</p>
						{/if}
					</div>
					<pre class="output-content">{output}</pre>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	main {
		width: 100vw;
		height: 100vh;
		padding: 0;
		margin: 0;
		overflow: hidden;
		box-sizing: border-box;
	}

	.page-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		box-sizing: border-box;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		height: auto;
		color: var(--text-color);
		flex-shrink: 0;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		height: auto;
		color: var(--text-color);
		flex-shrink: 0;
	}

	.editor-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		width: 100%;
		height: calc(100% - 3.5rem);
		flex: 1;
	}

	.panel {
		display: flex;
		flex-direction: column;
		background: var(--card-color, white);
		border-radius: 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}

	.panel-header {
		padding: 1rem;
		border-bottom: 1px solid #e0e0e0;
		background: var(--secondary-background-color, #f5f5f5);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.panel-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color, #333);
	}

	.editor-panel {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}

	.editor-wrapper {
		flex: 1;
		overflow: auto;
		border-bottom: 1px solid #e0e0e0;
		width: 100%;
		min-height: 0;
		min-width: 0;
	}

	.panel-footer {
		padding: 1rem;
		background: var(--secondary-background-color, #f5f5f5);
		border-top: 1px solid #e0e0e0;
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
		align-items: center; /* ensure buttons align vertically */
	}

	.run-button {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		padding: 0 1.5rem;
		background: var(--primary-color, #4a90e2);
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.run-button:hover:not(:disabled) {
		background: #3a7bc8;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.run-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.save-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 40px;
		padding: 0 1rem;
		background: #15803d;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button:hover {
		background: #166534;
	}

	.turnin-form {
		margin-left: 0.5rem;
		display: inline-block;
	}

	.turnin-button {
		background: #f59e0b; /* amber/yellow */
		color: white;
	}

	.turnin-button:hover {
		background: #d97706;
	}

	.save-status {
		margin: 0;
		color: #909baa;
		font-size: 0.85rem;
	}

	.view-only-badge {
		margin: 0;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background: #e5e7eb;
		color: #374151;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.view-only-spacer {
		flex: 1;
	}

	.save-form {
		display: none;
	}

	.output-panel {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}

	.output-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
		min-width: 0;
		padding: 1rem;
		overflow: hidden;
		box-sizing: border-box;
	}

	.output-content {
		flex: 2 1 0;
		margin: 0;
		padding: 0.875rem 1rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-color, #333);
		overflow: auto;
		white-space: pre;
		word-wrap: normal;
		background: var(--background-color);
		width: 100%;
		min-width: 0;
		min-height: 0;
		box-sizing: border-box;
		border-radius: 0.375rem;
		border: 1px solid #e0e0e0;
	}

	.plots-container {
		display: grid;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		width: 100%;
		max-width: 100%;
		align-self: flex-start;
		flex: 0 0 auto;
		overflow: auto;
		box-sizing: border-box;
		background: var(--background-color);
		border: 1px solid #e0e0e0;
		border-radius: 0.375rem;
	}

	.plots-empty {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.plot-image {
		display: block;
		max-width: 100%;
		width: auto;
		height: auto;
		border-radius: 0.25rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }
</style>
