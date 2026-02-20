<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<slot />

<style>
	:global(body) {
		display: flex;
		flex-direction: column;
		margin: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background-color: #ffffff;
		color: #333333;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		overflow: hidden;
	}

	a {
		color: #0070f3;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
