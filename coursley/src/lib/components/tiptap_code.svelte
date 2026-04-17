<script lang="ts">
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { onMount } from 'svelte';

	let editor: Editor;
	let editorElement: HTMLDivElement;

	export function getCode(): string {
		if (!editor) return '';
		return editor.getText({ blockSeparator: '\n' });
	}

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			content: "<p>print('Hello, World!')</p>",
			extensions: [StarterKit.configure({ link: false })],
			editable: true,
			autofocus: true,
			editorProps: {
				attributes: {
					autocorrect: 'off',
					autocapitalize: 'off',
					spellcheck: 'false'
				},
				handleKeyDown(view, event) {
					if (event.key === 'Tab') {
						event.preventDefault();
						const { state, dispatch } = view;
						dispatch(state.tr.insertText('    '));
						return true;
					}

					return false;
				}
			}
		});

		return () => {
			if (editor) {
				editor.destroy();
			}
		};
	});
</script>

<div id="editor" bind:this={editorElement} class="editor"></div>

<style global>
	:global(.ProseMirror) {
		outline: none;
		padding: 1rem;
		min-height: 100%;
		white-space: pre;
		min-width: 100%;
		width: max-content;
		box-sizing: border-box;
	}

	:global(.ProseMirror p) {
		margin: 0.5rem 0;
	}

	:global(.ProseMirror a) {
		color: inherit;
		text-decoration: none;
		pointer-events: none;
	}

	#editor {
		width: 100%;
		height: 100%;
		min-height: 100%;
		min-width: 0;
		font-family: 'Courier New', monospace;
		background: var(--background-color);
		cursor: text;
		color: var(--text-color);
		box-sizing: border-box;
		overflow: auto;
	}
</style>
