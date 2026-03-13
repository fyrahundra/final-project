<script lang="ts">
	import { onMount } from 'svelte';
	import UserDisplay from '../user_display.svelte';
	import CourseCreate from '../course_create.svelte';

	export let data;

	let currentTheme: 'light' | 'dark' = data.user?.theme ?? 'light';
	let currentProfilePicture: string | null = data.user?.profilePicture ?? null;
	let isCreateCourseOpen = false;
	$: user = data.user
		? { ...data.user, theme: currentTheme, profilePicture: currentProfilePicture }
		: null;

	function applyTheme(theme: 'light' | 'dark') {
		localStorage.setItem('theme', theme);
		window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
	}

	function handleProfilePictureUpdated(profilePicture: string) {
		currentProfilePicture = profilePicture;
	}

	function createCourse() {
		isCreateCourseOpen = true;
	}

	function closeCreateCourse() {
		isCreateCourseOpen = false;
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

		source.addEventListener('profile_picture', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as { profilePicture: string | null };
			currentProfilePicture = payload.profilePicture;
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
			<UserDisplay {user} onProfilePictureUpdated={handleProfilePictureUpdated} />
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
			<button class="add-course" on:click={createCourse}>+</button>
		{/if}
	</div>
	{#if isCreateCourseOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="course-create-backdrop" on:click={closeCreateCourse}>
			<div class="course-create-modal" on:click|stopPropagation>
				<CourseCreate />
			</div>
		</div>
	{/if}
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

	.add-course {
		border-radius: 50%;
		width: 32px;
		height: 32px;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		background-color: var(--primary-color);
		color: var(--text-color);
		border: none;
		cursor: pointer;

		position: absolute;
		bottom: 15%;
		left: 42.5%;
	}

	.course-create-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.course-create-modal {
		width: min(92vw, 640px);
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		padding: 1rem;
	}
</style>
