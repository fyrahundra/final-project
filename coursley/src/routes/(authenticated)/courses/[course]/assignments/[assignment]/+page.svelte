<script lang="ts">
	export let data;

	function openInNewTab(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

<h1>{data.assignment?.title}</h1>
<h3>{data.assignment?.description}</h3>
<p>{data.assignment?.content}</p>

<button on:click={() => openInNewTab(`/RTE`)}>Open Assignment</button>
