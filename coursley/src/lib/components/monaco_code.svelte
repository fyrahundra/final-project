<script lang="ts">
	import type * as monacoEditor from 'monaco-editor';
	import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import { onMount } from 'svelte';

	type AppTheme = 'light' | 'dark';

	export let data;

	let monacoModule: typeof monacoEditor | undefined;
	let currentTheme: AppTheme = data?.user?.theme === 'dark' ? 'dark' : 'light';

	let editorElement: HTMLDivElement;
	let editor: monacoEditor.editor.IStandaloneCodeEditor | undefined;

	function toMonacoTheme(theme: AppTheme): 'vs-light' | 'vs-dark' {
		return theme === 'dark' ? 'vs-dark' : 'vs-light';
	}

	function applyMonacoTheme(theme: AppTheme) {
		if (!monacoModule) return;
		monacoModule.editor.setTheme(toMonacoTheme(theme));
	}

	function detectTheme(): AppTheme {
		const shell = document.querySelector('.app-shell');
		if (shell?.classList.contains('dark-mode')) {
			return 'dark';
		}

		const stored = localStorage.getItem('theme');
		if (stored === 'dark' || stored === 'light') {
			return stored;
		}

		return currentTheme;
	}

	function syncTheme() {
		const nextTheme = detectTheme();
		if (nextTheme === currentTheme) return;
		currentTheme = nextTheme;
		applyMonacoTheme(nextTheme);
	}

	export function getCode(): string {
		return editor?.getValue() ?? '';
	}

	onMount(() => {
		let shellObserver: MutationObserver | undefined;

		const onThemeChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ theme?: AppTheme }>;
			const nextTheme = customEvent.detail?.theme;
			if (nextTheme) {
				currentTheme = nextTheme;
				applyMonacoTheme(nextTheme);
				return;
			}

			syncTheme();
		};

		const onStorageChange = (event: StorageEvent) => {
			if (event.key !== 'theme') return;
			syncTheme();
		};

		window.addEventListener('theme-change', onThemeChange as EventListener);
		window.addEventListener('storage', onStorageChange);

		const initialize = async () => {
			const monaco = await import('monaco-editor');
			await import('monaco-editor/esm/vs/basic-languages/python/python.contribution.js');
			monacoModule = monaco;

			(globalThis as typeof globalThis & { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
				getWorker: () => new EditorWorker()
			};

			currentTheme = detectTheme();

			const shell = document.querySelector('.app-shell');
			if (shell) {
				shellObserver = new MutationObserver(() => {
					syncTheme();
				});
				shellObserver.observe(shell, {
					attributes: true,
					attributeFilter: ['class']
				});
			}

			editor = monaco.editor.create(editorElement, {
				value: "print('Hello, World!')\n",
				language: 'python',
				theme: toMonacoTheme(currentTheme),
				automaticLayout: true,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				fontFamily: 'Courier New, monospace',
				fontSize: 14,
				wordWrap: 'off'
			});
		};

		void initialize();

		return () => {
			window.removeEventListener('theme-change', onThemeChange as EventListener);
			window.removeEventListener('storage', onStorageChange);
			shellObserver?.disconnect();
			editor?.dispose();
			editor = undefined;
			monacoModule = undefined;
		};
	});
</script>

<div bind:this={editorElement} class="editor"></div>

<style>
	.editor {
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}
</style>