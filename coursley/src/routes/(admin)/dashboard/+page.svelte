<script lang="ts">
	export let data;

	// TODO: Check edge cases for code execution, such as infinite loops, memory abuse, fork bombs, file system access, network access, etc.
	const edgeCases = [
  {
    name: "Infinite loop",
    code: `
while True:
    pass
`
  },
  {
    name: "Memory abuse",
    code: `
a = []
while True:
    a.append("A"*10**6)
`
  },
  {
    name: "Fork bomb",
    code: `
import os
while True:
    os.fork()
`
  },
  {
    name: "File system access",
    code: `
import os
print(os.listdir("/"))
`
  },
  {
    name: "Network access",
    code: `
import requests
requests.get("https://google.com")
`
  },
  {
    name: "Normal code",
    code: `
print("Hello world")
`
  }
]

	type Result = {
    name: string;
    stdout?: string;
    stderr?: string;
    error?: string;
  };

  let results: Result[] = [];
  let running = false;

  async function testEdgeCases() {
    running = true;
    results = [];

    for (const test of edgeCases) {
      let result: Result = { name: test.name };

      try {
        const res = await fetch("http://localhost:8000/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: test.code })
        });

        const data = await res.json();
        result = { ...result, ...data };
      } catch (err: any) {
        result.error = err.message;
      }

      results = [...results, result]; // update live
    }

    running = false;
  }
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

<button type="button" onclick={testEdgeCases} disabled={running}>
	{running ? "Testing..." : "Test Edge Cases"}
</button>

{#if results.length > 0}
	<h3>Test Results:</h3>
	<ul>
		{#each results as result}
			<li>
				<strong>{result.name}</strong>
				{#if result.stdout}
					<p>Output: {result.stdout}</p>
				{/if}
				{#if result.stderr}
					<p>Error: {result.stderr}</p>
				{/if}
				{#if result.error}
					<p>API Error: {result.error}</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

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
