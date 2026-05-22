<script lang="ts">
	import { onMount } from 'svelte';
	import UserDisplay from '../user_display.svelte';
	import CourseCreate from '../course_create.svelte';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	export let data;

	let currentTheme: 'light' | 'dark' = data.user?.theme ?? 'light';
	let currentProfilePicture: string | null = data.user?.profilePicture ?? null;
	let currentRole: string = data.user?.role ?? 'student';
	let isCreateCourseOpen = false;
	let courses: Array<{ id: string; title: string; studentCount?: number; isInstructor?: boolean }> =
		data.courses ?? [];
	$: user = data.user
		? {
				...data.user,
				theme: currentTheme,
				profilePicture: currentProfilePicture,
				role: currentRole
			}
		: null;
	$: pathname = $page.url.pathname;
	$: segments = pathname.split('/').filter(Boolean);
	$: currentCourseId = segments[0] === 'courses' ? segments[1] : null;
	$: currentCourse = currentCourseId
		? courses.find((course: { id: string; title: string }) => course.id === currentCourseId)
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

		source.addEventListener('user_role_changed', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as { role: string };
			currentRole = payload.role;
		});

		source.addEventListener('student_count_changed', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as { courseId: string; count: number };

			// Update the student count for the matching course
			courses = courses.map((course) =>
				course.id === payload.courseId ? { ...course, studentCount: payload.count } : course
			);
		});

		return () => {
			source.close();
		};
	});
</script>

<div class="auth-layout">
	<div class="topbar">
		<h1
			class="title"
			style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;"
		>
			<a href={resolve('/courses')}>Coursley</a> |
			<nav>
				{#if currentCourse}
					<a href={resolve(`/courses/${currentCourse.id}`)}>{currentCourse.title}</a>
				{/if}
			</nav>
		</h1>
		{#if data.user}
			<UserDisplay {user} onProfilePictureUpdated={handleProfilePictureUpdated} />
		{/if}
	</div>
	<div class="sidebar">
		<nav>
			<ul>
				{#each courses as course (course.id)}
					<li class:instructor-course={course.isInstructor}>
						<a
							href={resolve(`/courses/${course.id}`)}
							title={course.isInstructor ? 'You are the instructor' : 'Enrolled as student'}
							>{course.title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
		{#if currentRole === 'instructor'}
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
		display: grid;
		grid-template-columns: minmax(220px, 240px) minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		gap: 1rem;
		width: min(100%, 1440px);
		min-height: 100vh;
		padding: 1rem;
		margin: 0 auto;
		box-sizing: border-box;
		background-color: var(--secondary-background-color);
		align-items: start;
	}

	main {
		grid-column: 2;
		grid-row: 2;
		position: relative;
		width: 100%;
		min-width: 0;
		height: auto;
		padding: 0;
	}

	.topbar {
		display: flex;
		flex-direction: row;
		grid-column: 1 / -1;
		position: sticky;
		top: 0;
		z-index: 20;
		width: 100%;
		min-height: 4.5rem;
		padding: 0.95rem 1.1rem;
		background-color: #333333;
		color: #ffffff;
		text-align: center;
		justify-content: space-between;
		align-items: center;
		border-radius: 1rem;
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
	}

	.sidebar {
		grid-column: 1;
		grid-row: 2;
		position: sticky;
		top: 5.5rem;
		width: 100%;
		height: calc(100vh - 6.75rem);
		background-color: var(--background-color);
		padding: 1rem;
		border-radius: 1rem;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.sidebar ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sidebar li {
		margin: 0 0 0.5rem 0;
	}

	.sidebar a {
		display: block;
		width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.instructor-course a::before {
		content: '👨‍🏫 ';
		margin-right: 0.25rem;
	}

	.title {
		font-size: clamp(1.2rem, 2vw, 1.5rem);
		position: relative;
		left: 0;
		margin: 0;
		flex-wrap: wrap;
		justify-content: flex-start !important;
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
		position: static;
		margin-top: auto;
		align-self: flex-start;
	}

	.course-create-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: auto;
	}

	.course-create-modal {
		width: min(100%, 640px);
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		padding: 1rem;
		max-height: 90vh;
		overflow: auto;
	}

	@media (max-width: 900px) {
		.auth-layout {
			grid-template-columns: 1fr;
			padding: 0.75rem;
		}

		.topbar {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			position: sticky;
			top: 0.75rem;
		}

		.sidebar {
			grid-column: 1;
			grid-row: auto;
			position: static;
			height: auto;
		}

		main {
			grid-column: 1;
			grid-row: auto;
		}

		.sidebar a {
			white-space: normal;
		}
	}

	@media (max-width: 640px) {
		.auth-layout {
			padding: 0.5rem;
		}

		.topbar {
			padding: 0.85rem 0.95rem;
		}

		.title {
			font-size: 1rem;
		}
	}
</style>
