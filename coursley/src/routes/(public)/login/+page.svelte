<script>
	import { enhance } from '$app/forms';
	export let data;
	export let form;
</script>

<main>
	<div>
		<h1>Login Page</h1>
		<form method="POST" action="?/login" use:enhance>
			<label for="username">Username:</label>
			<input type="text" id="username" name="username" autocomplete="off" required />
			<label for="password">Password:</label>
			<input type="password" id="password" name="password" autocomplete="off" required />
			<button type="submit">Login</button>
		</form>
		{#if form?.error}
			<p>{form.error}</p>
		{/if}
		{#if form?.success}
			<p>Login successful. Hello {form.user.email}</p>
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
