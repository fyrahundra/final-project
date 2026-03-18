<script lang="ts">
	export let data;
</script>

<h2 class="page-title">Active Sessions</h2>

<table class="sessions-table">
	<thead>
		<tr>
			<th>User</th>
			<th>Email</th>
			<th>Role</th>
			<th>Device</th>
			<th>Token</th>
			<th>Created At</th>
			<th>Last Used</th>
			<th>Expires At</th>
            <th>Client Address</th>
		</tr>
	</thead>
	<tbody>
		{#each data.activeSessions as session (session.id)}
			<tr>
				<td>{session.user?.name ?? 'Unknown'}</td>
				<td>{session.user?.email ?? '-'}</td>
				<td>{session.user?.role ?? '-'}</td>
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

<style>
	.page-title {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.sessions-table {
		width: 100%;
		border-collapse: collapse;
		background: var(--background-color);
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.sessions-table th,
	.sessions-table td {
		padding: 0.5rem 1rem;
		border-bottom: 1px solid #ddd;
		text-align: left;
		font-size: 0.9rem;
	}

	.sessions-table th {
		background: var(--primary-color);
		color: var(--text-color);
	}

	.sessions-table tr:nth-child(even) {
		background: var(--secondary-background-color);
	}

	.sessions-table tr:hover {
		background: var(--hover-color);
	}

	.token-cell {
		font-family: monospace;
		font-size: 0.8rem;
		word-break: break-all;
	}
</style>
