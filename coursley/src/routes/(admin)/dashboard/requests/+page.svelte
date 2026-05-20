<script lang="ts">
	import { enhance } from '$app/forms';
	import { onDestroy, onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	export let data;
	export let form;

	let message = '';
	let timeoutId: ReturnType<typeof setTimeout>;
	let requests = data.adrequests;
	let eventSource: EventSource | null = null;

	onMount(() => {
		// Connect to SSE endpoint
		eventSource = new EventSource('/streams');

		eventSource.addEventListener('admin_request_changed', (event) => {
			try {
				const payload = JSON.parse(event.data);
				const { event: actionType, requestId } = payload;

				if (actionType === 'created') {
					// Refresh the requests list when a new one is created
					invalidateAll();
				} else if (actionType === 'approved' || actionType === 'rejected') {
					// Remove the request from the display when it's approved or rejected
					requests = requests.filter((req) => req.id !== requestId);
				}
			} catch (error) {
				console.error('Error parsing admin request event:', error);
			}
		});

		eventSource.addEventListener('error', () => {
			console.error('SSE connection error');
			if (eventSource) {
				eventSource.close();
			}
		});
	});

	function handleFormSuccess() {
		message = form?.success || '';
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			message = '';
		}, 3000);
	}

	$: if (form?.success) {
		handleFormSuccess();
	}

	$: requests = data.adrequests;

	onDestroy(() => {
		clearTimeout(timeoutId);
		if (eventSource) {
			eventSource.close();
		}
	});
</script>

<section class="page-header">
	<div>
		<p class="eyebrow">Request queue</p>
		<h2>Admin Requests</h2>
	</div>
	<div class="count-pill">{requests.length} pending</div>
</section>

{#if message}
	<div class="message success">{message}</div>
{/if}

{#if form?.error}
	<div class="message error">{form?.error}</div>
{/if}

<div class="table-shell">
	<table>
		<thead>
			<tr>
				<th>User</th>
				<th>Email</th>
				<th>Role</th>
				<th>Request Type</th>
				<th>Submitted</th>
				<th>Status</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each requests as adrequest (adrequest.id)}
				<tr>
					<td>{adrequest.user?.name ?? 'Unknown'}</td>
					<td>{adrequest.user?.email ?? '-'}</td>
					<td><span class="role-chip">{adrequest.user?.role ?? '-'}</span></td>
					<td>{adrequest.type}</td>
					<td>{new Date(adrequest.createdAt).toLocaleString()}</td>
					<td><span class="status-chip">{adrequest.status}</span></td>
					<td class="actions-cell">
						<form action="?/approve" method="POST" use:enhance>
							<input type="hidden" name="requestId" value={adrequest.id} />
							<input type="hidden" name="userId" value={adrequest.userId} />
							<button type="submit" class="action-button approve">Approve</button>
						</form>
						<form action="?/reject" method="POST" use:enhance>
							<input type="hidden" name="requestId" value={adrequest.id} />
							<input type="hidden" name="userId" value={adrequest.userId} />
							<button type="submit" class="action-button reject">Reject</button>
						</form>
					</td>
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
		background: rgba(245, 158, 11, 0.14);
		color: #b45309;
		font-weight: 700;
	}

	.message {
		padding: 0.9rem 1rem;
		margin: 0 0 1rem 0;
		border-radius: 1rem;
		font-weight: 600;
	}

	.message.success {
		background: rgba(16, 185, 129, 0.12);
		color: #0f766e;
	}

	.message.error {
		background: rgba(239, 68, 68, 0.12);
		color: #b91c1c;
	}

	.table-shell {
		overflow: auto;
		border-radius: 1.1rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 920px;
	}

	th,
	td {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
		text-align: left;
		font-size: 0.9rem;
		vertical-align: top;
	}

	th {
		background: rgba(15, 23, 42, 0.95);
		color: white;
		position: sticky;
		top: 0;
	}

	tbody tr:nth-child(even) {
		background: rgba(248, 250, 252, 0.8);
	}

	tbody tr:hover {
		background: rgba(74, 144, 226, 0.06);
	}

	.role-chip,
	.status-chip {
		display: inline-flex;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		font-weight: 700;
	}

	.role-chip {
		background: rgba(74, 144, 226, 0.12);
		color: var(--primary-color);
	}

	.status-chip {
		background: rgba(245, 158, 11, 0.14);
		color: #b45309;
	}

	.actions-cell {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.action-button {
		padding: 0.6rem 0.9rem;
		border: none;
		border-radius: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.action-button.approve {
		background: rgba(16, 185, 129, 0.14);
		color: #0f766e;
	}

	.action-button.reject {
		background: rgba(239, 68, 68, 0.12);
		color: #b91c1c;
	}

	@media (max-width: 900px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
