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
</script>

<div class="editor-container">
    <div bind:this={contentElement}></div>
</div>

<style>
    .editor-container {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 1rem;
    }
    
    :global(.tiptap) {
        min-height: 200px;
        outline: none;
    }
    
    :global(.tiptap p) {
        margin: 0.5rem 0;
    }
</style>