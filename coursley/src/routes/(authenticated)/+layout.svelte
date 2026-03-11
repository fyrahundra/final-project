<script>
	import AuthLayout from '$lib/components/layouts/auth_layout.svelte';

	export let data;
</script>

<AuthLayout {data}>
	<slot></slot>
</AuthLayout>
