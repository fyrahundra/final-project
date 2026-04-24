<script>
	import { enhance } from '$app/forms';
	export let form;
</script>

<main>
	<div class="container">
		<div class="card">
			<h1>Welcome Back</h1>
			<p class="subtitle">Sign in to your account</p>

			<form method="POST" action="?/login" use:enhance class="form">
				<div class="form-group">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						autocomplete="off"
						placeholder="Enter your username"
						required
					/>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						autocomplete="off"
						placeholder="Enter your password"
						required
					/>
				</div>

				<button type="submit" class="btn-primary">Sign In</button>
			</form>

			{#if form?.error}
				<div class="error-message">
					<p>{form.error}</p>
				</div>
			{/if}

			<div class="divider"></div>

			<p class="auth-link">
				Don't have an account? <a href="/register">Create one</a>
			</p>
		</div>
	</div>
</main>

<style>
	main {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100vw;
		flex: 1;
		padding: 2rem;
	}

	.container {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card {
		width: 100%;
		max-width: 400px;
		background-color: var(--card-color);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: var(--text-color);
		text-align: center;
	}

	.subtitle {
		margin: 0 0 1.5rem 0;
		text-align: center;
		color: var(--text-color);
		opacity: 0.7;
		font-size: 0.95rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		color: var(--text-color);
		font-size: 0.95rem;
	}

	input {
		padding: 0.75rem;
		border: 2px solid var(--secondary-background-color);
		border-radius: 6px;
		background-color: var(--background-color);
		color: var(--text-color);
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
		font-family: inherit;
	}

	input:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	input::placeholder {
		color: var(--text-color);
		opacity: 0.5;
	}

	.btn-primary {
		padding: 0.875rem;
		background-color: var(--primary-color);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s, transform 0.1s;
		font-family: inherit;
	}

	.btn-primary:hover {
		background-color: #3a7bc8;
		transform: translateY(-1px);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.error-message {
		margin-top: 1rem;
		padding: 0.875rem;
		background-color: rgba(233, 78, 119, 0.1);
		border-left: 4px solid var(--accent-color);
		border-radius: 4px;
		color: var(--accent-color);
	}

	.error-message p {
		margin: 0;
		font-size: 0.9rem;
	}

	.divider {
		height: 1px;
		background-color: var(--secondary-background-color);
		margin: 1.5rem 0;
	}

	.auth-link {
		text-align: center;
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-color);
	}

	.auth-link a {
		color: var(--primary-color);
		font-weight: 600;
		text-decoration: none;
		transition: text-decoration 0.2s;
	}

	.auth-link a:hover {
		text-decoration: underline;
	}
</style>
