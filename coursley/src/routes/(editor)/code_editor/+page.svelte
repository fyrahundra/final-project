<script lang="ts">
	import MonacoCode from '$lib/components/monaco_code.svelte';

	let output = '';
	let plots: string[] = [];
	let running = false;
	let monacoComponent: MonacoCode;

	export let data;

	const isTemplate = Boolean(data?.isTemplate);
	const templateId = String(data?.templateId ?? '');

	function saveTemplate() {
		if (!isTemplate || !templateId) {
			return;
		}

		const code = monacoComponent.getCode();
		localStorage.setItem(templateId, JSON.stringify({ content: code }));
		window.close();
	}

	function saveCode(){
		const code = monacoComponent.getCode();
	}

	async function runCode() {
        plots = [];
		running = true;
		output = 'Running...';
		try {
			const code = monacoComponent.getCode();

			const res = await fetch('http://localhost:8000/run', {
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
</script>

<main>
	<div class="page-container">
		<h2 class="page-title">Code Editor</h2>

		<div class="editor-container">
			<div class="panel editor-panel">
				<div class="panel-header">
					<h3 class="panel-title">Code</h3>
				</div>
				<div class="editor-wrapper">
					<MonacoCode bind:this={monacoComponent} {data} />
				</div>
				<div class="panel-footer">
					{#if isTemplate}
						<button class="save-button" on:click={saveTemplate}>Save Template</button>
					{/if}
					<button class="save-button" on:click={saveCode}>Save</button>
					<button class="run-button" on:click={runCode} disabled={running}>
						{running ? 'Running...' : '▶ Run Code'}
					</button>
				</div>
			</div>

			<div class="panel output-panel">
				<div class="panel-header">
					<h3 class="panel-title">Output</h3>
				</div>
				<div class="output-body">
					<div class="plots-container">
						{#if plots.length > 0}
							{#each plots as plot}
								<img src={plot} alt="Plot" class="plot-image" />
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
		width: 100%;
		height: 100vh;
		padding: 0;
		margin: 0;
		background:
			radial-gradient(circle at 12% 8%, rgba(255, 255, 255, 0.9) 0 9%, transparent 26%),
			linear-gradient(180deg, #eef3fb 0%, #edf0f5 40%, #e9edf2 100%);
		overflow: hidden;
		box-sizing: border-box;
	}

	.page-container {
		width: 100%;
		height: 100%;
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
		color: var(--text-color, #333);
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
	}

	.run-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
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
		padding: 0.75rem 1rem;
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
