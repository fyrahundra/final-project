const tests = [
	{
		name: 'Infinite loop',
		code: `while True:\n    pass`,
		expect: (result) => result.status === 408 && result.response?.error_code === 'timeout_exceeded'
	},
	{
		name: 'Memory abuse',
		code: `a = []\nwhile True:\n    a.append("A"*10**6)`,
		expect: (result) => result.status === 429 && result.response?.error_code === 'memory_exceeded'
	},
	{
		name: 'Fork bomb',
		code: `import os\nwhile True:\n    os.fork()`,
		expect: (result) =>
			result.status === 403 && result.response?.error_code === 'process_creation_disabled'
	},
	{
		name: 'File system access',
		code: `import os\nprint(os.listdir("/"))`,
		expect: (result) =>
			result.status === 403 && result.response?.error_code === 'filesystem_disabled'
	},
	{
		name: 'Network access',
		code: `import urllib.request\nresp = urllib.request.urlopen("https://example.com", timeout=5)\nprint("NET_OK", resp.status)`,
		// Some deployments allow outbound network while others block it by policy.
		expect: (result) => {
			if (result.status === 403) {
				return (result.response?.error_code || '').includes('network');
			}

			if (result.status === 200) {
				return !String(result.response?.stderr || '').includes('ModuleNotFoundError');
			}

			return false;
		}
	},
	{
		name: 'Normal code',
		code: `print("Hello world")`,
		expect: (result) =>
			result.status === 200 &&
			result.response?.exit_code === 0 &&
			String(result.response?.stdout || '').includes('Hello world')
	}
];

const timeoutMs = 8000;
const endpoint = 'http://localhost:8000/run';
const results = [];

for (const test of tests) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const started = Date.now();
	const result = { name: test.name };

	try {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code: test.code }),
			signal: controller.signal
		});

		const raw = await res.text();
		let data;
		try {
			data = JSON.parse(raw);
		} catch {
			data = { raw };
		}

		result.ok = res.ok;
		result.status = res.status;
		result.elapsedMs = Date.now() - started;
		result.response = data;
	} catch (err) {
		result.ok = false;
		result.elapsedMs = Date.now() - started;
		result.error = String(err?.message || err);
	} finally {
		clearTimeout(timer);
	}

	result.pass = test.expect(result);
	results.push(result);
}

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;

console.log(
	JSON.stringify(
		{
			summary: {
				total: results.length,
				passed,
				failed
			},
			results
		},
		null,
		2
	)
);

if (failed > 0) {
	process.exitCode = 1;
}
