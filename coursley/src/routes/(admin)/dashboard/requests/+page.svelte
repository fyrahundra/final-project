<script lang="ts">
    import { enhance } from '$app/forms';
    import { onDestroy } from 'svelte';
    
    export let data;
    export let form;

    let message = '';
    let timeoutId: ReturnType<typeof setTimeout>;

    $: if (form?.success) {
        message = form.success || '';
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            message = '';
        }, 3000);
    }

    onDestroy(() => {
        clearTimeout(timeoutId);
    });
</script>

<h2 class="page-title">Admin Requests</h2>

{#if message}
    <div class="message">{message}</div>
{/if}

{#if form?.error}
    <div class="message error">{form?.error}</div>
{/if}

<table>
    <thead>
        <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Request Type</th>
            <th>Submitted At</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        {#each data.adrequests as adrequest (adrequest.id)}
            <tr>
                <td>{adrequest.user?.name ?? 'Unknown'}</td>
                <td>{adrequest.user?.email ?? '-'}</td>
                <td>{adrequest.user?.role ?? '-'}</td>
                <td>{adrequest.type}</td>
                <td>{new Date(adrequest.createdAt).toLocaleString()}</td>
                <td>{adrequest.status}</td>
                <td>
                    <form action="?/approve" method="POST" use:enhance>
                        <input type="hidden" name="requestId" value={adrequest.id} />
                        <input type="hidden" name="userId" value={adrequest.userId} />
                        <button type="submit">Approve</button>
                    </form>
                    <form action="?/reject" method="POST" use:enhance>
                        <input type="hidden" name="requestId" value={adrequest.id} />
                        <input type="hidden" name="userId" value={adrequest.userId} />
                        <button type="submit">Reject</button>
                    </form>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    .message {
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
    }
    .message.error {
        background-color: #f8d7da;
        color: #721c24;
    }
</style>