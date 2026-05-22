<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	export let form;

	let isSubmitting = false;

	const handleEnhance = () => {
		isSubmitting = true;

		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			isSubmitting = false;
		};
	};
</script>

<main>
	<div class="container">
		<div class="card">
			<h1>Create Account</h1>
			<p class="subtitle">Join Coursley today</p>

			<form method="POST" action="?/register" use:enhance={handleEnhance} class="form">
				<div class="form-group">
					<label for="email">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						autocomplete="off"
						placeholder="Enter your email"
						required
					/>
				</div>

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

				<button type="submit" class="btn-primary" disabled={isSubmitting} aria-busy={isSubmitting}>
					{#if isSubmitting}
						<span class="spinner"></span>
						Creating account...
					{:else}
						Create Account
					{/if}
				</button>
			</form>

			{#if form?.error}
				<div class="error-message">
					{#if Array.isArray(form.error)}
						<ul>
							{#each form.error as error (error)}
								<li>{error}</li>
							{/each}
						</ul>
					{:else}
						<p>{form.error}</p>
					{/if}
				</div>
			{/if}

			<div class="divider"></div>

			<p class="auth-link">
				Already have an account? <a href={resolve('/login')}>Sign in</a>
			</p>
		</div>
	</div>
</main>

<style>
	main {
		--primary-color: #4a90e2;
		--secondary-background-color: #e5e7eb;
		--background-color: #ffffff;
		--text-color: #1f2937;
		--accent-color: #e94e77;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 100vh;
		flex: 1;
		padding: clamp(1rem, 4vw, 2.5rem);
		box-sizing: border-box;
		background:
			radial-gradient(circle at top, rgba(74, 144, 226, 0.16), transparent 35%),
			linear-gradient(180deg, rgba(245, 247, 250, 0.95), rgba(238, 243, 249, 0.9));
	}

	.container {
		width: 100%;
		max-width: 1040px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card {
		width: min(100%, 430px);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(12px);
		border-radius: 1.25rem;
		padding: 2rem;
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.45);
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
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.875rem;
		background: linear-gradient(135deg, var(--primary-color), #2e6fbf);
		color: white;
		border: none;
		border-radius: 0.8rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.16s ease,
			opacity 0.16s ease,
			box-shadow 0.16s ease;
		font-family: inherit;
		width: 100%;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 14px 30px rgba(74, 144, 226, 0.28);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-primary:disabled {
		cursor: progress;
		opacity: 0.82;
		box-shadow: none;
	}

	.spinner {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 999px;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: white;
		animation: spin 0.8s linear infinite;
	}

	.error-message {
		margin-top: 1rem;
		padding: 0.875rem;
		background-color: rgba(233, 78, 119, 0.1);
		border-left: 4px solid var(--accent-color);
		border-radius: 4px;
		color: var(--accent-color);
	}

	.error-message p,
	.error-message ul {
		margin: 0;
		font-size: 0.9rem;
		padding-left: 1rem;
	}

	.error-message li {
		margin: 0.25rem 0;
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		main {
			padding: 0.75rem;
		}

		.card {
			padding: 1.25rem;
			border-radius: 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 0.9rem;
		}
	}
</style>
