<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let loading = false;
	let message = '';
	let messageType: 'success' | 'error' | '' = '';

	async function handleCreateCourse(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		messageType = '';
		loading = true;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch('/api/courses', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				message = result?.message ?? 'Failed to create course';
				messageType = 'error';
				return;
			}

			message = result?.message ?? 'Course created successfully';
			messageType = 'success';
			form.reset();
			await invalidateAll();
		} catch (error) {
			message = 'An unexpected error occurred. Please try again.';
			messageType = 'error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="course-create">
	<h1 class="title">Create Course</h1>
	<form class="course-form" method="POST" action="/api/courses" on:submit={handleCreateCourse}>
		<input type="text" name="title" placeholder="Course Title" required />
		<textarea name="description" placeholder="Course Description" required></textarea>
		<button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Course'}</button>
	</form>
	{#if message}
		<p class={`status ${messageType}`}>{message}</p>
	{/if}
</div>

<style>
	.course-create {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	.title {
		text-align: center;
		margin-bottom: 20px;
		color: #333333;
	}

	.course-form {
		display: flex;
		flex-direction: column;
	}

	.course-form input,
	.course-form textarea {
		margin-bottom: 10px;
		padding: 10px;
		font-size: 1rem;
	}

	.course-form button {
		padding: 10px;
		font-size: 1rem;
		background-color: #0070f3;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.course-form button:hover {
		background-color: #005bb5;
	}

	.course-form button:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	.status {
		margin-top: 12px;
		text-align: center;
		font-size: 0.95rem;
	}

	.status.success {
		color: #0f766e;
	}

	.status.error {
		color: #dc2626;
	}
</style>
