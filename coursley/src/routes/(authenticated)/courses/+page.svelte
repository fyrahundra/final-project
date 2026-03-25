<script>
	import { invalidateAll } from '$app/navigation';

	let joinId = '';
	let loading = false;
	let message = '';
	let messageType = '';

	const handleJoinCourse = async () => {
		if (!joinId.trim()) {
			message = 'Please enter a join ID';
			messageType = 'error';
			return;
		}

		loading = true;
		message = '';

		try {
			const formData = new FormData();
			formData.append('action', 'join');
			formData.append('joinId', joinId);

			const response = await fetch('/api/courses', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok) {
				message = 'Successfully joined course!';
				messageType = 'success';
				joinId = '';
				await invalidateAll();
			} else {
				message = result.message || 'Failed to join course';
				messageType = 'error';
			}
		} catch (error) {
			message = 'An error occurred. Please try again.';
			messageType = 'error';
		} finally {
			loading = false;
		}
	};

	export let data;
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-8">My Courses</h1>

	<!-- Join Course Section -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-8">
		<h2 class="text-xl font-semibold mb-4">Join a Course</h2>
		<p class="text-gray-600 mb-4">
			Enter the course ID provided by your instructor to join a course.
		</p>

		<div class="flex gap-2 mb-4">
			<input
				type="text"
				placeholder="Enter course ID"
				bind:value={joinId}
				disabled={loading}
				class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				type="button"
				on:click={handleJoinCourse}
				disabled={loading}
				class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
			>
				{loading ? 'Joining...' : 'Join Course'}
			</button>
		</div>

		{#if message}
			<div
				class={`p-3 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
			>
				{message}
			</div>
		{/if}
	</div>

	<br>

	<!-- Enrolled Courses Section -->
	<div class="courses-section">
		<h2 class="courses-header">Enrolled Courses ({data.courses.length})</h2>

		{#if data.courses.length > 0}
			<div class="courses-scroll">
				{#each data.courses as course (course.id)}
					<a
						href={`/courses/${course.id}`}
						class="course-card"
					>
						<div class="course-content">
							<h3>{course.title}</h3>
							<p>{course.description || 'No description'}</p>
						</div>
						<p class="course-id">ID: {course.joinId}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p>You are not enrolled in any courses yet.</p>
				<p>Join a course using the join ID to get started!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background-color: #f5f5f5;
	}

	.courses-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.courses-header {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.courses-scroll {
		max-height: min(58vh, 560px);
		overflow-y: auto;
		padding-right: 0.25rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.courses-scroll::-webkit-scrollbar {
		display: none;
	}

	.course-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: flex-start;
		background: var(--card-color);
		border: 1px solid var(--text-color);
		border-radius: 0.75rem;
		padding: 1rem;
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.15s ease;
	}

	.course-card:hover {
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	}

	.course-content h3 {
		margin: 0 0 0.35rem;
		font-size: 1rem;
	}

	.course-content p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--card-p);
	}

	.course-id {
		margin: 0;
		font-size: 0.75rem;
		color: var(--card-p);
		white-space: nowrap;
	}

	.empty-state {
		background: var(--card-color);
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.empty-state p {
		margin: 0;
	}

	.empty-state p + p {
		margin-top: 0.35rem;
		color: var(--card-p);
		font-size: 0.9rem;
	}
</style>
