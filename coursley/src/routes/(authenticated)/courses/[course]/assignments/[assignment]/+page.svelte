<script lang="ts">
	export let data;

	function openInNewTab(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if data.error}
	<div class="error">
		<p>{data.error}</p>
	</div>
{:else if data.assignment && data.userAssignment}
	<h1>{data.assignment?.title}</h1>
	<h3>{data.assignment?.description}</h3>

	<button on:click={() => openInNewTab(`/RTE?id=${data.userAssignment?.id}`)}
		>Open Assignment</button
	>
{:else}
	<p>Loading...</p>
{/if}
