<!--This should be given its own layout and route for a more google docs + classroom feeling-->
<script lang="ts">
    import { EditorContent } from 'svelte-tiptap';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import { onMount, onDestroy } from 'svelte';
    
    let editor: Editor;
    let contentElement: HTMLDivElement;
    
    onMount(() => {
        editor = new Editor({
            element: contentElement,
            extensions: [StarterKit],
            content: '',
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
</script>

<div class="editor-header">
    <h1>Untitled Document</h1>
    <button>Save</button>
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