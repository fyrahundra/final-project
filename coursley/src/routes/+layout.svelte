<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	let isDarkMode = false;

	onMount(() => {
		const applyFromStorage = () => {
			isDarkMode = localStorage.getItem('theme') === 'dark';
		};

		const onThemeChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ theme: 'light' | 'dark' }>;
			isDarkMode = customEvent.detail?.theme === 'dark';
		};

		applyFromStorage();
		window.addEventListener('theme-change', onThemeChange as EventListener);
		window.addEventListener('storage', applyFromStorage);

		return () => {
			window.removeEventListener('theme-change', onThemeChange as EventListener);
			window.removeEventListener('storage', applyFromStorage);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell" class:dark-mode={isDarkMode}>
	<slot />
</div>

<style>
	:root {
		--primary-color: #4a90e2;
		--secondary-color: #f5f5f5;
		--text-color: #333333;
		--accent-color: #e94e77;
		--font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		--background-color: #ffffff;
		--secondary-background-color: #f5f5f5;
	}

	.app-shell.dark-mode {
		--secondary-color: #333333;
		--text-color: #f5f5f5;
		--accent-color: #e94e77;
		--background-color: #1a1a1a;
		--secondary-background-color: #111111;
	}

	.app-shell {
		font-family: var(--font-family);
		background-color: var(--background-color);
		color: var(--text-color);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		width: 100%;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	:global(a) {
		color: var(--primary-color);
		text-decoration: none;
	}

	:global(a:hover) {
		text-decoration: underline;
	}
</style>
