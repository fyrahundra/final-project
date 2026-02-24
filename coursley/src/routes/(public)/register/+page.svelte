<script>
	import { enhance } from '$app/forms';

	export let data;
	export let form;
</script>

<main>
	<div>
		<h1>Register Page</h1>
		<form method="POST" action="?/register" use:enhance>
			<label for="email">Email:</label>
			<input type="email" id="email" name="email" autocomplete="off" required />
			<label for="username">Username:</label>
			<input type="text" id="username" name="username" autocomplete="off" required />
			<label for="password">Password:</label>
			<input type="password" id="password" name="password" autocomplete="off" required />
			<button type="submit">Register</button>
		</form>
		{#if form?.error}
			{#if Array.isArray(form.error)}
				<ul>
					{#each form.error as error}
						<li>{error}</li>
					{/each}
				</ul>
			{:else}
				<p>{form.error}</p>
			{/if}
		{/if}
	</div>

	<h3>Registered Users:</h3>
	{#each data.users as user}
		<p>{user.name} - {user.email} - {user.role} - {user.passwordHash}</p>
	{/each}

	<h3>Sessions:</h3>
	{#each data.sessions as session}
		<p>{session.token}</p>
	{/each}

	<h3>Current User:</h3>
	{#if data.user}
		<p>{data.user.name} - {data.user.email} - {data.session?.token}</p>
	{:else}
		<p>No user is currently logged in.</p>
	{/if}
</main>
