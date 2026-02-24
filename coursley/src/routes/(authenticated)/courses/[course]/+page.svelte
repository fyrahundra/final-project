<script>
	export let data;
</script>

<h1>{data.course?.title}</h1>
<h3>{data.course?.description}</h3>

<h2>Assignments</h2>
<ul>
	{#each data.assignments as assignment}
		<li>
			<a href={`/courses/${data.course?.id}/assignments/${assignment.id}`}>{assignment.title}</a>
		</li>
	{/each}
</ul>

<form action="?/createAssignment" method="POST">
	<label for="title">Assignment Title:</label>
	<input type="text" name="title" placeholder="Assignment Title" required />
	<label for="description">Assignment Description:</label>
	<input type="text" name="description" placeholder="Assignment Description" required />
	<label for="content">Assignment Content:</label>
	<input type="text" name="content" placeholder="Assignment Content" required />
	<button type="submit">Create Assignment</button>
</form>
