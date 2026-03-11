<script lang="ts">
	import { onMount } from 'svelte';
	import UserDisplay from '../user_display.svelte';

	export let data;

	let currentTheme: 'light' | 'dark' = data.user?.theme ?? 'light';
	$: user = data.user ? { ...data.user, theme: currentTheme } : null;

	function applyTheme(theme: 'light' | 'dark') {
		localStorage.setItem('theme', theme);
		window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
	}

	onMount(() => {
		applyTheme(currentTheme);

		const source = new EventSource('/streams');
		source.addEventListener('theme', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as { theme: 'light' | 'dark' };
			currentTheme = payload.theme;
			applyTheme(currentTheme);
		});

		return () => {
			source.close();
		};
	});
</script>

<div class="auth-layout">
	<div class="topbar">
		<h1 class="title">Coursley</h1>
		<!--TODO: Implement user info display with profile picture-->
		{#if data.user}
			<UserDisplay {user} />
		{/if}
	</div>
	<div class="sidebar">
		<nav>
			<ul>
				<h3><a href="/courses">My Courses</a></h3>
				{#each data.courses as course}
					<li><a href={`/courses/${course.id}`}>{course.title}</a></li>
				{/each}
			</ul>
		</nav>
		{#if data.user && data.user.role === 'instructor'}
			<form action="/api/courses" method="POST">
				<label for="title">Course Title:</label>
				<input type="text" name="title" placeholder="Course Title" required />
				<label for="description">Course Description:</label>
				<input type="text" name="description" placeholder="Course Description" required />
				<button type="submit">Create Course</button>
			</form>
		{/if}
	</div>
	<main>
		<slot></slot>
	</main>
</div>

<style>
	.auth-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-width: 100vw;
		padding: 2rem;
		background-color: var(--secondary-background-color);
	}

	main {
		position: absolute;
		top: 9%;
		left: 18%;
		width: 80%;
		height: 90%;
		padding: 1rem;
	}

	.topbar {
		display: flex;
		flex-direction: row;
		position: absolute;
		width: 100%;
		height: 5%;
		top: 0;
		padding: 1rem;
		background-color: #333333;
		color: #ffffff;
		text-align: center;
		justify-content: space-between;
		align-items: center;
	}

	.sidebar {
		position: absolute;
		left: 0;
		top: 9%;
		width: 15%;
		height: 100vh;
		background-color: var(--background-color);
		padding: 1rem;
	}

	.title {
		font-size: 1.5rem;
		position: relative;
		left: 1.5%;
	}
</style>
