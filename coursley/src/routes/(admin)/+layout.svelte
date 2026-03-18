<script>
    import AdminLayout from '$lib/components/layouts/admin_layout.svelte';
    export let data;
</script>

<AdminLayout {data}>
    <slot></slot>
</AdminLayout>