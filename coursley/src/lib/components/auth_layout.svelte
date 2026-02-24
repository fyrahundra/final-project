<script>
	export let data;
</script>

<div class="auth-layout">
	<div class="topbar">
		<h1 class="title">Coursley</h1>
		{#if data.user}
			<div class="user-info">
				<h2>{data.user.name}</h2>

				<form action="/login?/logout" method="post" class="logout-button">
					<button type="submit">Logout</button>
				</form>
			</div>
		{/if}
	</div>
	<div class="sidebar">
		<nav>
			<ul>
				<h3>My Courses</h3>
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
		background-color: #f5f5f5;
	}

	main {
		position: absolute;
		top: 9%;
		left: 18%;
		width: 80%;
		height: 90%;
		padding: 1rem;
		background-color: #ffffff;
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
		background-color: #ffffff;
		padding: 1rem;
	}

	.logout-button {
		background: none;
		border: none;
		color: #ffffff;
		cursor: pointer;
		font-size: 1rem;
	}

	.logout-button:hover {
		text-decoration: underline;
	}

	.user-info {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
		position: relative;
		right: 1.5%;
	}

	.title {
		font-size: 1.5rem;
		position: relative;
		left: 1.5%;
	}
</style>
