<script>
	import EditorLayout from '$lib/components/layouts/editor_layout.svelte';
	export let data;
</script>

<EditorLayout {data}>
	<slot></slot>
</EditorLayout>
