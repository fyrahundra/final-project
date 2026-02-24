<!--This should be given its own layout and route for a more google docs + classroom feeling-->
<script lang="ts">
	import { EditorContent } from 'svelte-tiptap';
    import { enhance } from '$app/forms';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { onMount, onDestroy } from 'svelte';

	let editor: Editor;
	let contentElement: HTMLDivElement;
	
	export let data

    let title = data.assignment?.title || 'Untitled Document';

	$: if (data.assignment?.title && !title) {
		title = data.assignment.title;
	}

	onMount(() => {
		editor = new Editor({
			element: contentElement,
			extensions: [StarterKit],
			content: ''
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
        // Implement your save logic here, e.g., send content to a server or save to local storage
        console.log('Document saved:', content);
    };

    // Formating functions
    let formatingOptions = [
        // Text formatting
        { name: 'Bold', action: () => {
            editor?.chain().focus().toggleBold().run();
        }},
        { name: 'Italic', action: () => {
            editor?.chain().focus().toggleItalic().run();
        }},
        { name: 'Underline', action: () => {
            editor?.chain().focus().toggleUnderline().run();
        }},
        // List formatting
        { name: 'List', action: () => {
            editor?.chain().focus().toggleBulletList().run();
        }},
        { name: 'Numbered List', action: () => {
            editor?.chain().focus().toggleOrderedList().run();
        }},
        // Headers
        { name: 'Header 1', action: () => {
            editor?.chain().focus().toggleHeading({ level: 1 }).run();
        }}
    ];
</script>

<div class="editor-header">
	<form action="?/changeTitle" method="POST" use:enhance>
		<input
			class="editor-title"
			name="title"
			type="text"
			bind:value={title}
			aria-label="Document title"
		/>
	</form>
    <div class="editor-controls">
        {#each formatingOptions as option}
            <button on:click={option.action}>{option.name}</button>
        {/each}
    </div>
	<button on:click={saveDocument}>Save</button>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor-container" on:click={handleClick}>
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
