<script lang="ts">
	import { resolve } from '$app/paths';

	export let data;

	const adminLinks = [
		{ href: '/dashboard', label: 'Overview' },
		{ href: '/dashboard/sessions', label: 'Sessions' },
		{ href: '/dashboard/requests', label: 'Requests' }
	] as const;
</script>

<div class="admin-layout">
	<header class="topbar">
		<div>
			<p class="eyebrow">Administration</p>
			<h1>Coursley Control</h1>
		</div>

		<div class="admin-user">
			<span>{data.user?.name ?? 'Admin'}</span>
			<span>{data.user?.email ?? ''}</span>
		</div>
	</header>

	<div class="shell">
		<aside class="sidebar">
			<nav>
				{#each adminLinks as link (link.href)}
					<a href={resolve(link.href)}>{link.label}</a>
				{/each}
			</nav>
		</aside>

		<main class="content">
			<slot></slot>
		</main>
	</div>
</div>

<style>
	.admin-layout {
		--primary-color: #4a90e2;
		--secondary-color: #f5f5f5;
		--text-color: #1f2937;
		--accent-color: #e94e77;
		--background-color: #ffffff;
		--secondary-background-color: #eef3f9;
		--card-color: #ffffff;
		--card-p: #334155;
		--hover-color: #e2e8f0;
		width: 100vw;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		background:
			radial-gradient(circle at top left, rgba(74, 144, 226, 0.2), transparent 30%),
			linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
		color: var(--text-color);
		padding: 1.5rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 1.25rem;
		background: rgba(255, 255, 255, 0.82);
		backdrop-filter: blur(12px);
		box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
		margin-bottom: 1.25rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem 0;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--primary-color);
	}

	.topbar h1 {
		margin: 0;
		font-size: 1.7rem;
	}

	.admin-user {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-size: 0.9rem;
		color: rgba(15, 23, 42, 0.7);
	}

	.shell {
		flex: 1;
		display: grid;
		grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
		min-height: 0;
	}

	.sidebar {
		position: sticky;
		top: 1.5rem;
		padding: 1rem;
		border-radius: 1.25rem;
		background: rgba(15, 23, 42, 0.9);
		color: white;
		box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
	}

	.sidebar nav {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.sidebar a {
		display: block;
		padding: 0.8rem 0.9rem;
		border-radius: 0.9rem;
		color: rgba(255, 255, 255, 0.92);
		text-decoration: none;
		font-weight: 600;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease,
			color 0.18s ease;
	}

	.sidebar a:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateX(2px);
		color: white;
	}

	.content {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0;
		min-height: 0;
	}

	@media (max-width: 900px) {
		.shell {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
		}

		.topbar {
			flex-direction: column;
			align-items: flex-start;
		}

		.admin-user {
			align-items: flex-start;
		}
	}
</style>
