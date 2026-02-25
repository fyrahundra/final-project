<!--This should be given its own layout and route for a more google docs + classroom feeling-->
<script lang="ts">
	import { EditorContent } from 'svelte-tiptap';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Subscript from '@tiptap/extension-subscript'
	import Superscript from '@tiptap/extension-superscript'
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { writable } from 'svelte/store';

	let editor: Editor;
	let contentElement: HTMLDivElement;
	
	export let data;

    let title = data.assignment?.contentTitle || 'Untitled Document';
	let editorReactivity = 0;
	const update = writable(0);

	onMount(() => {
		let startContent = JSON.parse(data.assignment?.content || '');
		editor = new Editor({
			element: contentElement,
			extensions: [StarterKit, Subscript, Superscript],
			content: startContent,
			onUpdate: () => {
				editorReactivity ++;
				update.update(n => n + 1);
			},
			onSelectionUpdate: () => {
				editorReactivity ++;
				update.update(n => n + 1);
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	const handleClick = () => {
		editor?.commands.focus();
	};

    const saveDocument = () => {
        const content = editor?.getJSON();
        const formData = new FormData();
        formData.append('id', data.assignment?.id || '');
        formData.append('content', JSON.stringify(content));

        fetch('/RTE?/saveDocument', {
            method: 'POST',
            body: formData
        })		
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('Document saved successfully');
            } else {
                console.error('Failed to save document');
            }
        })
        .catch(error => {
            console.error('Error saving document:', error);
        });
    };

	function actionTemplate(commandFn: (chain: any) => any, activeCheck: string, activeOptions: any = {}) {
		return {
			action: () => {
				commandFn(editor?.chain().focus()).run();
				update.update(n => n + 1);
			},
			isActive: () => activeOptions ? editor?.isActive(activeCheck, activeOptions) : editor?.isActive(activeCheck)
		};
	}

    // Formating functions
	let formatingOptions = [
        // Text formatting
		{ name: 'Bold', ...actionTemplate((chain) => chain.toggleBold(), 'bold') },
		{ name: 'Italic', ...actionTemplate((chain) => chain.toggleItalic(), 'italic') },
		{ name: 'Underline', ...actionTemplate((chain) => chain.toggleUnderline(), 'underline') },
		{ name: 'Strikethrough', ...actionTemplate((chain) => chain.toggleStrike(), 'strike') },
		{ name: 'Subscript', ...actionTemplate((chain) => chain.toggleSubscript(), 'subscript') },
		{ name: 'Superscript', ...actionTemplate((chain) => chain.toggleSuperscript(), 'superscript') },
        // List formatting
		{ name: 'List', ...actionTemplate((chain) => chain.toggleBulletList(), 'bulletList') },
		{ name: 'Numbered List', ...actionTemplate((chain) => chain.toggleOrderedList(), 'orderedList') },
        // Headers
		{ name: 'H1', ...actionTemplate((chain) => chain.toggleHeading({ level: 1 }), 'heading', { level: 1 }) }
    ];
</script>

<div class="editor-header">
	<form action="/RTE?/changeTitle" method="POST" use:enhance = {() => {
		return async ({ result }) => {
			if (result.type === 'success' && result.data && typeof result.data === 'object' && 'assignment' in result.data) {
				title = (result.data as { assignment: { contentTitle: string } }).assignment.contentTitle;
			} else {
				console.error('Failed to update title');
			}
		};
	}}>
		<input
			class="editor-title"
			name="title"
			type="text"
			bind:value={title}
			aria-label="Document title"
			onblur={(e) => e.currentTarget.form?.requestSubmit()}
		/>
		<input type="hidden" name="id" value={data.assignment?.id} />
	</form>
    <div class="editor-controls">
        {#each formatingOptions as option}
			{#key $update}
				<button
					type = "button"
					onclick={option.action}
					class:active={option.isActive()}
				>
					{option.name}
				</button>
			{/key}
			
        {/each}
    </div>
	<button onclick={saveDocument}>Save</button>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor-container" onclick={handleClick}>
	<div bind:this={contentElement} class="editor-content"></div>
</div>

<style>
	.editor-container {
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 1rem;
		height: 100%;
		width: 100%;
	}
	.editor-container:hover {
		border-color: #999;
		cursor: text;
	}

	.editor-header {
		position: sticky;
		z-index: 10;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		width: 95%;
	}

	.editor-title {
		font-size: 2rem;
		font-weight: 700;
		border: 0;
		background: transparent;
		padding: 0;
		outline: none;
		width: 100%;
	}

	.editor-title:focus {
		outline: 2px solid #7aa7ff;
		outline-offset: 4px;
	}

    .editor-controls {
        display: flex;
        gap: 0.5rem;
		background-color: #999;
		padding: 0.3rem 0.6rem;
		border-radius: 17px;
    }

	.editor-controls button {
		background: none;
		border: none;
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.editor-controls button:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.editor-controls button.active {
		background-color: black;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
	}

	:global(.ProseMirror) {
		height: 100%;
		outline: none;
	}

	:global(html, body) {
		height: 100%;
		margin: 0;
		overflow: visible;
	}
</style>
