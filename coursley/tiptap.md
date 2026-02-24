# TipTap Implementation Guide

This guide explains how to add TipTap to the SvelteKit app in this repo.

## 1) Install packages

Use your package manager of choice (pnpm is already in this repo):

```bash
pnpm add @tiptap/core @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-underline
```

Optional extensions you might want later:

```bash
pnpm add @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

## 2) Create a reusable editor component

Create a new Svelte component, for example:

- `src/lib/components/TiptapEditor.svelte`

Example implementation:

```svelte
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import Underline from '@tiptap/extension-underline';

	export let content: string = '';
	export let placeholder = 'Write something...';

	let editor: Editor | null = null;
	let editorElement: HTMLDivElement;

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			content,
			extensions: [
				StarterKit,
				Underline,
				Link.configure({
					openOnClick: false,
					autolink: true
				}),
				Placeholder.configure({ placeholder })
			],
			onUpdate: ({ editor }) => {
				content = editor.getHTML();
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
		editor = null;
	});
</script>

<div class="tiptap" bind:this={editorElement}></div>

<style>
	.tiptap {
		min-height: 240px;
		padding: 16px;
		border: 1px solid #d0d0d0;
		border-radius: 8px;
		background: #ffffff;
	}

	.tiptap :global(p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #999999;
		pointer-events: none;
		height: 0;
	}
</style>
```

Notes:

- This uses the headless TipTap core API and mounts to a `div`.
- `content` is a prop that you can read/write from the parent.
- TipTap is client-only. Keep it inside client-rendered Svelte components.

## 3) Use the editor on a page

Example usage in a page or layout:

```svelte
<script lang="ts">
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';

	let html = '<p>Hello TipTap</p>';
</script>

<TiptapEditor bind:content={html} placeholder="Start writing..." />

<p>Current HTML:</p>
<pre>{html}</pre>
```

## 4) (Optional) Create a simple toolbar

Add a toolbar above the editor to toggle formatting.

```svelte
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	let editor: Editor | null = null;
	let editorElement: HTMLDivElement;

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			extensions: [StarterKit],
			content: ''
		});
	});

	onDestroy(() => editor?.destroy());

	const toggleBold = () => editor?.chain().focus().toggleBold().run();
	const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
	const toggleBullet = () => editor?.chain().focus().toggleBulletList().run();
</script>

<div class="toolbar">
	<button on:click={toggleBold} type="button">Bold</button>
	<button on:click={toggleItalic} type="button">Italic</button>
	<button on:click={toggleBullet} type="button">Bullet</button>
</div>

<div class="tiptap" bind:this={editorElement}></div>
```

## 5) Persist editor content

- Save `content` as HTML or JSON in your database.
- Example HTML save: `editor.getHTML()`
- Example JSON save: `editor.getJSON()`

If you want JSON, update the component to emit JSON instead of HTML.

## 6) SSR and routing notes

TipTap depends on the DOM and should only run in the browser:

- Keep TipTap code in `.svelte` components that only mount in the browser.
- Avoid instantiating TipTap in `+page.server.ts` or `+layout.server.ts`.

## 7) Styling

TipTap is unstyled by default. You can add global styles to your app:

```css
.tiptap h1 {
	font-size: 1.6rem;
	margin: 0.6rem 0;
}
.tiptap h2 {
	font-size: 1.3rem;
	margin: 0.6rem 0;
}
.tiptap ul {
	padding-left: 1.25rem;
}
.tiptap code {
	background: #f5f5f5;
	padding: 0 4px;
	border-radius: 4px;
}
```

## 8) Next steps

- Add a toolbar component tailored to your editor page.
- Create a save action in your `+page.server.ts` to persist content.
- Add autosave with a debounce (e.g. 500ms).
