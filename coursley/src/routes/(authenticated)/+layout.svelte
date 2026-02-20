<script>
    import AuthLayout from '$lib/components/auth_layout.svelte';

    export let data
</script>

<AuthLayout {data}>
    <slot></slot>
</AuthLayout>