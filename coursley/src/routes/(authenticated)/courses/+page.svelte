<script>
	import { enhance } from '$app/forms';
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
			Enter the join ID provided by your instructor to join a course.
		</p>

		<div class="flex gap-2 mb-4">
			<input
				type="text"
				placeholder="Enter join ID"
				bind:value={joinId}
				disabled={loading}
				class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
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

	<!-- Enrolled Courses Section -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Enrolled Courses ({data.courses.length})</h2>

		{#if data.courses.length > 0}
			<div class="flex flex-col gap-4">
				{#each data.courses as course (course.id)}
					<a
						href={`/courses/${course.id}`}
						class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
					>
						<div>
							<h3 class="text-lg font-semibold">{course.title}</h3>
							<p class="text-gray-600 text-sm">{course.description || 'No description'}</p>
						</div>
						<p class="text-xs text-gray-500 whitespace-nowrap ml-4">ID: {course.joinId}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
				<p>You are not enrolled in any courses yet.</p>
				<p class="text-sm">Join a course using the join ID to get started!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background-color: #f5f5f5;
	}
</style>
