<script lang="ts">
	export let data;
</script>

<section class="page-header">
	<div>
		<p class="eyebrow">Session monitor</p>
		<h2>Active Sessions</h2>
	</div>
	<div class="count-pill">{data.activeSessions.length} active</div>
</section>

<div class="table-shell">
	<table class="sessions-table">
		<thead>
			<tr>
				<th>User</th>
				<th>Email</th>
				<th>Role</th>
				<th>Device</th>
				<th>Token</th>
				<th>Created</th>
				<th>Last Used</th>
				<th>Expires</th>
				<th>IP</th>
			</tr>
		</thead>
		<tbody>
			{#each data.activeSessions as session (session.id)}
				<tr>
					<td>{session.user?.name ?? 'Unknown'}</td>
					<td>{session.user?.email ?? '-'}</td>
					<td><span class="role-chip">{session.user?.role ?? '-'}</span></td>
					<td>{session.deviceName ?? '-'}</td>
					<td class="token-cell">{session.token}</td>
					<td>{new Date(session.createdAt).toLocaleString()}</td>
					<td>{new Date(session.lastUsedAt).toLocaleString()}</td>
					<td>{new Date(session.expiresAt).toLocaleString()}</td>
					<td>{session.clientAddress ?? '-'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem 0;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--primary-color);
	}

	h2 {
		margin: 0;
		font-size: 1.8rem;
	}

	.count-pill {
		padding: 0.55rem 0.8rem;
		border-radius: 999px;
		background: rgba(74, 144, 226, 0.12);
		color: var(--primary-color);
		font-weight: 700;
	}

	.table-shell {
		overflow: auto;
		border-radius: 1.1rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
	}

	.sessions-table {
		width: 100%;
		border-collapse: collapse;
		min-width: 980px;
	}

	.sessions-table th,
	.sessions-table td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
		text-align: left;
		font-size: 0.9rem;
		vertical-align: top;
	}

	.sessions-table th {
		background: rgba(15, 23, 42, 0.95);
		color: white;
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.sessions-table tbody tr:nth-child(even) {
		background: rgba(248, 250, 252, 0.8);
	}

	.sessions-table tr:hover {
		background: rgba(74, 144, 226, 0.06);
	}

	.role-chip {
		display: inline-flex;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		background: rgba(16, 185, 129, 0.12);
		color: #0f766e;
		font-weight: 700;
	}

	.token-cell {
		font-family: monospace;
		font-size: 0.8rem;
		max-width: 260px;
		word-break: break-all;
	}

	@media (max-width: 900px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
